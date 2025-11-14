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

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;

    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // ... (생략)
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

        // 💡 1. Geo Engine (OSM/PostGIS)으로 요청(req) 자체를 전달합니다.
        // 💡 HashMap 재구성을 제거하고 DTO 객체 자체를 사용, 직렬화 문제를 해결합니다.

        // 3. Geo Engine 호출 (커스텀 경로 탐색)
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };

        Map<String, Object> geoResponse = geoWebClient.post()
                .uri("/score-route")
                .bodyValue(req) // 💡 변경: HashMap 대신 DTO 객체 (req) 자체를 body로 전송
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