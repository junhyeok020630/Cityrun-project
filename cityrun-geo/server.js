// 'cityrun-geo' (Node.js) 서버: PostGIS를 이용한 경로 추천(루프 생성) 로직
// (과제 '서버 프로그램 2')

// --- 1. 모듈 임포트 ---
const express = require("express"); // Express 프레임워크
const { Pool } = require("pg"); // PostgreSQL(PostGIS) 클라이언트
const cookieParser = require("cookie-parser"); // 쿠키 파서 (현재 로직에선 미사용)
const Redis = require("ioredis"); // Redis 클라이언트 (현재 로직에선 미사용)

// --- 2. Express 앱 초기화 및 미들웨어 설정 ---
const app = express();
app.use(express.json()); // Request Body(JSON) 파서
app.use(cookieParser()); // 쿠키 파서

// --- 3. 외부 서비스 연결 ---

// 3-1. Redis (cityrun-redis) 연결 (현재 세션/캐시용, 경로 추천 로직에서 직접 쓰진 않음)
const redis = new Redis({
  host: process.env.REDIS_HOST || "cityrun-redis", // 도커 서비스 이름
  port: 6379,
});

// 3-2. PostGIS (cityrun-postgis) 연결 풀 생성
const pool = new Pool({
  user: process.env.PG_USER || "cjh", // DB 사용자
  host: process.env.PG_HOST || "cityrun-postgis", // 도커 서비스 이름
  database: process.env.PG_DB || "osm_data", // DB 이름
  password: process.env.PG_PASSWORD || "2323", // DB 비밀번호
  port: Number(process.env.PG_PORT || 5432), // DB 포트
});

// --- 4. 경로 탐색 알고리즘 상수 설정 ---
const CROSSWALK_PENALTY_M = 150.0; // 횡단보도 1개당 부과할 페널티 (150m 거리로 환산)
const CANDIDATE_VIA_LIMIT = 15; // 중간 지점(via) 후보 최대 개수
const VIA_DISTANCE_RATIO_MIN = 0.6; // 목표 거리 대비 실제 경로 거리의 최소 허용 비율 (예: 5km 목표 -> 3km 미만은 탈락)
const VIA_DISTANCE_RATIO_MAX = 1.7; // 목표 거리 대비 실제 경로 거리의 최대 허용 비율 (예: 5km 목표 -> 8.5km 초과는 탈락)
const MAX_CROSSWALKS_PER_KM = 12; // 1km당 허용 가능한 최대 횡단보도 개수 (이상치 필터링용)

// --- 5. pgRouting 엣지(Edge) SQL 빌더 ---

// 5-1. pgr_drivingdistance용 SQL 빌더 (순수 거리 비용)
const buildDistanceEdgeSql = () => `
  SELECT
    gid AS id,
    source,
    target,
    length_m AS cost, -- 비용(cost) = 실제 거리
    length_m AS reverse_cost
  FROM ways
`;

