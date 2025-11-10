// src/main/java/com/cityrun/api/controller/RouteController.java
package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.RouteService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;
    private final AuthService authService;

    @PostMapping
    public Map<String, Object> create(@RequestBody RouteCreateRequest req, HttpSession session) {
        Long userId = authService.requireUserId(session.getId());
        Route saved = routeService.create(userId, req);
        return Map.of("status", "OK", "id", saved.getId());
    }

    @GetMapping("/public")
    public List<Route> listPublic() {
        return routeService.listPublic();
    }

    @GetMapping("/mine")
    public List<Route> listMine(HttpSession session) {
        Long userId = authService.requireUserId(session.getId());
        return routeService.listMine(userId);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id, HttpSession session) {
        Long userId = authService.requireUserId(session.getId());
        routeService.delete(userId, id);
        return Map.of("status", "OK");
    }
}
