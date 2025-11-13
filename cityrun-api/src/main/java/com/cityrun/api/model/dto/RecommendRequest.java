package com.cityrun.api.model.dto;

import lombok.Data;
import java.util.Map;

@Data
public class RecommendRequest {
    private Double[] origin; // 💡 double[] -> Double[] 로 변경 (JSON 배열 직렬화 안정화)
    private Double[] dest; // 💡 double[] -> Double[] 로 변경
    private Double distanceKm;
    private Map<String, Object> prefs;
}