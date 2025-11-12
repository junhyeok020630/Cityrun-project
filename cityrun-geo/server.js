const express = require("express");
const cookieParser = require("cookie-parser");
const Redis = require("ioredis");

const app = express();
app.use(express.json());
app.use(cookieParser());

const redis = new Redis({
  host: process.env.REDIS_HOST || "cityrun-redis",
  port: 6379,
});

// 💡 Geo 엔진은 이제 TMAP 경로를 기반으로 점수 계산만 합니다.
app.post("/score-route", async (req, res) => {
  // 💡 입력: distanceM, geomJson (실제 TMAP 경로), prefs
  const { distanceM, geomJson, prefs } = req.body || {};
  if (!distanceM || !geomJson) {
    return res.status(400).json({ error: "distanceM and geomJson required" });
  }

  // 1. 현재 시간대 파악
  const now = new Date();
  const currentHour = now.getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  // 2. TMAP 경로 기반으로 커스텀 Metrics 시뮬레이션
  const route = {
    distanceM: distanceM,
    uphillM: Math.floor(distanceM / 100) * (Math.random() * 0.5 + 0.5), // 거리에 비례하는 경사 시뮬레이션
    crosswalkCount: Math.floor(distanceM / 1000) * (Math.random() * 4 + 1), // 거리에 비례하는 횡단보도 시뮬레이션
    isMainRoad: distanceM > 10000 ? true : Math.random() > 0.5, // 장거리는 대로 시뮬레이션
    crowdLevel: Math.floor(Math.random() * 10), // 0~9
  };

  // 3. 점수 계산 로직 (커스텀 가중치 감점)
  let score = 100;
  let totalPenalty = 0;

  // --- A. 경사도 (Elevation) 감점 ---
  const maxUphillThreshold = 100;
  let uphillPenalty = 0;
  if (route.uphillM > maxUphillThreshold) {
    uphillPenalty = (route.uphillM / maxUphillThreshold) * 15;
  } else {
    uphillPenalty = route.uphillM * 0.2;
  }
  if (prefs?.avoidUphill === true) {
    uphillPenalty *= 1.5;
  }
  totalPenalty += uphillPenalty;

  // --- B. 횡단보도/신호등 (Crosswalks) 감점 ---
  let crosswalkPenalty = route.crosswalkCount * 3;
  if (prefs?.minimizeCrosswalks === true) {
    crosswalkPenalty *= 1.5;
  }
  totalPenalty += crosswalkPenalty;

  // --- C. 시간대/혼잡도 (Time/Crowd/Lighting) 감점 ---
  let timePenalty = 0;
  if (isNight) {
    if (!route.isMainRoad) {
      timePenalty += 15;
    }
  } else {
    if (route.isMainRoad) {
      timePenalty += 10 + route.crowdLevel * 2;
    }
  }
  if (prefs?.avoidCrowd === true) {
    timePenalty += route.crowdLevel * 3;
  }
  totalPenalty += timePenalty;

  // 최종 점수 계산
  score = Math.floor(Math.max(0, score - totalPenalty));

  // 4. 최종 점수 및 상세 데이터 생성
  const finalRouteMetrics = {
    distanceM: route.distanceM,
    uphillM: Math.floor(route.uphillM),
    crosswalkCount: Math.floor(route.crosswalkCount),
    isMainRoad: route.isMainRoad,
    crowdLevel: route.crowdLevel,
    finalScore: score,
    nightScore: isNight ? (route.isMainRoad ? 90 : 30) : 70,
    crowdScore: 100 - route.crowdLevel * 10,
    name: "TMAP 추천 경로",
  };

  res.json({
    route: finalRouteMetrics,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(3000, () => console.log("Geo-engine running on port 3000"));
