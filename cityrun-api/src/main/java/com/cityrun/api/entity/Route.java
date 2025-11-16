// user_routes 테이블과 매핑되는 JPA 엔티티(Entity) 클래스

package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * @Entity
 *         이 클래스가 JPA 엔티티임을 명시
 *
 * @Table(name = "user_routes")
 *             실제 데이터베이스의 'user_routes' 테이블과 매핑
 *
 * @Getter
 * @Setter
 * @NoArgsConstructor
 * @AllArgsConstructor
 * @Builder
 *          Lombok 어노테이션: Getter, Setter, 기본 생성자, 모든 필드 생성자, 빌더 패턴 자동 생성
 */
@Entity
@Table(name = "user_routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id // 이 필드가 Primary Key(기본 키)임을 명시
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 기본 키 생성을 DB의 AUTO_INCREMENT에 위임
    private Long id; // 경로 고유 ID

    @Column(name = "user_id", nullable = false) // 'user_id' 컬럼과 매핑, Not Null
    private Long userId; // 이 경로를 생성한 사용자 ID (users.id)

    @Column(nullable = false, length = 100) // 'name' 컬럼과 매핑, Not Null, 길이 100
    private String name; // 경로 이름

    @Column(name = "origin_lat", nullable = false) // 'origin_lat' 컬럼과 매핑, Not Null
    private Double originLat; // 출발지 위도

    @Column(name = "origin_lng", nullable = false) // 'origin_lng' 컬럼과 매핑, Not Null
    private Double originLng; // 출발지 경도

    @Column(name = "dest_lat", nullable = false) // 'dest_lat' 컬럼과 매핑, Not Null
    private Double destLat; // 도착지 위도 (루프 경로의 경우 출발지와 동일)

    @Column(name = "dest_lng", nullable = false) // 'dest_lng' 컬럼과 매핑, Not Null
    private Double destLng; // 도착지 경도 (루프 경로의 경우 출발지와 동일)

    @Column(name = "distance_m", nullable = false) // 'distance_m' 컬럼과 매핑, Not Null
    private Integer distanceM; // 총 거리 (미터)

    // 상세 점수 필드들 (DB init.sql에 정의됨)
    @Column(name = "uphill_m") // 'uphill_m' 컬럼과 매핑 (Null 허용)
    private Integer uphillM; // 오르막 (확장용)

    @Column(name = "crosswalk_count") // 'crosswalk_count' 컬럼과 매핑 (Null 허용)
    private Integer crosswalkCount; // 횡단보도 개수

    @Column(name = "night_score") // 'night_score' 컬럼과 매핑 (Null 허용)
    private Integer nightScore; // 야간 안전 점수

    @Column(name = "crowd_score") // 'crowd_score' 컬럼과 매핑 (Null 허용)
    private Integer crowdScore; // 혼잡도 점수

    @Column(name = "final_score") // 'final_score' 컬럼과 매핑 (Null 허용)
    private Integer finalScore; // 최종 추천 점수

    @Column(name = "is_public", nullable = false) // 'is_public' 컬럼과 매핑, Not Null
    private Boolean isPublic; // 경로 공개 여부 (확장용)

    @Column(name = "geom_json", columnDefinition = "json", nullable = false) // 'geom_json' 컬럼과 매핑
    // columnDefinition="json": DB의 JSON 타입 명시, Not Null
    private String geomJson; // 경로 좌표 데이터 (GeoJSON 문자열)

    @Column(name = "created_at", insertable = false, updatable = false) // 'created_at' 컬럼과 매핑
    // insertable=false, updatable=false: 이 필드는 DB(CURRENT_TIMESTAMP)가 자동으로 생성
    private java.sql.Timestamp createdAt; // 경로 생성 시간
}