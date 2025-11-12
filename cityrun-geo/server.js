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

// PostGIS DB 연결 풀 (cityrun-postgis 컨테이너)
const pool = new Pool({
  user: "cjh",
  host: "cityrun-postgis",
  database: "osm_data",
  password: "2323",
  port: 5432,
});

/**
 * 💡 OSM/PostGIS 기반 커스텀 경로 탐색
 */
app.post("/score-route", async (req, res) => {
  // 💡 API 서버로부터 (distanceKm, origin, prefs)를 받음
  const { distanceKm, origin, prefs } = req.body || {};

  if (!origin || !distanceKm) {
    return res.status(400).json({ error: "origin and distanceKm required" });
  }

  const startLat = origin[0];
  const startLng = origin[1];
  const targetDistanceM = distanceKm * 1000;

  // 💡 1. 출발지에서 가장 가까운 OSM 도로망 노드(node) 찾기
  // 💡 'id' -> 'osm_id', 'geom' -> 'way'로 수정
  // 💡 좌표계 변환: 4326(경위도) -> 3857(웹 메르카토르)
  const findStartNodeSql = `
    SELECT osm_id as id, ST_AsText(ST_Transform(way, 4326)) as location
    FROM planet_osm_point 
    ORDER BY way <-> ST_Transform(ST_SetSRID(ST_MakePoint(${startLng}, ${startLat}), 4326), 3857)
    LIMIT 1;
  `;

  try {
    // PostGIS DB에 쿼리 실행
    const startNodeResult = await pool.query(findStartNodeSql);
    if (startNodeResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "출발지 근처의 도로를 찾을 수 없습니다." });
    }
    const startNode = startNodeResult.rows[0];

    // 💡 2. pg_routing을 사용한 실제 경로 탐색 (다음 단계)
    // (현재는 PostGIS 연결 성공 및 노드 찾기 테스트만 진행)

    // 💡 3. 시뮬레이션 응답 반환 (PostGIS 연결 성공 기준)
    const simulatedGeoJson = {
      type: "LineString",
      coordinates: [
        [startLng, startLat],
        [startLng + 0.01, startLat + 0.01],
        [startLng, startLat + 0.02],
      ],
    };
    const simulatedMetrics = {
      distanceM: targetDistanceM,
      uphillM: Math.floor(targetDistanceM / 100) * (Math.random() * 0.5 + 0.5),
      crosswalkCount:
        Math.floor(targetDistanceM / 1000) * (Math.random() * 4 + 1),
      finalScore: 80, // 시뮬레이션 점수
      nightScore: 70,
      crowdScore: 60,
      name: `OSM 커스텀 경로 (${distanceKm}km)`,
      geomJson: JSON.stringify(simulatedGeoJson),
      originLat: startLat,
      originLng: startLng,
      destLat: startLat + 0.02, // 시뮬레이션 도착지
      destLng: startLng,
    };

    res.json({
      route: simulatedMetrics,
      message: `PostGIS 연결 성공! 출발 노드 ID: ${startNode.id} (Table: planet_osm_point)`,
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
  console.log("Geo-engine (OSM/PostGIS Mode) running on port 3000")
);
