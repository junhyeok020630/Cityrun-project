// src/main/java/com/cityrun/api/dto/RouteCreateRequest.java
package com.cityrun.api.model.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteCreateRequest {
    private String name;

    // [lat, lng] 형식
    private double[] origin;
    private double[] dest;

    // 테이블 컬럼과 같은 의미/이름
    private Integer distanceM;
    private Integer finalScore; // optional
    private Boolean isPublic;

    // 옵션 A) 클라이언트가 GeoJSON 직접 제공
    private String geomJson;

    // 옵션 B) WKT 제공 시 서버가 GeoJSON으로 변환
    private String geometry; // "LINESTRING(lon lat, lon lat)"
}
