// Naver 장소 검색 API의 개별 장소 정보를 담는 DTO
package com.cityrun.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 프론트에 내려줄 장소 정보 DTO
 * (Naver Local Search API의 응답 항목을 기반으로 함)
 *
 * @Data
 * @NoArgsConstructor
 * @AllArgsConstructor
 * @Builder
 *          Lombok 어노테이션: Getter, Setter, 기본 생성자, 모든 필드 생성자, 빌더 패턴 자동 생성
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceDto {

    // 장소 ID (Naver API의 'link' 또는 고유 인덱스)
    private String id;

    // 장소 이름 (HTML 태그가 제거된 이름)
    private String name;

    // 도로명 주소
    private String roadAddress;

    // 지번 주소
    private String jibunAddress;

    // TM128 좌표 (Naver Local Search의 mapx)
    private Double x;

    // TM128 좌표 (Naver Local Search의 mapy)
    private Double y;
}