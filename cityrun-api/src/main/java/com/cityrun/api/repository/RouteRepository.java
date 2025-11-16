// 'Route' 엔티티(user_routes 테이블)의 데이터 접근(DB 쿼리) 리포지토리
package com.cityrun.api.repository;

import com.cityrun.api.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * @interface JpaRepository<Route, Long>
 *            JpaRepository를 상속받아 'Route' 엔티티에 대한 기본적인 CRUD 메서드(findAll,
 *            findById, save, delete 등)를 자동 생성
 *            - Route: 관리할 엔티티 클래스
 *            - Long: 엔티티의 Primary Key 타입
 */
public interface RouteRepository extends JpaRepository<Route, Long> {

    /**
     * 공개된(isPublic=true) 경로들을 ID 역순(최신순)으로 조회
     * (Spring Data JPA의 쿼리 메서드 기능)
     * 
     * @return Route 목록
     */
    List<Route> findByIsPublicTrueOrderByIdDesc();

    /**
     * 특정 사용자의 모든 경로를 ID 역순(최신순)으로 조회
     * (프론트 '마이페이지' 탭에서 사용)
     * 
     * @param userId 조회할 사용자의 ID
     * @return Route 목록 (최신순)
     */
    List<Route> findByUserIdOrderByIdDesc(Long userId);
}