// src/main/java/com/cityrun/api/controller/PlaceController.java
package com.cityrun.api.controller;

import com.cityrun.api.model.dto.PlaceSearchResponse;
import com.cityrun.api.service.NaverPlaceSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * /api/places/search 엔드포인트
 * - React 에서 axios.get('/api/places/search', { params: { query, lat, lng } })
 * 로 호출하는 부분과 연결
 */
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final NaverPlaceSearchService naverPlaceSearchService;

    @GetMapping("/search")
    public ResponseEntity<PlaceSearchResponse> searchPlaces(
            @RequestParam String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        PlaceSearchResponse response = naverPlaceSearchService.searchPlaces(query, lat, lng);
        return ResponseEntity.ok(response);
    }
}
