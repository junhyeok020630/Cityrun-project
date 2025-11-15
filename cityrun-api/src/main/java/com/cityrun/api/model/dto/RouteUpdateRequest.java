package com.cityrun.api.model.dto;

import lombok.Data;

@Data
public class RouteUpdateRequest {
    // 널이 아니거나 비어있지 않은 이름만 허용 (필요시 @NotBlank 추가)
    private String name;
}