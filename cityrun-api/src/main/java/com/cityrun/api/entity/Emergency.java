// 'emergency_requests' 테이블과 매핑되는 JPA 엔티티(Entity) 클래스
package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * @Entity
 *         이 클래스가 JPA 엔티티임을 명시
 *
 * @Table(name = "emergency_requests")
 *             실제 데이터베이스의 'emergency_requests' 테이블과 매핑
 *
 * @Getter
 * @Setter
 * @NoArgsConstructor
 * @AllArgsConstructor
 * @Builder
 *          Lombok 어노테이션: Getter, Setter, 기본 생성자, 모든 필드 생성자, 빌더 패턴 자동 생성
 */
@Entity
@Table(name = "emergency_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Emergency {
    @Id // 이 필드가 Primary Key(기본 키)임을 명시
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 기본 키 생성을 DB의 AUTO_INCREMENT에 위임
    private Long id; // SOS 요청 고유 ID

    @Column(name = "user_id") // 'user_id' 컬럼과 매핑
    private Long userId; // 요청한 사용자 ID

    @Column(name = "lat") // 'lat' 컬럼과 매핑
    private Double lat; // 요청 시점 위도

    @Column(name = "lng") // 'lng' 컬럼과 매핑
    private Double lng; // 요청 시점 경도

    @Column(name = "status") // 'status' 컬럼과 매핑
    private String status; // 요청 상태 (예: 'SENT')
}