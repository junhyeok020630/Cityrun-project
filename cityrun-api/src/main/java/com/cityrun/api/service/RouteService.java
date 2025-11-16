// '경로(Route)' 관련 비즈니스 로직(추천, 저장, 조회, 수정, 삭제)을 처리하는 서비스
package com.cityrun.api.service;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.model.dto.RouteUpdateRequest; // 경로 수정 DTO 임포트
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

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(RouteRepository, geoWebClient)의 생성자를 자동으로
 *                          주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class RouteService {

    // Route 엔티티에 접근하기 위한 JPA 리포지토리
    private final RouteRepository routeRepo;

    // 'geoWebClient' Bean을 주입 (WebClientConfig.java에서 정의)
    @Qualifier("geoWebClient")
    private final WebClient geoWebClient;

    // 'cityrun-geo'의 4xx 오류 응답(JSON)을 파싱하기 위한 ObjectMapper
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 추천받은 경로를 DB에 저장
     * 
     * @param userId 경로를 저장할 사용자 ID (세션에서 획득)
     * @param req    저장할 경로 정보 (DTO)
     * @return 저장된 Route 엔티티 객체
     */
    @Transactional // 이 메서드가 하나의 트랜잭션으로 실행됨을 명시 (DB 저장)
    public Route createRoute(Long userId, RouteCreateRequest req) {
        // DTO를 Route 엔티티로 변환
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
                .isPublic(Boolean.TRUE.equals(req.getIsPublic())) // isPublic (확장용)
                .geomJson(req.getGeomJson()) // GeoJSON 문자열
                .build();
        // 리포지토리를 통해 DB에 저장
        return routeRepo.save(r);
    }

    /**
     * 특정 사용자가 저장한 모든 경로 조회 (프론트 '마이페이지' 탭)
     * 
     * @param userId 조회할 사용자 ID
     * @return Route 엔티티 목록 (최신순)
     */
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션 (성능 최적화)
    public List<Route> getUserRoutes(Long userId) {
        // 리포지토리의 쿼리 메서드를 호출하여 조회
        return routeRepo.findByUserIdOrderByIdDesc(userId);
    }

    /**
     * 저장된 경로의 이름 수정
     * 
     * @param userId  수정을 요청한 사용자 ID (권한 확인용)
     * @param routeId 수정할 경로 ID
     * @param req     수정할 정보 (name이 포함된 DTO)
     * @return 이름이 수정된 Route 엔티티 객체
     */
    @Transactional // 트랜잭션으로 실행 (DB 업데이트)
    public Route updateRouteName(Long userId, Long routeId, RouteUpdateRequest req) {
        // 1. 경로 조회 (없으면 IllegalArgumentException 발생)
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("경로를 찾을 수 없습니다 id=" + routeId));

        // 2. 사용자 ID 일치 확인 (본인 경로인지 권한 확인)
        if (!route.getUserId().equals(userId)) {
            throw new IllegalStateException("이 경로를 수정할 권한이 없습니다");
        }

        // 3. 이름 업데이트 (null이 아니고 비어있지 않은 경우에만)
        if (req.getName() != null && !req.getName().isBlank()) {
            route.setName(req.getName());
        }

        // 4. DB에 변경 사항 저장 (트랜잭션 종료 시 자동 커밋)
        return routeRepo.save(route);
    }

    /**
     * 저장된 경로 삭제
     * 
     * @param userId  삭제를 요청한 사용자 ID (권한 확인용)
     * @param routeId 삭제할 경로 ID
     */
    @Transactional // 트랜잭션으로 실행 (DB 삭제)
    public void deleteRoute(Long userId, Long routeId) {
        // 1. 경로 조회 (없으면 IllegalArgumentException 발생)
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("경로를 찾을 수 없습니다 id=" + routeId));

        // 2. 사용자 ID 일치 확인 (본인 경로인지 권한 확인)
        if (!route.getUserId().equals(userId)) {
            throw new IllegalStateException("이 경로를 삭제할 권한이 없습니다");
        }

        // 3. 리포지토리를 통해 DB에서 삭제
        routeRepo.delete(route);
    }

    /**
     * 'cityrun-geo' 마이크로 서비스에 경로 추천 요청 (WebClient 사용)
     * 
     * @param req 추천 요청 정보 (출발지, 목표 거리, 옵션)
     * @return 'cityrun-geo' 서비스가 반환한 추천 경로 데이터 (Map)
     */
    @Transactional(readOnly = true) // 이 메서드는 DB 쓰기 작업이 없음
    public Map<String, Object> recommendRoute(RecommendRequest req) {
        // 응답을 Map<String, Object> 형태로 받기 위한 타입 참조
        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };
        try {
            // 'geoWebClient' (http://cityrun-geo:3000)로 POST 요청
            Map<String, Object> geoResponse = geoWebClient.post()
                    .uri("/score-route") // 'cityrun-geo'의 /score-route 엔드포인트 호출
                    .bodyValue(req) // RecommendRequest DTO를 Request Body로 전송
                    .retrieve() // 응답 수신
                    .bodyToMono(typeRef) // 응답 본문을 Mono<Map<...>>로 변환
                    .block(); // 비동기 응답을 동기식으로 대기 (결과를 받을 때까지)

            // 응답 유효성 검사
            if (geoResponse == null || !geoResponse.containsKey("route")) {
                throw new RuntimeException("Geo 엔진 응답이 유효하지 않습니다");
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> recommendedRoute = (Map<String, Object>) geoResponse.get("route");
            return recommendedRoute;

        } catch (WebClientResponseException.BadRequest | WebClientResponseException.NotFound e) {
            // 'cityrun-geo'가 400(Bad Request) 또는 404(Not Found)를 반환한 경우
            String errorBody = e.getResponseBodyAsString();
            String userMessage = "경로를 찾을 수 없습니다 출발지를 다시 설정해주세요";

            // 'cityrun-geo'가 보낸 JSON 오류 메시지(errorCode)가 있는지 확인
            if (errorBody != null && !errorBody.isBlank() && errorBody.contains("\"errorCode\"")) {
                try {
                    // JSON 오류 메시지를 파싱하여 사용자에게 보여줄 메시지로 변환
                    @SuppressWarnings("unchecked")
                    Map<String, Object> errorMap = objectMapper.readValue(errorBody, Map.class);
                    userMessage = (String) errorMap.getOrDefault("error", userMessage);
                } catch (Exception parseEx) {
                    System.err.println("Geo-engine 4xx JSON 파싱 실패: " + parseEx.getMessage());
                }
            } else {
                System.err.println("Geo-engine 4xx 응답이 JSON이 아님: " + errorBody);
            }
            // 프론트엔드에 400 Bad Request로 변환하여 전달 (GlobalExceptionHandler가 처리)
            throw new IllegalArgumentException(userMessage);
        }
    }
}