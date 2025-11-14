// server.js
// CityRun Geo Engine - Loop route with optional crosswalk penalty

const express = require("express");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const Redis = require("ioredis");

const app = express();
app.use(express.json());
app.use(cookieParser());

// --- Redis (지금은 세션/캐시용, 로직에서 직접 쓰진 않음) ---
const redis = new Redis({
  host: process.env.REDIS_HOST || "cityrun-redis",
  port: 6379,
});

// --- PostGIS / pgRouting 연결 ---
const pool = new Pool({
  user: process.env.PG_USER || "cjh",
  host: process.env.PG_HOST || "cityrun-postgis",
  database: process.env.PG_DB || "osm_data",
  password: process.env.PG_PASSWORD || "2323",
  port: Number(process.env.PG_PORT || 5432),
});

// --- 상수 설정 ---
const CROSSWALK_PENALTY_M = 150.0; // crosswalk 1개당 150m 정도 페널티
const CANDIDATE_VIA_LIMIT = 15; // 중간 지점 후보 개수

// “최종 루프 거리”를 목표 거리와 비교할 때 허용 비율
// 예: target = 5km → [3km, 7km] 사이 아니면 이상치로 간주
const VIA_DISTANCE_RATIO_MIN = 0.6;
const VIA_DISTANCE_RATIO_MAX = 1.4;

// 거리당 허용 가능한 최대 횡단보도 개수 (거칠게 튜닝용)
// 예: 5km * 12 = 60개를 넘으면 이상치로 본다.
const MAX_CROSSWALKS_PER_KM = 12;

// --- Edge SQL Builder ---
// 1) 순수 거리 기반 (driving distance용)
const buildDistanceEdgeSql = () => `
  SELECT
    gid AS id,
    source,
    target,
    length_m AS cost,
    length_m AS reverse_cost
  FROM ways
`;

// 2) 경로 선택용 (횡단보도 패널티 적용 가능)
const buildRouteEdgeSql = (avoidCrosswalks) => {
  if (!avoidCrosswalks) {
    // 패널티 없이 순수 거리 기준
    return `
      SELECT
        gid AS id,
        source,
        target,
        length_m AS cost,
        length_m AS reverse_cost
      FROM ways
    `;
  }

  // 횡단보도 패널티 적용
  return `
    SELECT
      w.gid AS id,
      w.source,
      w.target,
      (w.length_m + COALESCE(wc.cross_count, 0) * ${CROSSWALK_PENALTY_M}) AS cost,
      (w.length_m + COALESCE(wc.cross_count, 0) * ${CROSSWALK_PENALTY_M}) AS reverse_cost
    FROM ways w
    LEFT JOIN ways_crosswalks wc
      ON wc.edge_id = w.gid
  `;
};

