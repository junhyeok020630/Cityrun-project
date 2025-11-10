package com.cityrun.api.model;
import lombok.Data;
import java.util.Map;

@Data
public class RecommendRequest {
    private double[] origin;
    private double[] dest;
    private Map<String, Object> prefs;
}
