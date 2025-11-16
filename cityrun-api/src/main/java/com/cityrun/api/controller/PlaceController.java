// Naver 장소 검색 API를 중계(Proxy)하는 엔드포인트 정의
package com.cityrun.api.controller;

import com.cityrun.api.model.dto.PlaceSearchResponse;
import com.cityrun.api.service.NaverPlaceSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @RestController
 * 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 * @RequestMapping("/api/places")
 * 이 컨트롤러의 모든 API는 "/api/places" 접두사를 가짐
 *
 * @RequiredArgsConstructor
 * final 필드(NaverPlaceSearchService)의 생성자를 자동으로 주입 (DI)
 */
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    // Naver Local Search API 호출을 담당하는 서비스
    private final NaverPlaceSearchService naverPlaceSearchService;

    /**
     * 장소 검색 API 엔드포인트
     * (프론트엔드에서 /api/places/search?query=...로 호출)
     * @GetMapping("/search")
     * HTTP GET /api/places/search 요청 처리
     * @param query 검색할 키워드 (필수)
     * @param lat   검색 기준 위도 (옵션)
     * @param lng   검색 기준 경도 (옵션)
     * @return PlaceSearchResponse (장소 목록)와 200 OK 응답
     */
    @GetMapping("/search")
    public ResponseEntity<PlaceSearchResponse> searchPlaces(
            @RequestParam String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        // Naver 검색 서비스 로직 호출
        PlaceSearchResponse response = naverPlaceSearchService.searchPlaces(query, lat, lng);
        // 검색 결과 반환
        return ResponseEntity.ok(response);
    }
}