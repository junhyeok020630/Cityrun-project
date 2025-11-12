package com.cityrun.api.service;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;
    private final TmapApiService tmapApiService; // 💡 TMAP API 서비스 주입

    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // ... (Route 객체 생성 로직은 이전과 동일)
        Route r = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin() != null ? req.getOrigin()[0] : null)
                .originLng(req.getOrigin() != null ? req.getOrigin()[1] : null)
                .destLat(req.getDest() != null ? req.getDest()[0] : null)
                .destLng(req.getDest() != null ? req.getDest()[1] : null)
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                .uphillM(req.getUphillM())
                .crosswalkCount(req.getCrosswalkCount())
                .nightScore(req.getNightScore())
                .crowdScore(req.getCrowdScore())
                .isPublic(Boolean.TRUE.equals(req.getIsPublic()))
                .geomJson(req.getGeomJson())
                .build();
        return routeRepo.save(r);
    }

    @Transactional(readOnly = true)
    public List<Route> getPublicRoutes() {
        return routeRepo.findByIsPublicTrueOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public List<Route> getUserRoutes(Long userId) {
        return routeRepo.findByUserIdOrderByIdDesc(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> recommendRoute(RecommendRequest req) {
        // 1. TMAP Pedestrian Directions API 호출 (실제 도보 경로 획득)
        Map<String, Object> tmapResponse = tmapApiService.getPedestrianDirections(
                req.getOrigin()[0], req.getOrigin()[1],
                req.getDest()[0], req.getDest()[1])
                .orElseThrow(() -> new RuntimeException("TMAP Directions API 응답 실패."));

        // 2. TMAP 응답에서 GeoJSON 및 실제 거리 추출
        Optional<Map<String, Object>> pathData = parseTmapPathData(tmapResponse);
        if (pathData.isEmpty()) {
            throw new IllegalArgumentException("TMAP 응답에서 유효한 경로를 찾을 수 없습니다.");
        }

        Map<String, Object> realPath = pathData.get();

        // 3. Geo Engine 호출 (커스텀 점수 계산)
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };

        Map<String, Object> geoInput = Map.of(
                "distanceM", realPath.get("distanceM"),
                "geomJson", realPath.get("geomJson"), // TMAP의 실제 GeoJSON을 Geo Engine으로 전달
                "prefs", req.getPrefs());

        Map<String, Object> geoScoreResponse = geoWebClient.post()
                .uri("/score-route")
                .bodyValue(geoInput)
                .retrieve()
                .bodyToMono(typeRef)
                .block();

        if (geoScoreResponse == null || !geoScoreResponse.containsKey("route")) {
            throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다.");
        }

        // 4. 최종 결과 통합
        @SuppressWarnings("unchecked")
        Map<String, Object> recommendedRoute = (Map<String, Object>) geoScoreResponse.get("route");

        // Geo 엔진 응답에 TMAP의 실제 경로 정보를 덮어씌움
        recommendedRoute.put("geomJson", realPath.get("geomJson")); // TMAP의 실제 경로
        recommendedRoute.put("distanceM", realPath.get("distanceM"));
        recommendedRoute.put("originLat", req.getOrigin()[0]);
        recommendedRoute.put("originLng", req.getOrigin()[1]);
        recommendedRoute.put("destLat", req.getDest()[0]);
        recommendedRoute.put("destLng", req.getDest()[1]);

        return recommendedRoute;
    }

    /**
     * TMAP Pedestrian API 응답에서 GeoJSON과 DistanceM을 추출합니다.
     */
    private Optional<Map<String, Object>> parseTmapPathData(Map<String, Object> tmapResponse) {
        // TMAP GeoJSON 응답 구조 파싱 (경로 획득)
        if (tmapResponse.containsKey("features")) {
            List<Map<String, Object>> features = (List<Map<String, Object>>) tmapResponse.get("features");

            // Features 리스트에서 LineString geometry를 추출하고 좌표를 모읍니다.
            List<List<Double>> allCoords = features.stream()
                    .filter(f -> "Feature".equals(f.get("type")))
                    .map(f -> (Map<String, Object>) f.get("geometry"))
                    .filter(g -> "LineString".equals(g.get("type")))
                    .flatMap(g -> ((List<List<Double>>) g.get("coordinates")).stream())
                    .collect(Collectors.toList());

            // Features 리스트에서 Summary 정보를 추출하여 총 거리를 계산합니다.
            Optional<Integer> totalDistanceM = features.stream()
                    .filter(f -> "Feature".equals(f.get("type")))
                    .map(f -> (Map<String, Object>) f.get("properties"))
                    .filter(p -> p.containsKey("totalDistance"))
                    .map(p -> (Integer) p.get("totalDistance"))
                    .findFirst();

            if (allCoords.isEmpty() || totalDistanceM.isEmpty()) {
                return Optional.empty();
            }

            // GeoJSON LineString 형태로 재구성
            Map<String, Object> geoJson = Map.of(
                    "type", "LineString",
                    "coordinates", allCoords);

            // Map<String, Object> 형태로 최종 반환
            Map<String, Object> pathMap = new HashMap<>();
            pathMap.put("distanceM", totalDistanceM.get());

            // GeoJSON 객체를 문자열로 직렬화
            try {
                pathMap.put("geomJson", objectMapper.writeValueAsString(geoJson));
            } catch (Exception e) {
                System.err.println("GeoJSON 직렬화 실패: " + e.getMessage());
                return Optional.empty();
            }

            return Optional.of(pathMap);
        }
        return Optional.empty();
    }
}