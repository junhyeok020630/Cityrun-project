package com.cityrun.api.model.dto;
import lombok.Data;

@Data
public class SosRequest {
    private Long userId;
    private Double lat;
    private Double lng;
}
