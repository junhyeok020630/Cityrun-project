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
    private Boolean isPublic;
    private String geomJson; // GeoJSON 문자열
}
