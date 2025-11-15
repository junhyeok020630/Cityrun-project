package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "distance_m", nullable = false)
    private Integer distanceM;

    @Column(name = "duration_s", nullable = false)
    private Integer durationS;

    @Column(name = "avg_pace_s_per_km") // (선택적)
    private Integer avgPaceSPerKm;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.sql.Timestamp createdAt;
}