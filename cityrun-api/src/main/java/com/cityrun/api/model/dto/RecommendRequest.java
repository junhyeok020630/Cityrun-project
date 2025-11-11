package com.cityrun.api.model.dto;

import lombok.Data;
import java.util.Map;

@Data
public class RecommendRequest {
    private Double distanceKm; // 💡 추가: 원하는 거리 (km)
    private double[] origin;
    private double[] dest;
    private Map<String, Object> prefs;
}