package com.cityrun.api.service;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.model.dto.RouteUpdateRequest; // 🔻 1. import 추가
import com.cityrun.api.entity.Route;
import com.cityrun.api.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.core.ParameterizedTypeReference;

import org.springframework.web.reactive.function.client.WebClientResponseException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;

    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // ... (기존 createRoute 코드)
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
    public List<Route> getUserRoutes(Long userId) {
        return routeRepo.findByUserIdOrderByIdDesc(userId);
    }

    // 🔻 2. 경로 이름 수정 메서드 추가 🔻
    @Transactional
    public Route updateRouteName(Long userId, Long routeId, RouteUpdateRequest req) {
        // 1. 경로를 찾음
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("경로를 찾을 수 없습니다. id=" + routeId));

        // 2. 사용자 ID가 일치하는지 확인 (본인만 수정 가능)
        if (!route.getUserId().equals(userId)) {
            throw new IllegalStateException("이 경로를 수정할 권한이 없습니다.");
        }

        // 3. 이름 업데이트
        if (req.getName() != null && !req.getName().isBlank()) {
            route.setName(req.getName());
        }

        return routeRepo.save(route);
    }

    // 🔻 3. 경로 삭제 메서드 추가 🔻
    @Transactional
    public void deleteRoute(Long userId, Long routeId) {
        // 1. 경로를 찾음
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("경로를 찾을 수 없습니다. id=" + routeId));

        // 2. 사용자 ID가 일치하는지 확인 (본인만 삭제 가능)
        if (!route.getUserId().equals(userId)) {
            throw new IllegalStateException("이 경로를 삭제할 권한이 없습니다.");
        }

        // 3. 삭제
        routeRepo.delete(route);
    }
    // 🔺🔺🔺

    @Transactional(readOnly = true)
    public Map<String, Object> recommendRoute(RecommendRequest req) {
        // ... (기존 recommendRoute 코드)
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };
        try {
            Map<String, Object> geoResponse = geoWebClient.post()
                    .uri("/score-route")
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(typeRef)
                    .block();
            if (geoResponse == null || !geoResponse.containsKey("route")) {
                throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다.");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> recommendedRoute = (Map<String, Object>) geoResponse.get("route");
            return recommendedRoute;
        } catch (WebClientResponseException.BadRequest | WebClientResponseException.NotFound e) {
            String errorBody = e.getResponseBodyAsString();
            String userMessage = "경로를 찾을 수 없습니다. 출발지를 다시 설정해주세요.";
            if (errorBody != null && !errorBody.isBlank() && errorBody.contains("\"errorCode\"")) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> errorMap = objectMapper.readValue(errorBody, Map.class);
                    userMessage = (String) errorMap.getOrDefault("error", userMessage);
                } catch (Exception parseEx) {
                    System.err.println("Geo-engine 4xx JSON 파싱 실패: " + parseEx.getMessage());
                }
            } else {
                System.err.println("Geo-engine 4xx 응답이 JSON이 아님: " + errorBody);
            }
            throw new IllegalArgumentException(userMessage);
        }
    }
}