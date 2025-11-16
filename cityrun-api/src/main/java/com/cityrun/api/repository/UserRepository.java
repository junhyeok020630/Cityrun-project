// 'User' 엔티티(users 테이블)의 데이터 접근(DB 쿼리) 리포지토리
package com.cityrun.api.repository;

import com.cityrun.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * @interface JpaRepository<User, Long>
 *            JpaRepository를 상속받아 'User' 엔티티에 대한 기본적인 CRUD 메서드(findAll,
 *            findById, save, delete 등)를 자동 생성
 *            - User: 관리할 엔티티 클래스
 *            - Long: 엔티티의 Primary Key 타입
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일(email)을 기준으로 사용자를 조회
     * (Spring Data JPA의 쿼리 메서드 기능)
     * (로그인, 회원가입 시 중복 체크 등에 사용)
     * 
     * @param email 조회할 사용자 이메일
     * @return Optional<User> (사용자가 존재하지 않을 수 있으므로 Optional로 감쌈)
     */
    Optional<User> findByEmail(String email);
}