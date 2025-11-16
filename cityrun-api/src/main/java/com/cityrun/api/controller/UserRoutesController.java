//사용자 경로(저장, 조회, 수정, 삭제) 및 경로 추천 API 엔드포인트를 정의

package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.model.dto.RouteUpdateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.RouteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * @RestController
 *                 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 *                 @RequestMapping("/api/routes")
 *                 이 컨트롤러의 모든 API는 "/api/routes" 접두사를 가짐
 *
 * @RequiredArgsConstructor
 *                          final 필드(AuthService, RouteService)의 생성자를 자동으로 주입
 *                          (DI)
 */
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class UserRoutesController {

    private final AuthService authService; // 인증/권한(세션) 관련 서비스
    private final RouteService routeService; // 경로 관련 비즈니스 로직 서비스

    /**
     * 추천받은 경로 저장 API
     * 
     * @PostMapping
     *              HTTP POST /api/routes 요청 처리
     * @param req     Request Body로 전달된 저장할 경로 정보
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return 생성된 Route 객체와 200 OK 응답
     */
    @PostMapping
    public ResponseEntity<Route> create(@RequestBody RouteCreateRequest req,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 경로 저장 로직 위임
        Route saved = routeService.createRoute(userId, req);
        return ResponseEntity.ok(saved);
    }

    /**
     * '내 경로' 목록 조회 API (프론트 '마이페이지' 탭)
     * @GetMapping("/mine")
     * HTTP GET /api/routes/mine 요청 처리
     * 
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return Route 목록(List)과 200 OK 응답
     */
    @GetMapping("/mine")
    public ResponseEntity<List<Route>> listMine(HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에서 해당 사용자의 모든 저장된 경로 조회
        List<Route> routes = routeService.getUserRoutes(userId);
        return ResponseEntity.ok(routes);
    }

    /**
     * 저장된 경로 이름 수정 API
     * @PutMapping("/{id}")
     * HTTP PUT /api/routes/{id} 요청 처리 (예: /api/routes/1)
     * 
     * @param routeId @PathVariable을 통해 URL 경로에서 추출한 경로 ID
     * @param req     Request Body로 전달된 수정할 정보 (예: name)
     * @param request 수정 권한을 확인하기 위한 HttpServletRequest
     * @return 수정된 Route 객체와 200 OK 응답
     */
    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRouteName(@PathVariable("id") Long routeId,
            @RequestBody RouteUpdateRequest req,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 경로 이름 수정 로직 위임 (본인 경로인지 권한 확인 포함)
        Route updatedRoute = routeService.updateRouteName(userId, routeId, req);
        return ResponseEntity.ok(updatedRoute);
    }

    /**
     * 저장된 경로 삭제 API
     * @DeleteMapping("/{id}")
     * HTTP DELETE /api/routes/{id} 요청 처리 (예: /api/routes/1)
     * 
     * @param routeId @PathVariable을 통해 URL 경로에서 추출한 경로 ID
     * @param request 삭제 권한을 확인하기 위한 HttpServletRequest
     * @return 204 No Content 응답 (성공적으로 삭제되었으나 본문 내용은 없음)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable("id") Long routeId,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 경로 삭제 로직 위임 (본인 경로인지 권한 확인 포함)
        routeService.deleteRoute(userId, routeId);
        return ResponseEntity.noContent().build(); // 204 응답 반환
    }

    /**
     * 'cityrun-geo' 서비스에 경로 추천 요청 API
     * @PostMapping("/recommend")
     * HTTP POST /api/routes/recommend 요청 처리
     * 
     * @param req Request Body로 전달된 추천 요청 정보 (출발지, 목표 거리, 옵션)
     * @return 'cityrun-geo'가 반환한 추천 경로 정보(Map)와 200 OK 응답
     */
    @PostMapping("/recommend")
    public ResponseEntity<Map<String, Object>> recommend(@RequestBody RecommendRequest req) {
        // WebClient를 통해 'cityrun-geo' 서비스 호출
        Map<String, Object> recommendedRouteInfo = routeService.recommendRoute(req);
        return ResponseEntity.ok(recommendedRouteInfo);
    }
}