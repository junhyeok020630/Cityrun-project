// '경로 저장' API (/api/routes)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Getter
 * @Setter
 *         Lombok 어노테이션: Getter/Setter 메서드 자동 생성
 */
@Getter
@Setter
public class RouteCreateRequest {

    // 저장할 경로의 이름
    private String name;

    // 출발지 좌표 [위도, 경도]
    private Double[] origin;

    // 도착지 좌표 [위도, 경도]
    private Double[] dest;

    // 총 거리 (미터)
    private Integer distanceM;

    // 최종 추천 점수
    private Integer finalScore;

    // 오르막 (미터)
    private Integer uphillM;

    // 횡단보도 개수
    private Integer crosswalkCount;

    // 야간 안전 점수
    private Integer nightScore;

    // 혼잡도 점수
    private Integer crowdScore;

    // 경로 공개 여부
    private Boolean isPublic;

    // 경로 좌표 데이터 (GeoJSON 문자열)
    private String geomJson;
}