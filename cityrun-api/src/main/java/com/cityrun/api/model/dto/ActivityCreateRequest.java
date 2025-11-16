// '운동 기록 생성' API (/api/activities)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class ActivityCreateRequest {

    // 총 달린 거리 (미터)
    private Integer distanceM;

    // 총 운동 시간 (초)
    private Integer durationS;

    // 평균 페이스 (km당 초)
    private Integer avgPaceSPerKm;

    // (참고: userId는 세션에서 가져오므로 DTO에 포함되지 않음)
}