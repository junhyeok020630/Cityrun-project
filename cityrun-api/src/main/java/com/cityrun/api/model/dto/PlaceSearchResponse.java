// src/main/java/com/cityrun/api/model/dto/PlaceSearchResponse.java
package com.cityrun.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * /api/places/search 응답 래퍼
 */
@Data
@AllArgsConstructor
public class PlaceSearchResponse {
    private List<PlaceDto> places;
}
