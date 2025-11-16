// '장소 검색' API (/api/places/search)의 최종 응답 래퍼 DTO
package com.cityrun.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * /api/places/search 응답 래퍼
 *
 * @Data
 *       Lombok 어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode 자동 생성
 *
 * @AllArgsConstructor
 *                     모든 필드를 인자로 받는 생성자 자동 생성
 */
@Data
@AllArgsConstructor
public class PlaceSearchResponse {

    // 장소 목록 (List<PlaceDto>)
    private List<PlaceDto> places;
}