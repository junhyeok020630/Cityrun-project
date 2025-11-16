// 'users' 테이블과 매핑되는 JPA 엔티티(Entity) 클래스
package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * @Entity
 *         이 클래스가 JPA 엔티티임을 명시
 *
 * @Table(name = "users")
 *             실제 데이터베이스의 'users' 테이블과 매핑
 *
 * @Getter
 * @Setter
 * @NoArgsConstructor
 * @AllArgsConstructor
 * @Builder
 *          Lombok 어노테이션: Getter, Setter, 기본 생성자, 모든 필드 생성자, 빌더 패턴 자동 생성
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id // 이 필드가 Primary Key(기본 키)임을 명시
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 기본 키 생성을 DB의 AUTO_INCREMENT에 위임
    private Long id; // 사용자 고유 ID

    @Column(nullable = false, unique = true) // 'email' 컬럼과 매핑, Not Null, Unique
    private String email; // 사용자 이메일 (로그인 ID)

    @Column(name = "password_hash", nullable = false) // 'password_hash' 컬럼과 매핑, Not Null
    private String passwordHash; // BCrypt로 해시된 비밀번호

    @Column(nullable = false) // 'nickname' 컬럼과 매핑, Not Null
    private String nickname; // 사용자 닉네임

    @Column(name = "created_at", insertable = false, updatable = false) // 'created_at' 컬럼과 매핑
    // insertable=false, updatable=false: 이 필드는 DB(CURRENT_TIMESTAMP)가 자동으로 생성
    private java.sql.Timestamp createdAt; // 계정 생성 시간
}