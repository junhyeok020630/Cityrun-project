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

/**
 * 💡 경로 추천 로직: 가중치 감점 시스템 적용
 * 요청: { distanceKm, origin, dest, prefs }
 * 응답: 추천 경로 정보 (finalScore 및 상세 점수 포함)
 */
app.post("/score-route", async (req, res) => {
  const { distanceKm, origin, dest, prefs } = req.body || {};
  if (!origin || !dest || !distanceKm) {
    return res
      .status(400)
      .json({ error: "distanceKm, origin, and dest required" });
  }

  // 1. 현재 시간대 파악 (KST 기준 19시~06시를 밤으로 가정)
  const now = new Date();
  const currentHour = now.getHours();
  const isNight = currentHour >= 19 || currentHour < 6;

  // 2. 가상의 경로 메타데이터 생성 (3가지 대안 경로 시뮬레이션)
  // 실제라면 Geo API에서 받아와야 할 데이터입니다.
  const simulatedRoutes = [
    // Route 1: 저경사, 횡단보도 많음, 큰 길 (나이트런 선호)
    {
      id: 1,
      distanceM: distanceKm * 1000 * (0.95 + Math.random() * 0.1),
      uphillM: Math.floor(Math.random() * 20),
      crosswalkCount: Math.floor(Math.random() * 15) + 10,
      isMainRoad: true,
      crowdLevel: Math.floor(Math.random() * 10),
    },
    // Route 2: 중간 경사, 횡단보도 적음, 좁은 길 (데이런 선호)
    {
      id: 2,
      distanceM: distanceKm * 1000 * (0.95 + Math.random() * 0.1),
      uphillM: Math.floor(Math.random() * 50) + 20,
      crosswalkCount: Math.floor(Math.random() * 5),
      isMainRoad: false,
      crowdLevel: Math.floor(Math.random() * 10),
    },
    // Route 3: 고경사, 횡단보도 중간, 큰 길
    {
      id: 3,
      distanceM: distanceKm * 1000 * (0.95 + Math.random() * 0.1),
      uphillM: Math.floor(Math.random() * 100) + 50,
      crosswalkCount: Math.floor(Math.random() * 10) + 5,
      isMainRoad: true,
      crowdLevel: Math.floor(Math.random() * 10),
    },
  ];

  let bestRoute = null;
  let maxScore = -1;

  for (const route of simulatedRoutes) {
    let score = 100; // 100점에서 시작
    let totalPenalty = 0; // 감점 합산

    // --- A. 경사도 (Elevation) 감점 ---
    // 오르막이 100m가 넘으면 강한 감점 (부상/페이스 방해)
    const maxUphillThreshold = 100;
    let uphillPenalty = 0;
    if (route.uphillM > maxUphillThreshold) {
      uphillPenalty = (route.uphillM / maxUphillThreshold) * 15; // 100m당 15점 감점
    } else {
      uphillPenalty = route.uphillM * 0.2; // 기본 경사 감점
    }
    // 사용자 선호도 반영: 경사를 피하고 싶다면 감점 가중치 증가
    if (prefs?.avoidUphill === true) {
      uphillPenalty *= 1.5;
    }
    totalPenalty += uphillPenalty;

    // --- B. 횡단보도/신호등 (Crosswalks) 감점 ---
    // 횡단보도 1개당 3점 감점 (흐름 방해)
    let crosswalkPenalty = route.crosswalkCount * 3;
    // 사용자 선호도 반영: 신호등 회피 선호 시 감점 가중치 증가
    if (prefs?.minimizeCrosswalks === true) {
      crosswalkPenalty *= 1.2;
    }
    totalPenalty += crosswalkPenalty;

    // --- C. 시간대/혼잡도 (Time/Crowd/Lighting) 감점 ---
    let timePenalty = 0;
    if (isNight) {
      // 밤: 가로등 많은 큰 길 선호. 좁은 길은 위험 감점
      if (!route.isMainRoad) {
        timePenalty += 15; // 좁은 길 위험 감점
      }
    } else {
      // 낮: 통행량 적은 골목길 선호. 큰 길(혼잡)은 쾌적성 감점
      if (route.isMainRoad) {
        timePenalty += 10 + route.crowdLevel * 2; // 큰 길 혼잡도 비례 감점
      }
    }
    // 사용자 선호도 반영: 혼잡 회피 선호 시 혼잡도 감점 가중치 증가
    if (prefs?.avoidCrowd === true) {
      timePenalty += route.crowdLevel * 3;
    }
    totalPenalty += timePenalty;

    // 최종 점수 계산 (0~100 사이)
    score = Math.floor(Math.max(0, score - totalPenalty));

    // --- 4. 상세 점수 저장 및 최적 경로 판별 ---
    route.finalScore = score;
    route.uphillM = route.uphillM;
    route.crosswalkCount = route.crosswalkCount;
    route.nightScore = isNight ? (route.isMainRoad ? 90 : 30) : 70; // 밤길 안전 점수 시뮬레이션
    route.crowdScore = 100 - route.crowdLevel * 10; // 혼잡도 점수 (낮을수록 좋음)

    // 가상의 GeoJSON 데이터 생성
    route.geomJson = JSON.stringify({
      type: "LineString",
      coordinates: [
        [origin[1], origin[0]], // [lng, lat] 형식
        [dest[1], dest[0]],
      ],
    });

    // 최적 경로 업데이트
    if (route.finalScore > maxScore) {
      maxScore = route.finalScore;
      bestRoute = route;
    }
  }

  // 5. 순환 코스 처리 (출발지 = 목적지) 시뮬레이션
  const isLoop = origin[0] === dest[0] && origin[1] === dest[1];
  if (isLoop) {
    bestRoute.name = `순환 코스 (${distanceKm}km)`;
    // 순환 코스를 시뮬레이션하기 위해 GeoJSON 좌표를 확장
    const lngOffset = 0.005 * (distanceKm / 5);
    const latOffset = 0.005 * (distanceKm / 5);
    bestRoute.geomJson = JSON.stringify({
      type: "LineString",
      coordinates: [
        [origin[1], origin[0]],
        [origin[1] + lngOffset, origin[0]],
        [origin[1], origin[0] + latOffset],
        [origin[1] - lngOffset, origin[0] + latOffset],
        [dest[1], dest[0]],
      ],
    });
  } else {
    bestRoute.name = `${distanceKm}km 편도 경로 추천`;
  }

  res.json({
    origin: origin,
    dest: dest,
    distanceKm: distanceKm,
    route: bestRoute,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(3000, () => console.log("Geo-engine running on port 3000"));
