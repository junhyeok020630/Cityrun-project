// Naver Local Search(지역 검색) API 호출을 담당하는 서비스
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
import java.nio.charset.StandardCharsets; // 한글 쿼리 인코딩용

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          (Lombok) final 필드용 생성자 자동 주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class NaverPlaceSearchService {

    // Naver Local Search API 엔드포인트 URL
    private static final String NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

    // application.properties에서 Naver Client ID 주입
    @Value("${naver.search.client-id}")
    private String clientId;

    // application.properties에서 Naver Client Secret 주입
    @Value("${naver.search.client-secret}")
    private String clientSecret;

    // Naver API 호출을 위한 동기식 HTTP 클라이언트
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * query(검색어)로 Naver 지역 검색 API 호출
     *
     * @param query 검색어 (예: "가천대학교")
     * @param lat   (옵션) 사용자 위도
     * @param lng   (옵션) 사용자 경도
     * @return PlaceSearchResponse (장소 목록 DTO)
     */
    public PlaceSearchResponse searchPlaces(String query, Double lat, Double lng) {

        // 1) 요청 URI 구성 (한글 파라미터 UTF-8 인코딩 포함)
        URI uri = UriComponentsBuilder
                .fromUriString(NAVER_LOCAL_SEARCH_URL)
                .queryParam("query", query) // 검색어
                .queryParam("display", 10) // 검색 결과 수 (최대 10개)
                .queryParam("start", 1) // 검색 시작 위치
                .queryParam("sort", "random") // 정렬 옵션 (정확도순이 아닌 무작위순)
                .encode(StandardCharsets.UTF_8) // 한글 쿼리 인코딩
                .build()
                .toUri();

        // 2) 인증 헤더 설정 (Client ID, Client Secret)
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Naver-Client-Id", clientId);
        headers.set("X-Naver-Client-Secret", clientSecret);

        // HTTP 요청 엔티티 생성 (헤더 포함)
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        // 3) Naver Open API 호출 (RestTemplate 사용)
        ResponseEntity<JsonNode> response = restTemplate.exchange(
                uri,
                HttpMethod.GET, // GET 방식
                entity,
                JsonNode.class); // 응답을 Jackson의 JsonNode로 받음

        // 4) 응답 코드 확인
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Naver Local Search API error: "
                    + response.getStatusCode());
        }

        // 5) JSON 응답 파싱
        JsonNode body = response.getBody();
        JsonNode items = body != null ? body.get("items") : null;

        List<PlaceDto> places = new ArrayList<>();

        if (items != null && items.isArray()) {
            int index = 0;
            for (JsonNode item : items) {
                // Naver API 응답에서 필요한 정보(title, roadAddress, mapx, mapy 등) 추출
                String rawTitle = item.path("title").asText(null);
                String title = stripHtml(rawTitle); // <b> 태그 제거

                String roadAddr = item.path("roadAddress").asText(null);
                String jibunAddr = item.path("address").asText(null);

                // Naver mapx/mapy는 TM128 좌표 (Double)
                Double mapx = parseDoubleOrNull(item.path("mapx").asText(null));
                Double mapy = parseDoubleOrNull(item.path("mapy").asText(null));

                // 고유 ID가 없는 경우를 대비해 link 또는 index 사용
                String id = item.path("link").asText();
                if (id == null || id.isBlank()) {
                    id = String.valueOf(index);
                }

                // 프론트엔드로 전달할 PlaceDto 객체 생성
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

        // 6) 최종 응답 래퍼(PlaceSearchResponse)로 감싸서 반환
        return new PlaceSearchResponse(places);
    }

    /**
     * Naver API 응답의 title에 포함된 HTML <b> 태그를 제거하는 헬퍼 메서드
     * 
     * @param html HTML 태그가 포함된 문자열
     * @return HTML 태그가 제거된 순수 텍스트
     */
    private String stripHtml(String html) {
        if (html == null)
            return null;
        return html.replaceAll("<[^>]*>", "");
    }

    /**
     * 문자열을 Double로 파싱하되, 실패 시 null을 반환하는 헬퍼 메서드
     * 
     * @param text 파싱할 문자열
     * @return Double 또는 null
     */
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