// --- 루프 경로 (start → via → start) 한 번 계산하는 헬퍼 ---
async function computeLoopRoute(
  pool,
  startNodeId,
  viaNodeId,
  targetDistanceM,
  avoidCrosswalks
) {
  const routeEdgeSql = buildRouteEdgeSql(avoidCrosswalks);
  const safeRouteEdgeSql = routeEdgeSql.replace(/'/g, "''");

  const loopSql = `
    WITH
      out_path AS (
        SELECT * FROM pgr_dijkstra(
          '${safeRouteEdgeSql}'::text,
          $1::bigint,
          $2::bigint,
          false
        )
      ),
      back_path AS (
        SELECT * FROM pgr_dijkstra(
          '${safeRouteEdgeSql}'::text,
          $2::bigint,
          $1::bigint,
          false
        )
      ),
      all_edges AS (
        SELECT edge FROM out_path WHERE edge <> -1
        UNION ALL
        SELECT edge FROM back_path WHERE edge <> -1
      ),
      joined AS (
        SELECT
          w.gid,
          w.length_m,
          COALESCE(wc.cross_count, 0) AS cross_count,
          w.the_geom
        FROM ways w
        JOIN all_edges e ON e.edge = w.gid
        LEFT JOIN ways_crosswalks wc
          ON wc.edge_id = w.gid
      )
    SELECT
      SUM(length_m)        AS total_distance_m,
      SUM(cross_count)     AS total_crosswalks,
      ST_AsGeoJSON(
        ST_Collect(the_geom)
      )                    AS geomjson
    FROM joined;
  `;

  const { rows } = await pool.query(loopSql, [startNodeId, viaNodeId]);

  if (!rows || rows.length === 0 || !rows[0].geomjson) {
    return null;
  }

  const row = rows[0];
  const totalDistanceM = Number(row.total_distance_m || 0);
  const totalCrosswalks = Number(row.total_crosswalks || 0);
  const geomJson = row.geomjson;

  if (totalDistanceM <= 0) {
    return null;
  }

  const distanceError = Math.abs(totalDistanceM - targetDistanceM);

  let score;
  if (avoidCrosswalks) {
    const LAMBDA = 200.0; // crossing 1개를 "약 200m 거리 오차"로 본다
    score = distanceError + totalCrosswalks * LAMBDA;
  } else {
    score = distanceError; // 기본 모드: 거리만 맞추는 게 최우선
  }

  return {
    totalDistanceM,
    totalCrosswalks,
    geomJson,
    score,
  };
}

// --- 메인 엔드포인트: /score-route ---
app.post("/score-route", async (req, res) => {
  const { distanceKm, origin, prefs } = req.body || {};

  // 입력 값 검증
  if (
    !Array.isArray(origin) ||
    origin.length !== 2 ||
    typeof distanceKm !== "number" ||
    distanceKm <= 0
  ) {
    console.error("[/score-route] Invalid body:", req.body);
    return res.status(400).json({
      error:
        "Invalid input: origin must be [lat, lng], distanceKm must be positive number.",
    });
  }

  const startLat = origin[0];
  const startLng = origin[1];
  const targetDistanceM = distanceKm * 1000;
  const halfDistanceM = targetDistanceM / 2;

  const avoidCrosswalks = !!(prefs && prefs.minimizeCrosswalks);

  console.log(
    `[/score-route] origin=(${startLat}, ${startLng}), target=${targetDistanceM}m, prefs=${JSON.stringify(
      prefs || {}
    )}, avoidCrosswalks=${avoidCrosswalks}`
  );

  try {
    // 1) 출발지에 가장 가까운 Vertex 찾기
    const findStartNodeSql = `
      SELECT id
      FROM ways_vertices_pgr
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
    `;
    const startNodeResult = await pool.query(findStartNodeSql, [
      startLng,
      startLat,
    ]);

    if (!startNodeResult.rows.length) {
      return res
        .status(400)
        .json({ error: "출발지 근처의 경로 탐색용 노드를 찾을 수 없습니다." });
    }

    const startNodeId = Number(startNodeResult.rows[0].id);
    console.log(`[/score-route] startNodeId = ${startNodeId}`);

    // 2) pgr_drivingdistance 로 "목표 거리의 절반" 기준으로 후보 노드 찾기
    const distanceEdgeSql = buildDistanceEdgeSql();
    const safeDistanceEdgeSql = distanceEdgeSql.replace(/'/g, "''");

    const drivingSql = `
      WITH dd AS (
        SELECT * FROM pgr_drivingdistance(
          '${safeDistanceEdgeSql}'::text,
          $1::bigint,
          $2::double precision,
          false
        )
      )
      SELECT DISTINCT
        node,
        agg_cost,
        ABS(agg_cost - $2) AS orderCost
      FROM dd
      ORDER BY orderCost
      LIMIT ${CANDIDATE_VIA_LIMIT};
    `;

    const drivingResult = await pool.query(drivingSql, [
      startNodeId,
      halfDistanceM, // $2: halfDistanceM
    ]);

    if (!drivingResult.rows.length) {
      console.warn("[/score-route] via candidates not found");
      return res.status(404).json({
        error: `목표 거리(${distanceKm}km)에 맞는 중간 지점 후보를 찾지 못했습니다.`,
      });
    }

    const viaCandidates = drivingResult.rows.map((r) => ({
      nodeId: Number(r.node),
      aggCost: Number(r.agg_cost),
    }));

    console.log(
      "[/score-route] candidate via nodes:",
      viaCandidates.map((c) => `node=${c.nodeId}, agg=${c.aggCost.toFixed(1)}`)
    );

    // 3) 각 via 후보에 대해 start → via → start 루프 계산 후, 가장 좋은 후보 선택
    let best = null;

    for (const candidate of viaCandidates) {
      const viaNodeId = candidate.nodeId;
      try {
        const loopRoute = await computeLoopRoute(
          pool,
          startNodeId,
          viaNodeId,
          targetDistanceM,
          avoidCrosswalks
        );
        if (!loopRoute) {
          continue;
        }

        const { totalDistanceM, totalCrosswalks, geomJson, score } = loopRoute;
        console.log(
          `[/score-route] via=${viaNodeId} loop: dist=${totalDistanceM.toFixed(
            1
          )}, crosswalks=${totalCrosswalks}, score=${score.toFixed(4)}`
        );

        if (!best) {
          return res.status(400).json({
            errorCode: "NO_ROUTE",
            error: "경로를 찾을 수 없습니다. 출발지를 다시 설정해주세요.",
          });
        }
      } catch (e) {
        console.error(
          `[/score-route] error computing loop via=${viaNodeId}:`,
          e
        );
      }
    }

    if (!best) {
      return res.status(404).json({
        error: `목표 거리(${distanceKm}km)에 맞는 루프 코스를 생성하지 못했습니다.`,
      });
    }

    // === 이상치(거리/횡단보도) 필터링 ===
    const distanceRatio = best.totalDistanceM / targetDistanceM;
    const maxCrosswalksAllowed = distanceKm * MAX_CROSSWALKS_PER_KM;

    const isDistanceOutlier =
      distanceRatio < VIA_DISTANCE_RATIO_MIN ||
      distanceRatio > VIA_DISTANCE_RATIO_MAX;

    const isCrosswalkOutlier = best.totalCrosswalks > maxCrosswalksAllowed;

    if (isDistanceOutlier || isCrosswalkOutlier) {
      console.warn(
        `[/score-route] OUTLIER route rejected: ` +
          `dist=${best.totalDistanceM.toFixed(
            1
          )}m (ratio=${distanceRatio.toFixed(2)}), ` +
          `crosswalks=${best.totalCrosswalks}, ` +
          `maxCrosswalksAllowed=${maxCrosswalksAllowed}`
      );

      // 🔻 여기서 400 + 에러코드/메시지 명확하게 내려줌
      return res.status(400).json({
        errorCode: "OUTLIER_ROUTE",
        error: "경로를 찾을 수 없습니다. 출발지를 다시 설정해주세요.",
        detail: {
          distanceRatio,
          crosswalks: best.totalCrosswalks,
          maxCrosswalksAllowed,
        },
      });
    }

    // 4) 최종 결과 조립
    const finalRoute = {
      distanceM: Math.round(best.totalDistanceM),
      uphillM: 0, // 아직 고도 데이터는 사용 안 함
      crosswalkCount: best.totalCrosswalks,
      finalScore: Math.max(
        0,
        100 -
          (Math.abs(best.totalDistanceM - targetDistanceM) / targetDistanceM) *
            50 -
          best.totalCrosswalks * 1
      ), // 대략적인 점수
      nightScore: 70, // TODO: 밤 안전 점수 (추후 개선)
      crowdScore: 60, // TODO: 혼잡도 점수 (추후 개선)
      name: `루프 코스 (${distanceKm.toFixed(1)}km 목표)`,
      geomJson: best.geomJson,
      originLat: startLat,
      originLng: startLng,
      destLat: startLat, // 루프라서 출발지=도착지
      destLng: startLng,
    };

    res.json({
      route: finalRoute,
      message: `Loop route from node ${startNodeId} via node ${best.viaNodeId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("PostGIS Loop Route Error:", err);
    res
      .status(500)
      .json({ error: "PostGIS 루프 경로 탐색 실패", details: err.message });
  }
});

// 헬스체크
app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Geo-engine (OSM/PostGIS - Loop route with crosswalk penalty) running on port ${PORT}`
  );
});
