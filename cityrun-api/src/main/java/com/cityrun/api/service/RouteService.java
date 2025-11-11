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
    private final WebClient geoWebClient; // Geo Engine 통신용

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        Route r = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin() != null ? req.getOrigin()[0] : null)
                .originLng(req.getOrigin() != null ? req.getOrigin()[1] : null)
                .destLat(req.getDest() != null ? req.getDest()[0] : null)
                .destLng(req.getDest() != null ? req.getDest()[1] : null)
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                // 💡 Route.java에 추가된 필드들 반영
                .uphillM(req.getUphillM())
                .crosswalkCount(req.getCrosswalkCount())
                .nightScore(req.getNightScore())
                .crowdScore(req.getCrowdScore())
                // ------------------------------------
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

    // 새로운 경로 추천 API 로직 (Geo Engine 호출)
    @Transactional(readOnly = true)
    public Map<String, Object> recommendRoute(RecommendRequest req) {
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<Map<String, Object>>() {
        };

        // Geo 엔진(cityrun-geo:3000)에 경로 점수 요청
        Map<String, Object> response = geoWebClient.post()
                .uri("/score-route")
                .bodyValue(req)
                .retrieve()
                .bodyToMono(typeRef)
                .block();

        if (response == null || !response.containsKey("route")) {
            throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> recommendedRoute = (Map<String, Object>) response.get("route");

        return recommendedRoute;
    }
}