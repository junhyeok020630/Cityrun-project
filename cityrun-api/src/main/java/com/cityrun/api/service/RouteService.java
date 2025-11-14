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

// 🔻🔻🔻 1. 필요한 클래스 임포트 🔻🔻🔻
import org.springframework.web.reactive.function.client.WebClientResponseException;
import com.fasterxml.jackson.databind.ObjectMapper;
// 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;

    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    // 🔻🔻🔻 2. JSON 파싱을 위한 ObjectMapper 필드 추가 🔻🔻🔻
    private final ObjectMapper objectMapper = new ObjectMapper();
    // 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺

    @Transactional
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // ... (기존 코드 동일)
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

    // 🔻🔻🔻 3. recommendRoute 메서드 수정 (try-catch 강화) 🔻🔻🔻
    @Transactional(readOnly = true)
    public Map<String, Object> recommendRoute(RecommendRequest req) {

        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };

        try {
            Map<String, Object> geoResponse = geoWebClient.post()
                    .uri("/score-route")
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(typeRef)
                    .block(); // ⬅️ 4xx/5xx 에러 발생 시 여기서 예외가 터짐

            if (geoResponse == null || !geoResponse.containsKey("route")) {
                throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다.");
            }

            // 4. Geo 엔진이 생성한 경로를 프론트엔드로 반환
            @SuppressWarnings("unchecked")
            Map<String, Object> recommendedRoute = (Map<String, Object>) geoResponse.get("route");

            return recommendedRoute;

        } catch (WebClientResponseException.BadRequest | WebClientResponseException.NotFound e) {
            // ⬅️ 400(이상치)과 404(경로 없음)를 모두 잡음

            String errorBody = e.getResponseBodyAsString();
            // 💡 사용자에게 보여줄 기본(fallback) 메시지
            String userMessage = "경로를 찾을 수 없습니다. 출발지를 다시 설정해주세요.";

            // 1. cityrun-geo가 보낸 에러 응답이 우리가 예상한 JSON 형태인지 확인
            if (errorBody != null && !errorBody.isBlank() && errorBody.contains("\"errorCode\"")) {
                try {
                    // 2. JSON 파싱 시도
                    @SuppressWarnings("unchecked")
                    Map<String, Object> errorMap = objectMapper.readValue(errorBody, Map.class);
                    // 3. JSON 안의 "error" 메시지를 사용
                    userMessage = (String) errorMap.getOrDefault("error", userMessage);

                } catch (Exception parseEx) {
                    // 4. 파싱 실패 시, 콘솔에만 로그 남기고 기본 메시지(userMessage) 사용
                    System.err.println("Geo-engine 4xx JSON 파싱 실패: " + parseEx.getMessage());
                }
            } else {
                // 5. 404가 플레인 텍스트를 보냈거나, 400이 HTML을 보낸 경우
                System.err.println("Geo-engine 4xx 응답이 JSON이 아님: " + errorBody);
            }

            // 6. RestExceptionHandler가 400으로 처리할 수 있도록,
            // 항상 사용자 친화적인 메시지(userMessage)로 예외 발생
            throw new IllegalArgumentException(userMessage);

        }
        // (참고: 그 외 5xx 같은 에러는 GlobalExceptionHandler가 500으로 처리)
    }
    // 🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺🔺
}