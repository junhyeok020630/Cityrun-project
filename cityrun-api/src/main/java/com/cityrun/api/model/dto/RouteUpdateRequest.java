// '경로 정보 수정' API (/api/routes/{id})의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class RouteUpdateRequest {

    // 수정할 새로운 경로 이름
    private String name;
}