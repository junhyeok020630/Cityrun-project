// '경로 추천' API (/api/routes/recommend)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;
import java.util.Map;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class RecommendRequest {

    // 출발지 좌표 [위도, 경도]
    private Double[] origin;

    // 도착지 좌표 [위도, 경도] (현재 루프 경로만 사용하므로 미사용)
    private Double[] dest;

    // 사용자가 원하는 목표 거리 (km)
    private Double distanceKm;

    // 사용자 선호 옵션 (예: {"minimizeCrosswalks": true})
    private Map<String, Object> prefs;
}