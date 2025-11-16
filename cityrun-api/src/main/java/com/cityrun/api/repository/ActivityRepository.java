// 'Activity' 엔티티(user_activities 테이블)의 데이터 접근(DB 쿼리) 리포지토리
package com.cityrun.api.repository;

import com.cityrun.api.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * @interface JpaRepository<Activity, Long>
 *            JpaRepository를 상속받아 'Activity' 엔티티에 대한 기본적인 CRUD 메서드(findAll,
 *            findById, save, delete 등)를 자동 생성
 *            - Activity: 관리할 엔티티 클래스
 *            - Long: 엔티티의 Primary Key 타입
 */
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * 특정 사용자의 모든 운동 기록을 ID 역순(최신순)으로 조회
     * (Spring Data JPA의 쿼리 메서드 기능)
     * (프론트 '활동' 탭에서 사용)
     * 
     * @param userId 조회할 사용자의 ID
     * @return Activity 목록 (최신순)
     */
    List<Activity> findByUserIdOrderByIdDesc(Long userId);
}