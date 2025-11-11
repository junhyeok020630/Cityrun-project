// src/main/java/com/cityrun/api/entity/Route.java
package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "origin_lat", nullable = false)
    private Double originLat;

    @Column(name = "origin_lng", nullable = false)
    private Double originLng;

    @Column(name = "dest_lat", nullable = false)
    private Double destLat;

    @Column(name = "dest_lng", nullable = false)
    private Double destLng;

    @Column(name = "distance_m", nullable = false)
    private Integer distanceM;

    // 💡 추가된 상세 점수 필드들 (DB init.sql에 정의됨)
    @Column(name = "uphill_m") // NULL 허용 (DB 스키마 확인)
    private Integer uphillM;

    @Column(name = "crosswalk_count") // NULL 허용 (DB 스키마 확인)
    private Integer crosswalkCount;

    @Column(name = "night_score") // NULL 허용 (DB 스키마 확인)
    private Integer nightScore;

    @Column(name = "crowd_score") // NULL 허용 (DB 스키마 확인)
    private Integer crowdScore;
    // ----------------------------------------------------

    @Column(name = "final_score") // NULL 허용
    private Integer finalScore;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    @Column(name = "geom_json", columnDefinition = "json", nullable = false)
    private String geomJson;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.sql.Timestamp createdAt;
}