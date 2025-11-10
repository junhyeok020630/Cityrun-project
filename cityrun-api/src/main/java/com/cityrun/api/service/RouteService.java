// src/main/java/com/cityrun/api/service/RouteService.java
package com.cityrun.api.service;

import com.cityrun.api.model.dto.RouteCreateRequest;
import com.cityrun.api.entity.Route;
import com.cityrun.api.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepo;

    @Transactional
    public Route create(Long userId, RouteCreateRequest req) {
        if (req.getOrigin() == null || req.getOrigin().length != 2
                || req.getDest() == null || req.getDest().length != 2) {
            throw new IllegalArgumentException("origin/dest는 [lat, lng] 형식의 2개 좌표가 필요합니다.");
        }
        if (req.getDistanceM() == null)
            throw new IllegalArgumentException("distanceM은 필수입니다.");
        if (req.getIsPublic() == null)
            throw new IllegalArgumentException("isPublic은 필수입니다.");

        // geomJson 결정
        String geomJson = req.getGeomJson();
        if (geomJson == null || geomJson.isBlank()) {
            if (req.getGeometry() != null && !req.getGeometry().isBlank()) {
                geomJson = wktLineStringToGeoJson(req.getGeometry());
            } else {
                // 최소 origin→dest 라인 생성 (GeoJSON은 [lng,lat] 순서)
                double lat1 = req.getOrigin()[0], lng1 = req.getOrigin()[1];
                double lat2 = req.getDest()[0], lng2 = req.getDest()[1];
                geomJson = String.format(
                        "{\"type\":\"LineString\",\"coordinates\":[[%f,%f],[%f,%f]]}",
                        lng1, lat1, lng2, lat2);
            }
        }

        Route r = Route.builder()
                .userId(userId)
                .name(req.getName())
                .originLat(req.getOrigin()[0])
                .originLng(req.getOrigin()[1])
                .destLat(req.getDest()[0])
                .destLng(req.getDest()[1])
                .distanceM(req.getDistanceM())
                .finalScore(req.getFinalScore())
                .isPublic(Boolean.TRUE.equals(req.getIsPublic()))
                .geomJson(geomJson)
                .build();

        return routeRepo.save(r);
    }

    @Transactional(readOnly = true)
    public List<Route> listPublic() {
        return routeRepo.findByIsPublicTrue();
    }

    @Transactional(readOnly = true)
    public List<Route> listMine(Long userId) {
        return routeRepo.findByUserId(userId);
    }

    @Transactional
    public void delete(Long userId, Long routeId) {
        Route r = routeRepo.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("경로가 없습니다."));
        if (!r.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인 소유 경로만 삭제할 수 있습니다.");
        }
        routeRepo.deleteById(routeId);
    }

    // 간단한 WKT(LineString) → GeoJSON 변환
    private String wktLineStringToGeoJson(String wkt) {
        String s = wkt.trim();
        if (!s.toUpperCase().startsWith("LINESTRING(") || !s.endsWith(")")) {
            throw new IllegalArgumentException("지원하지 않는 WKT 형식: " + wkt);
        }
        String inner = s.substring(s.indexOf('(') + 1, s.length() - 1).trim();
        StringBuilder coords = new StringBuilder();
        coords.append("[");
        String[] pairs = inner.split(",");
        for (int i = 0; i < pairs.length; i++) {
            String[] xy = pairs[i].trim().split("\\s+");
            if (xy.length != 2)
                throw new IllegalArgumentException("잘못된 WKT 좌표: " + pairs[i]);
            double lon = Double.parseDouble(xy[0]);
            double lat = Double.parseDouble(xy[1]);
            if (i > 0)
                coords.append(",");
            coords.append("[").append(lon).append(",").append(lat).append("]");
        }
        coords.append("]");
        return "{\"type\":\"LineString\",\"coordinates\":" + coords + "}";
    }
}
