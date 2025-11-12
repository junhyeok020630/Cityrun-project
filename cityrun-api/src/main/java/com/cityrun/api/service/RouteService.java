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
import java.util.HashMap; // 💡 추가

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;
    // 💡 TmapApiService 제거

    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // ... (createRoute 로직은 이전과 동일 - Route 엔티티 필드 확인)
        Route r = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin() != null ? req.getOrigin()[0] : null)
                .originLng(req.getOrigin() != null ? req.getOrigin()[1] : null)
                .destLat(req.getDest() != null ? req.getDest()[0] : null)
                .destLng(req.getDest() != null ? req.getDest()[1] : null)
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                // 💡 OSM 엔진이 계산한 커스텀 점수
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

        // 💡 1. 프론트엔드에서 받은 요청(origin, distanceKm, prefs)을
        // 💡 2. Geo Engine (OSM/PostGIS)으로 전달합니다.

        Map<String, Object> geoInput = new HashMap<>();
        geoInput.put("origin", req.getOrigin());
        geoInput.put("distanceKm", req.getDistanceKm()); // 💡 목표 거리 전달
        geoInput.put("prefs", req.getPrefs());

        // 3. Geo Engine 호출 (커스텀 경로 탐색)
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };

        Map<String, Object> geoResponse = geoWebClient.post()
                .uri("/score-route")
                .bodyValue(geoInput)
                .retrieve()
                .bodyToMono(typeRef)
                .block();

        if (geoResponse == null || !geoResponse.containsKey("route")) {
            throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다.");
        }

        // 4. Geo 엔진이 생성한 경로를 프론트엔드로 반환
        @SuppressWarnings("unchecked")
        Map<String, Object> recommendedRoute = (Map<String, Object>) geoResponse.get("route");

        return recommendedRoute;
    }
}