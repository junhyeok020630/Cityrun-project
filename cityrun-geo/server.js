const express = require("express");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const Redis = require("ioredis");

const app = express();
app.use(express.json());
app.use(cookieParser());

const redis = new Redis({
  host: process.env.REDIS_HOST || "cityrun-redis",
  port: 6379,
});

// PostGIS DB 연결 풀
const pool = new Pool({
  user: "cjh",
  host: "cityrun-postgis",
  database: "osm_data",
  password: "2323",
  port: 5432,
});

// 💡 횡단보도(crossing)에 해당하는 tag_id는 108입니다. (DB 확인 결과)
const CROSSWALK_TAG_ID = 108;

/**
 * 💡 선호도(prefs)에 따라 pgRouting의 비용(cost) 계산 SQL을 동적으로 생성
 *    - length_m: 실제 길이(m)
 *    - cost / reverse_cost: 길이 + (횡단보도 패널티 등)
 *
 * ⚠️ 주의: ways 테이블의 PK는 gid 이므로,
 *         pgr_* 함수에서 요구하는 id 컬럼을 위해 gid AS id 로 alias 한다.
 */
const buildEdgesSql = (prefs) => {
  const avoidCrosswalks = prefs?.minimizeCrosswalks;

  let cost = "cost";
  let reverse_cost = "reverse_cost";

  // 횡단보도 회피: tag_id가 108(crossing)일 경우 비용을 대폭 증가
  if (avoidCrosswalks) {
    const crosswalkPenalty = `CASE WHEN tag_id = ${CROSSWALK_TAG_ID} THEN 1000.0 ELSE 0.0 END`;
    cost += ` + ${crosswalkPenalty}`;
    reverse_cost += ` + ${crosswalkPenalty}`;
  }

  return `
    SELECT 
      gid AS id,      -- 💡 gid을 id로 alias
      source, 
      target, 
      ${cost} AS cost,
      ${reverse_cost} AS reverse_cost,
      length_m,
      tag_id
    FROM ways
  `;
};

/**
 * 💡 OSM/PostGIS 기반 커스텀 경로 탐색
 *    - 목표 거리(km)에 근접한 왕복(there & back) 경로 생성
 *    - 선호도에 따라 횡단보도 회피 (cost에 패널티 반영)
 */
app.post("/score-route", async (req, res) => {
  const { distanceKm, origin, prefs } = req.body || {};

  // 💡 유효성 검사
  if (
    !Array.isArray(origin) ||
    origin.length !== 2 ||
    typeof distanceKm !== "number" ||
    distanceKm <= 0
  ) {
    console.error(
      `Validation Failed: Received Body: ${JSON.stringify(req.body)}`
    );
    return res.status(400).json({
      error:
        "Invalid input: origin must be [lat, lng] array, distanceKm must be positive number.",
    });
  }

  const startLat = origin[0];
  const startLng = origin[1];
  const targetDistanceM = distanceKm * 1000;

  try {
    // 1. 출발지에서 가장 가까운 OSM 도로망 정점(Vertex) 찾기
    //    ways_vertices_pgr.the_geom 의 SRID = 4326
    const findStartNodeSql = `
      SELECT id
      FROM ways_vertices_pgr 
      ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1;
    `;
    const startNodeResult = await pool.query(findStartNodeSql, [
      startLng, // x = lon
      startLat, // y = lat
    ]);

    if (startNodeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "출발지 근처의 경로 탐색용 노드를 찾을 수 없습니다." });
    }
    const startNodeId = startNodeResult.rows[0].id;

    // 2. 선호도 기반 동적 edges SQL 생성
    const edgesSql = buildEdgesSql(prefs);
    const escapedEdgesSql = edgesSql.replace(/'/g, "''"); // pgr_*에 넣을 때 escape

    // 3. pgr_drivingDistance로 "목표 거리 이내에서 도달 가능한 노드"를 구하고,
    //    그 중 가장 멀리 있는 노드를 목적지 후보로 선택
    const roundTripQuery = `
      WITH dd AS (
        SELECT *
        FROM pgr_drivingDistance(
          '${escapedEdgesSql}',
          ARRAY[${startNodeId}]::bigint[],
          ${targetDistanceM}::float8,
          false,   -- 무방향 그래프 (양방향 도로)
          false    -- equicost = false
        )
      ),
      dest AS (
        SELECT node AS dest_vid, agg_cost
        FROM dd
        WHERE node <> ${startNodeId}
        ORDER BY agg_cost DESC
        LIMIT 1
      ),
      forward_path AS (
        SELECT *
        FROM pgr_dijkstra(
          '${escapedEdgesSql}',
          ${startNodeId},
          (SELECT dest_vid FROM dest)
        )
      ),
      backward_path AS (
        SELECT *
        FROM pgr_dijkstra(
          '${escapedEdgesSql}',
          (SELECT dest_vid FROM dest),
          ${startNodeId}
        )
      ),
      all_edges AS (
        SELECT edge
        FROM forward_path
        WHERE edge <> -1
        UNION ALL
        SELECT edge
        FROM backward_path
        WHERE edge <> -1
      ),
      loop_geom AS (
        SELECT 
          w.the_geom,
          w.length_m,
          w.tag_id
        FROM all_edges a
        JOIN ways w ON a.edge = w.gid   -- 💡 여기서도 gid로 JOIN
      )
      SELECT 
        ST_AsGeoJSON(
          ST_Collect(
            ST_Transform(lg.the_geom, 4326)
          )
        ) AS geomJson,
        SUM(lg.length_m) AS totalDistanceM,
        COUNT(CASE WHEN lg.tag_id = ${CROSSWALK_TAG_ID} THEN 1 END) AS totalCrosswalks
      FROM loop_geom lg;
    `;

    const loopResult = await pool.query(roundTripQuery);
    if (loopResult.rows.length === 0 || !loopResult.rows[0].geomjson) {
      return res.status(404).json({
        error: `목표 거리(${distanceKm}km)에 맞는 경로를 생성하지 못했습니다.`,
      });
    }

    const route = loopResult.rows[0];

    // 4. 최종 응답 데이터 구성
    const finalRoute = {
      distanceM: Math.round(route.totaldistancem),
      uphillM: 0,
      crosswalkCount: parseInt(route.totalcrosswalks || 0, 10),
      finalScore: 80,
      nightScore: 70,
      crowdScore: 60,
      name: `OSM 커스텀 경로 (${distanceKm}km)`,
      geomJson: route.geomjson,
      originLat: startLat,
      originLng: startLng,
      destLat: startLat, // 왕복 후 다시 출발점으로 돌아오는 루프
      destLng: startLng,
    };

    res.json({
      route: finalRoute,
      message: `PostGIS pgr_drivingDistance + pgr_dijkstra (startNode: ${startNodeId})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("PostGIS Query Error:", err);
    res
      .status(500)
      .json({ error: "PostGIS 경로 탐색 실패", details: err.message });
  }
});

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(3000, () =>
  console.log(
    "Geo-engine (OSM/PostGIS - Prefs: Crosswalk) running on port 3000"
  )
);
