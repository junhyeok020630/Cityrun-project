package com.cityrun.api.model.dto;

import lombok.Data;

@Data
public class ActivityCreateRequest {
    private Integer distanceM;
    private Integer durationS;
    private Integer avgPaceSPerKm;
    // (참고: userId는 세션에서 가져오므로 DTO에 필요 없습니다)
}