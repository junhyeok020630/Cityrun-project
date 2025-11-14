package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
// import com.cityrun.api.repository.RouteRepository; // 💡 제거
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.RouteService; // 💡 추가
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map; // 💡 추가

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class UserRoutesController {

    // private final RouteRepository routeRepo; // 💡 제거: RouteService를 사용하도록 변경
    private final AuthService authService;
    private final RouteService routeService; // 💡 추가/변경: 서비스 계층 사용

    @PostMapping
    public ResponseEntity<Route> create(@RequestBody RouteCreateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        // 기존: routeRepo를 사용해 엔티티 직접 빌드 및 저장
        // 변경: RouteService의 createRoute 메서드 사용
        Route saved = routeService.createRoute(userId, req);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Route>> listMine(HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        // 기존: routeRepo.findByUserIdOrderByIdDesc(userId)
        // 변경: RouteService의 getUserRoutes 메서드 사용
        List<Route> routes = routeService.getUserRoutes(userId);
        return ResponseEntity.ok(routes);
    }

    // 💡 경로 추천 요청 엔드포인트 추가
    @PostMapping("/recommend")
    public ResponseEntity<Map<String, Object>> recommend(@RequestBody RecommendRequest req) {
        // Geo 엔진과 통신하여 추천 경로 정보(점수 포함)를 받아옵니다.
        Map<String, Object> recommendedRouteInfo = routeService.recommendRoute(req);
        return ResponseEntity.ok(recommendedRouteInfo);
    }

    // 필요시 삭제/수정 엔드포인트는 이후 추가
}