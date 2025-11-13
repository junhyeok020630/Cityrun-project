const express = require("express");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const Redis = require("ioredis"); // 💡 Redis require 구문 안정화

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
 */
const buildEdgesSql = (prefs) => {
  const avoidCrosswalks = prefs?.minimizeCrosswalks;

  let cost = "cost";
  let reverse_cost = "reverse_cost";

  // 횡단보도 회피: tag_id가 108(crossing)일 경우 비용을 대폭 증가시킵니다.
  if (avoidCrosswalks) {
    // 횡단보도일 경우 비용(cost)에 1000m를 추가하는 페널티 (경로 탐색 시 우회 유도)
    const crosswalkPenalty = `CASE WHEN tag_id = ${CROSSWALK_TAG_ID} THEN 1000.0 ELSE 0.0 END`;
    cost += ` + ${crosswalkPenalty}`;
    reverse_cost += ` + ${crosswalkPenalty}`;
  }

  return `
    SELECT 
      id, 
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
 * 💡 OSM/PostGIS 기반 커스텀 경로 탐색 (최종 안정화 + tag_id 직접 사용 버전)
 */
app.post("/score-route", async (req, res) => {
  const { distanceKm, origin, prefs } = req.body || {};

  if (!origin || !distanceKm) {
    return res.status(400).json({ error: "origin and distanceKm required" });
  }

  const startLat = origin[0];
  const startLng = origin[1];
  const targetDistanceM = distanceKm * 1000;

  try {
    // 💡 1. 출발지에서 가장 가까운 OSM 도로망 *정점(Vertex)* 찾기
    const findStartNodeSql = `
      SELECT id
      FROM ways_vertices_pgr 
      ORDER BY the_geom <-> ST_Transform(ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326), 3857)
      LIMIT 1;
    `;

    const startNodeResult = await pool.query(findStartNodeSql);
    if (startNodeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "출발지 근처의 경로 탐색용 노드를 찾을 수 없습니다." });
    }
    const startNodeId = startNodeResult.rows[0].id;

    // 💡 2. 선호도(prefs)를 기반으로 동적 엣지 SQL 생성
    const edgesSql = buildEdgesSql(prefs);

    // 💡 3. pgr_roundTrip 함수를 사용하여 목표 거리의 루프 경로 탐색
    const finalQuery = `
      WITH loop_edges AS (
        SELECT * FROM pgr_roundTrip(
          '${edgesSql.replace(/'/g, "''")}',
          ${startNodeId},
          ${targetDistanceM},
          'length_m', 
          0.2, 
          'cost' 
        )
      ),
      -- 💡 4. 최종 집계를 위해 ways 테이블에서 필요한 컬럼만 가져옵니다.
      loop_geom AS (
        SELECT 
          w.the_geom, 
          w.length_m, 
          w.tag_id
        FROM loop_edges l
        JOIN ways w ON l.edge = w.id
        WHERE l.edge != -1 
      )
      -- 💡 5. 결과 집계: tag_id를 직접 사용하여 횡단보도 카운트 (모호성 제거를 위해 별칭 사용)
      SELECT 
        ST_AsGeoJSON(ST_Collect(ST_Transform(lg.the_geom, 4326))) AS geomJson, 
        SUM(lg.length_m) AS totalDistanceM,
        COUNT(CASE WHEN lg.tag_id = ${CROSSWALK_TAG_ID} THEN 1 END) AS totalCrosswalks 
      FROM loop_geom lg; // 💡 최종 SELECT 문에서 lg 별칭 사용
    `;

    const loopResult = await pool.query(finalQuery);

    if (loopResult.rows.length === 0 || !loopResult.rows[0].geomjson) {
      return res
        .status(404)
        .json({
          error: `목표 거리(${distanceKm}km)에 맞는 경로를 생성하지 못했습니다.`,
        });
    }

    const route = loopResult.rows[0];

    // 💡 6. 최종 응답 데이터 구성
    const finalRoute = {
      distanceM: Math.round(route.totaldistancem),
      uphillM: 0,
      crosswalkCount: parseInt(route.totalcrosswalks || 0),
      finalScore: 80,
      nightScore: 70,
      crowdScore: 60,
      name: `OSM 커스텀 경로 (${distanceKm}km)`,
      geomJson: route.geomjson,
      originLat: startLat,
      originLng: startLng,
      destLat: startLat,
      destLng: startLng,
    };

    res.json({
      route: finalRoute,
      message: `PostGIS pgr_roundTrip (Node: ${startNodeId})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("PostGIS Query Error:", err);
    // 💡 오류 상세 정보를 HTTP 응답에 포함시켜 클라이언트/프런트엔드에서 최종 오류를 볼 수 있도록 합니다.
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
