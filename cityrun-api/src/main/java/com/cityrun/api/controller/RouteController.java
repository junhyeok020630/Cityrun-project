package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.RouteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final AuthService authService;
    private final RouteService routeService;

    @PostMapping
    public ResponseEntity<Route> create(@RequestBody RouteCreateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        return ResponseEntity.ok(routeService.createRoute(userId, req));
    }

    @GetMapping("/public")
    public ResponseEntity<List<Route>> listPublic() {
        return ResponseEntity.ok(routeService.getPublicRoutes());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Route>> listMine(HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        return ResponseEntity.ok(routeService.getUserRoutes(userId));
    }
}
