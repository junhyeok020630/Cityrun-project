// src/main/java/com/cityrun/api/model/dto/PlaceDto.java
package com.cityrun.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 프론트에 내려줄 장소 정보 DTO
 * - name : 장소 이름
 * - roadAddress : 도로명 주소
 * - jibunAddress : 지번 주소
 * - x, y : TM128 좌표 (네이버 Local Search의 mapx/mapy)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceDto {

    private String id;
    private String name;
    private String roadAddress;
    private String jibunAddress;
    private Double x; // mapx
    private Double y; // mapy
}
