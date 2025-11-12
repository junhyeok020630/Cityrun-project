package com.cityrun.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Qualifier; // 💡 추가

import java.util.Map;
import java.util.Optional;

@Service
public class TmapApiService {

    private final WebClient tmapWebClient;

    @Value("${tmap.api.app-key}")
    private String tmapAppKey;

    @Value("${tmap.directions.pedestrian-url}")
    private String tmapDirectionsUrl;

    // 💡 생성자 수정: 'tmapWebClient'라는 이름의 빈을 주입받도록 변경
    public TmapApiService(@Qualifier("tmapWebClient") WebClient tmapWebClient) {
        this.tmapWebClient = tmapWebClient;
    }

    /**
     * TMAP 도보 길찾기 API를 호출하여 실제 경로(GeoJSON)를 가져옵니다.
     */
    public Optional<Map<String, Object>> getPedestrianDirections(double originLat, double originLng, double destLat,
            double destLng) {

        Map<String, Object> requestBody = Map.of(
                "startX", String.valueOf(originLng),
                "startY", String.valueOf(originLat),
                "endX", String.valueOf(destLng),
                "endY", String.valueOf(destLat),
                "reqCoordType", "WGS84GEO",
                "resCoordType", "WGS84GEO",
                "startName", "출발지",
                "endName", "도착지");

        ParameterizedTypeReference<Map<String, Object>> typeRef = new ParameterizedTypeReference<>() {
        };

        try {
            Map<String, Object> response = tmapWebClient.post()
                    .uri(tmapDirectionsUrl)
                    .header("accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("appKey", tmapAppKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(typeRef)
                    .block();

            return Optional.ofNullable(response);

        } catch (Exception e) {
            System.err.println("TMAP API 호출 실패: " + e.getMessage());
            return Optional.empty();
        }
    }
}