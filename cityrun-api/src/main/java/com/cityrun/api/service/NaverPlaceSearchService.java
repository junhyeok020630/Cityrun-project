// src/main/java/com/cityrun/api/service/NaverPlaceSearchService.java
package com.cityrun.api.service;

import com.cityrun.api.model.dto.PlaceDto;
import com.cityrun.api.model.dto.PlaceSearchResponse;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
// import 추가 필요
import java.nio.charset.StandardCharsets;

/**
 * 네이버 Local Search(지역 검색) API 호출 서비스
 */
@Service
@RequiredArgsConstructor
public class NaverPlaceSearchService {

    private static final String NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

    @Value("${naver.search.client-id}")
    private String clientId;

    @Value("${naver.search.client-secret}")
    private String clientSecret;

    // 간단히 service 내부에서 사용
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * query(검색어)로 네이버 지역 검색 API 호출
     *
     * @param query 검색어
     * @param lat   (옵션) 사용자 위도
     * @param lng   (옵션) 사용자 경도
     */
    public PlaceSearchResponse searchPlaces(String query, Double lat, Double lng) {
        // 1) 요청 URI 구성
        // lat/lng는 지금은 정렬에 안 쓰지만, 필요하면 나중에 서버 쪽에서 거리순 정렬 등에 활용
        // ✅ 수정 후 (권장 버전)
        URI uri = UriComponentsBuilder
                .fromUriString(NAVER_LOCAL_SEARCH_URL)
                .queryParam("query", query)
                .queryParam("display", 10)
                .queryParam("start", 1)
                .queryParam("sort", "random")
                .encode(StandardCharsets.UTF_8) // 한글 포함 파라미터를 UTF-8로 인코딩
                .build()
                .toUri();

        // 2) 인증 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Naver-Client-Id", clientId);
        headers.set("X-Naver-Client-Secret", clientSecret);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        // 3) 네이버 Open API 호출
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                entity,
                JsonNode.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Naver Local Search API error: "
                    + response.getStatusCode());
        }

        JsonNode body = response.getBody();
        JsonNode items = body != null ? body.get("items") : null;

        List<PlaceDto> places = new ArrayList<>();

        if (items != null && items.isArray()) {
            int index = 0;
            for (JsonNode item : items) {
                // title, address(지번), roadAddress(도로명), mapx, mapy, link ...
                String rawTitle = item.path("title").asText(null);
                String title = stripHtml(rawTitle); // <b>태그 제거

                String roadAddr = item.path("roadAddress").asText(null);
                String jibunAddr = item.path("address").asText(null);

                Double mapx = parseDoubleOrNull(item.path("mapx").asText(null));
                Double mapy = parseDoubleOrNull(item.path("mapy").asText(null));

                String id = item.path("link").asText(); // link가 없으면 index 사용
                if (id == null || id.isBlank()) {
                    id = String.valueOf(index);
                }

                PlaceDto place = PlaceDto.builder()
                        .id(id)
                        .name(title)
                        .roadAddress(roadAddr)
                        .jibunAddress(jibunAddr)
                        .x(mapx)
                        .y(mapy)
                        .build();

                places.add(place);
                index++;
            }
        }

        return new PlaceSearchResponse(places);
    }

    /**
     * title에 포함된 <b>...</b> 태그 제거
     */
    private String stripHtml(String html) {
        if (html == null)
            return null;
        return html.replaceAll("<[^>]*>", "");
    }

    private Double parseDoubleOrNull(String text) {
        try {
            if (text == null || text.isBlank())
                return null;
            return Double.parseDouble(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
