package com.cityrun.api.service;

import com.cityrun.api.entity.Route;
import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;

    public Route createByUser(Long userId, RouteCreateRequest req) {
        Route route = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin()[0])
                .originLng(req.getOrigin()[1])
                .destLat(req.getDest()[0])
                .destLng(req.getDest()[1])
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                .isPublic(Boolean.TRUE.equals(req.getIsPublic()))
                .geomJson(req.getGeomJson())
                .build();
        return routeRepository.save(route);
    }

    public List<Route> getPublicRoutes() {
        return routeRepository.findByIsPublicTrueOrderByIdDesc();
    }

    public List<Route> getUserRoutes(Long userId) {
        return routeRepository.findByUserIdOrderByIdDesc(userId);
    }
}