// 5-2. pgr_dijkstra용 SQL 빌더 (횡단보도 페널티 적용/미적용 분기)
const buildRouteEdgeSql = (avoidCrosswalks) => {
  // 횡단보도 최소화 옵션이 꺼진 경우 (순수 거리 비용)
  if (!avoidCrosswalks) {
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

  // 횡단보도 최소화 옵션이 켜진 경우 (페널티 적용)
  return `
    SELECT
      w.gid AS id,
      w.source,
      w.target,
      -- 비용(cost) = 실제 거리 + (횡단보도 수 * 페널티)
      (w.length_m + COALESCE(wc.cross_count, 0) * ${CROSSWALK_PENALTY_M}) AS cost,
      (w.length_m + COALESCE(wc.cross_count, 0) * ${CROSSWALK_PENALTY_M}) AS reverse_cost
    FROM ways w
    LEFT JOIN ways_crosswalks wc
      ON wc.edge_id = w.gid
  `;
};

// --- 6. 루프 경로 계산 헬퍼 함수 ---
// (start -> via -> start) 루프 1회를 계산
async function computeLoopRoute(
  pool,
  startNodeId,
  viaNodeId,
  targetDistanceM,
  avoidCrosswalks
) {
  // 횡단보도 옵션에 맞는 엣지 SQL 생성
  const routeEdgeSql = buildRouteEdgeSql(avoidCrosswalks);
  // SQL Injection 방지를 위한 간단한 ' 따옴표 이스케이프
  const safeRouteEdgeSql = routeEdgeSql.replace(/'/g, "''");

  // 루프 경로 계산 메인 SQL (Dijkstra 2회 + 결과 취합)
  const loopSql = `
    WITH
      -- (1) start -> via 가는 경로 계산 (pgr_dijkstra)
      out_path AS (
        SELECT * FROM pgr_dijkstra(
          '${safeRouteEdgeSql}'::text,
          $1::bigint,
          $2::bigint,
          false
        )
      ),
      -- (2) via -> start 돌아오는 경로 계산 (pgr_dijkstra)
      back_path AS (
        SELECT * FROM pgr_dijkstra(
          '${safeRouteEdgeSql}'::text,
          $2::bigint,
          $1::bigint,
          false
        )
      ),
      -- (3) 가는 경로와 오는 경로의 모든 엣지(edge) ID 통합
      all_edges AS (
        SELECT edge FROM out_path WHERE edge <> -1
        UNION ALL
        SELECT edge FROM back_path WHERE edge <> -1
      ),
      -- (4) 엣지 ID를 'ways' 테이블과 조인하여 실제 정보(거리, 횡단보도 수, 지오메트리) 획득
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
    -- (5) 모든 엣지의 정보(거리, 횡단보도)를 합산하고, 지오메트리를 GeoJSON으로 변환
    SELECT
      SUM(length_m)        AS total_distance_m, -- 총 거리 (미터)
      SUM(cross_count)     AS total_crosswalks, -- 총 횡단보도 수
      ST_AsGeoJSON(
        ST_Collect(the_geom)
      )                    AS geomjson -- 경로 지오메트리 (GeoJSON)
    FROM joined;
  `;

  // PostGIS에 루프 쿼리 실행
  const { rows } = await pool.query(loopSql, [startNodeId, viaNodeId]);

  // 경로 계산 실패 시 (결과 없음) null 반환
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

  // --- (A) 최종 점수(Score) 계산 ---
  // 목표 거리와 실제 계산된 거리의 차이(오차)
  const distanceError = Math.abs(totalDistanceM - targetDistanceM);

  let score;
  if (avoidCrosswalks) {
    // 횡단보도 최소화 옵션이 켜진 경우:
    // 점수 = 거리오차 + (횡단보도 개수 * 가중치)
    const LAMBDA = 200.0; // 횡단보도 1개를 약 200m 거리 오차로 간주
    score = distanceError + totalCrosswalks * LAMBDA;
  } else {
    // 기본 모드: 점수 = 거리오차 (거리 정확도를 최우선)
    score = distanceError;
  }

  // 계산된 루프 경로 정보 및 점수 반환
  return {
    totalDistanceM,
    totalCrosswalks,
    geomJson,
    score,
  };
}

// --- 7. 메인 경로 추천 API 엔드포인트 ---
// (POST /score-route)
app.post("/score-route", async (req, res) => {
  const { distanceKm, origin, prefs } = req.body || {};

  // (1) 입력 값 검증 (출발지, 목표 거리)
  if (
    !Array.isArray(origin) ||
    origin.length !== 2 ||
    typeof distanceKm !== "number" ||
    distanceKm <= 0
  ) {
    console.error("[/score-route] Invalid body:", req.body);
    return res.status(400).json({
      error:
        "Invalid input: origin must be [lat, lng], distanceKm must be positive number",
    });
  }

  const startLat = origin[0]; // 출발지 위도
  const startLng = origin[1]; // 출발지 경도
  const targetDistanceM = distanceKm * 1000; // 목표 거리 (미터)
  const halfDistanceM = targetDistanceM / 2; // 목표 거리의 절반 (중간 지점 탐색용)

  // 사용자 선호 옵션 (횡단보도 최소화) 플래그
  const avoidCrosswalks = !!(prefs && prefs.minimizeCrosswalks);

  console.log(
    `[/score-route] origin=(${startLat}, ${startLng}), target=${targetDistanceM}m, avoidCrosswalks=${avoidCrosswalks}`
  );

  try {
    // (2) 출발지 좌표(lat, lng)에서 가장 가까운 PostGIS 정점(Vertex) ID 찾기
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
        .json({ error: "출발지 근처의 경로 탐색용 노드를 찾을 수 없습니다" });
    }

    const startNodeId = Number(startNodeResult.rows[0].id); // 출발 정점 ID
    console.log(`[/score-route] startNodeId = ${startNodeId}`);

    // (3) pgr_drivingdistance로 '목표 거리의 절반' 근처의 중간 지점(via) 후보들 조회
    const distanceEdgeSql = buildDistanceEdgeSql(); // 순수 거리 엣지 SQL
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
        ABS(agg_cost - $2) AS orderCost -- 목표 거리(절반)와의 오차(orderCost)
      FROM dd
      ORDER BY orderCost -- 오차가 적은 순으로 정렬
      LIMIT ${CANDIDATE_VIA_LIMIT}; -- 상위 15개 후보만 선택
    `;

    const drivingResult = await pool.query(drivingSql, [
      startNodeId,
      halfDistanceM, // $2: halfDistanceM
    ]);

    if (!drivingResult.rows.length) {
      console.warn("[/score-route] via candidates not found");
      return res.status(404).json({
        error: `목표 거리(${distanceKm}km)에 맞는 중간 지점 후보를 찾지 못했습니다`,
      });
    }

    // 중간 지점 후보 목록 (nodeId, aggCost)
    const viaCandidates = drivingResult.rows.map((r) => ({
      nodeId: Number(r.node),
      aggCost: Number(r.agg_cost),
    }));

    console.log(
      "[/score-route] candidate via nodes:",
      viaCandidates.map((c) => `node=${c.nodeId}, agg=${c.aggCost.toFixed(1)}`)
    );

    // (4) 각 중간 지점(via) 후보에 대해 루프 경로 계산 및 'best' 경로 선정
    let best = null; // 가장 점수(score)가 낮은(좋은) 경로를 저장할 변수

    for (const candidate of viaCandidates) {
      const viaNodeId = candidate.nodeId;
      try {
        // computeLoopRoute 함수 호출
        const loopRoute = await computeLoopRoute(
          pool,
          startNodeId,
          viaNodeId,
          targetDistanceM,
          avoidCrosswalks
        );
        if (!loopRoute) {
          continue; // 경로 계산 실패 시 다음 후보로
        }

        const { totalDistanceM, totalCrosswalks, geomJson, score } = loopRoute;
        console.log(
          `[/score-route] via=${viaNodeId} loop: dist=${totalDistanceM.toFixed(
            1
          )}, crosswalks=${totalCrosswalks}, score=${score.toFixed(4)}`
        );

        // 현재 best보다 점수(score)가 낮으면 'best' 갱신
        if (!best || score < best.score) {
          best = {
            ...loopRoute,
            viaNodeId: viaNodeId,
          };
        }
      } catch (e) {
        console.error(
          `[/score-route] error computing loop via=${viaNodeId}:`,
          e
        );
      }
    }

    // 'best' 경로를 찾지 못한 경우 404 에러 반환
    if (!best) {
      return res.status(404).json({
        error: `목표 거리(${distanceKm}km)에 맞는 루프 코스를 생성하지 못했습니다`,
      });
    }

    // (5) 이상치(Outlier) 필터링
    // 거리 비율 계산
    const distanceRatio = best.totalDistanceM / targetDistanceM;
    // 최대 횡단보도 허용치 계산
    const maxCrosswalksAllowed = distanceKm * MAX_CROSSWALKS_PER_KM;

    // 거리 비율이 허용 범위를 벗어났는지 확인
    const isDistanceOutlier =
      distanceRatio < VIA_DISTANCE_RATIO_MIN ||
      distanceRatio > VIA_DISTANCE_RATIO_MAX;

    // 횡단보도 수가 허용치를 초과했는지 확인
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

      // 이상치 경로 400 에러 반환 (cityrun-api에서 이 errorCode를 파싱)
      return res.status(400).json({
        errorCode: "OUTLIER_ROUTE",
        error: "경로를 찾을 수 없습니다 출발지를 다시 설정해주세요",
        detail: {
          distanceRatio,
          crosswalks: best.totalCrosswalks,
          maxCrosswalksAllowed,
        },
      });
    }

    // (6) 최종 결과 조립 (cityrun-api로 전달할 데이터)
    const finalRoute = {
      distanceM: Math.round(best.totalDistanceM), // 총 거리
      uphillM: 0, // 오르막 (미구현)
      crosswalkCount: best.totalCrosswalks, // 총 횡단보도
      finalScore: Math.max( 
        0,
        100 -
          (Math.abs(best.totalDistanceM - targetDistanceM) / targetDistanceM) *
            50 -
          best.totalCrosswalks * 1
      ), // 대략적인 점수
      nightScore: 70, // 야간 점수 (임시)
      crowdScore: 60, // 혼잡도 점수 (임시)
      name: `루프 코스 (${distanceKm.toFixed(1)}km 목표)`, // 경로 이름
      geomJson: best.geomJson, // GeoJSON
      originLat: startLat, // 출발지 위도
      originLng: startLng, // 출발지 경도
      destLat: startLat, // 도착지 위도 (루프이므로 출발지와 동일)
      destLng: startLng, // 도착지 경도 (루프이므로 출발지와 동일)
    };

    // (7) 최종 추천 경로 응답 반환
    res.json({
      route: finalRoute,
      message: `Loop route from node ${startNodeId} via node ${best.viaNodeId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // (8) 서버 내부 오류(500) 처리
    console.error("PostGIS Loop Route Error:", err);
    res
      .status(500)
      .json({ error: "PostGIS 루프 경로 탐색 실패", details: err.message });
  }
});

// --- 8. 헬스 체크 엔드포인트 ---
app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

// --- 9. 서버 시작 ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `Geo-engine (OSM/PostGIS - Loop route with crosswalk penalty) running on port ${PORT}`
  );
});