package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RecommendRequest;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.model.dto.RouteUpdateRequest; // 🔻 1. import 추가
import com.cityrun.api.entity.Route;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.RouteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class UserRoutesController {

    private final AuthService authService;
    private final RouteService routeService;

    @PostMapping
    public ResponseEntity<Route> create(@RequestBody RouteCreateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        Route saved = routeService.createRoute(userId, req);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Route>> listMine(HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        List<Route> routes = routeService.getUserRoutes(userId);
        return ResponseEntity.ok(routes);
    }

    // 🔻 2. 경로 이름 수정 API 추가 🔻
    @PutMapping("/{id}")
    public ResponseEntity<Route> updateRouteName(@PathVariable("id") Long routeId,
            @RequestBody RouteUpdateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        Route updatedRoute = routeService.updateRouteName(userId, routeId, req);
        return ResponseEntity.ok(updatedRoute);
    }

    // 🔻 3. 경로 삭제 API 추가 🔻
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@PathVariable("id") Long routeId,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        routeService.deleteRoute(userId, routeId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
    // 🔺🔺🔺

    @PostMapping("/recommend")
    public ResponseEntity<Map<String, Object>> recommend(@RequestBody RecommendRequest req) {
        Map<String, Object> recommendedRouteInfo = routeService.recommendRoute(req);
        return ResponseEntity.ok(recommendedRouteInfo);
    }
}