// 'user_activities' 테이블과 매핑되는 JPA 엔티티(Entity) 클래스
package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * @Entity
 *         이 클래스가 JPA 엔티티임을 명시
 *
 * @Table(name = "user_activities")
 *             실제 데이터베이스의 'user_activities' 테이블과 매핑
 *
 * @Getter
 * @Setter
 * @NoArgsConstructor
 * @AllArgsConstructor
 * @Builder
 *          Lombok 어노테이션: Getter, Setter, 기본 생성자, 모든 필드 생성자, 빌더 패턴 자동 생성
 */
@Entity
@Table(name = "user_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id // 이 필드가 Primary Key(기본 키)임을 명시
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 기본 키 생성을 DB의 AUTO_INCREMENT에 위임
    private Long id; // 활동 고유 ID

    @Column(name = "user_id", nullable = false) // 'user_id' 컬럼과 매핑, Not Null
    private Long userId; // 이 활동을 수행한 사용자 ID (users.id)

    @Column(name = "distance_m", nullable = false) // 'distance_m' 컬럼과 매핑, Not Null
    private Integer distanceM; // 총 달린 거리 (미터)

    @Column(name = "duration_s", nullable = false) // 'duration_s' 컬럼과 매핑, Not Null
    private Integer durationS; // 총 운동 시간 (초)

    @Column(name = "avg_pace_s_per_km") // 'avg_pace_s_per_km' 컬럼과 매핑 (Null 허용)
    private Integer avgPaceSPerKm; // 평균 페이스 (km당 초)

    @Column(name = "created_at", insertable = false, updatable = false) // 'created_at' 컬럼과 매핑
    // insertable=false, updatable=false: 이 필드는 DB(CURRENT_TIMESTAMP)가 자동으로 생성
    private java.sql.Timestamp createdAt; // 운동 완료(저장) 시간
}