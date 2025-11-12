package com.cityrun.api.model.dto;

import lombok.Data;
import java.util.Map;

@Data
public class RecommendRequest {
    private double[] origin;
    private double[] dest; // 💡 참고: OSM 엔진은 dest를 사용하지 않지만, App.jsx가 아직 보내고 있습니다.
    private Double distanceKm; // 💡 목표 거리
    private Map<String, Object> prefs;
}