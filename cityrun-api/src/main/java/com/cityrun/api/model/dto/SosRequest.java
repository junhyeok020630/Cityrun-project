// 'SOS 긴급 요청' API (/api/sos)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class SosRequest {

    // SOS를 요청한 사용자 ID
    private Long userId;

    // 요청 시점의 위도
    private Double lat;

    // 요청 시점의 경도
    private Double lng;
}