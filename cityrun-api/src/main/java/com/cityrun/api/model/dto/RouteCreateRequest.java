package com.cityrun.api.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RouteCreateRequest {
    private String name;
    private Double[] origin; // [lat, lng]
    private Double[] dest; // [lat, lng]
    private Integer distanceM;
    private Integer finalScore; // optional
    private Integer uphillM; // 💡 추가
    private Integer crosswalkCount; // 💡 추가
    private Integer nightScore; // 💡 추가
    private Integer crowdScore; // 💡 추가
    private Boolean isPublic;
    private String geomJson; // GeoJSON 문자열
}