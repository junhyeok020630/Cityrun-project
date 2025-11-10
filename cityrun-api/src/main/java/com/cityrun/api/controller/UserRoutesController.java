package com.cityrun.api.controller;

import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.repository.RouteRepository;
import com.cityrun.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class UserRoutesController {

    private final RouteRepository routeRepo;
    private final AuthService authService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RouteCreateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);

        Route r = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin() != null ? req.getOrigin()[0] : null)
                .originLng(req.getOrigin() != null ? req.getOrigin()[1] : null)
                .destLat(req.getDest() != null ? req.getDest()[0] : null)
                .destLng(req.getDest() != null ? req.getDest()[1] : null)
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                .isPublic(Boolean.TRUE.equals(req.getIsPublic()))
                .geomJson(req.getGeomJson())
                // created_at은 DB default CURRENT_TIMESTAMP 사용
                .build();

        Route saved = routeRepo.save(r);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/public")
    public ResponseEntity<?> listPublic() {
        List<Route> routes = routeRepo.findByIsPublicTrueOrderByIdDesc();
        return ResponseEntity.ok(routes);
    }

    @GetMapping("/mine")
    public ResponseEntity<?> listMine(HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        List<Route> routes = routeRepo.findByUserIdOrderByIdDesc(userId);
        return ResponseEntity.ok(routes);
    }

    // 필요시 삭제/수정 엔드포인트는 이후 추가
}
