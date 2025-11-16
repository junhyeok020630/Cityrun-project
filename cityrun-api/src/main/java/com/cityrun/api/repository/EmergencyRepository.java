// 'Emergency' 엔티티(emergency_requests 테이블)의 데이터 접근(DB 쿼리) 리포지토리
package com.cityrun.api.repository;

import com.cityrun.api.entity.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * @interface JpaRepository<Emergency, Long>
 *            JpaRepository를 상속받아 'Emergency' 엔티티에 대한 기본적인 CRUD 메서드(findAll,
 *            findById, save, delete 등)를 자동 생성
 *            - Emergency: 관리할 엔티티 클래스
 *            - Long: 엔티티의 Primary Key 타입
 */
public interface EmergencyRepository extends JpaRepository<Emergency, Long> {
}