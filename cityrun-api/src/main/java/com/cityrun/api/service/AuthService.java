// '사용자 인증(Auth)' 관련 비즈니스 로직(회원가입, 로그인, 로그아웃, 세션 관리)을 처리하는 서비스
package com.cityrun.api.service;

import com.cityrun.api.model.dto.LoginRequest;
import com.cityrun.api.model.dto.RegisterRequest;
import com.cityrun.api.entity.User;
import com.cityrun.api.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(UserRepository)의 생성자를 자동으로 주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    // User 엔티티에 접근하기 위한 JPA 리포지토리
    private final UserRepository userRepo;
    // BCrypt 알고리즘을 사용한 비밀번호 암호화/검증기
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * 회원가입 로직
     * 
     * @param req 회원가입 정보 (email, password, nickname)
     */
    @Transactional // 이 메서드가 하나의 트랜잭션으로 실행됨을 명시 (DB 저장)
    public void register(RegisterRequest req) {
        // 1. 입력 값 검증 (email, password 필수)
        Assert.hasText(req.getEmail(), "email required");
        Assert.hasText(req.getPassword(), "password required");

        // 2. 이메일 중복 체크
        userRepo.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalStateException("이미 가입된 이메일입니다");
        });

        // 3. User 엔티티 생성 및 비밀번호 암호화
        User u = User.builder()
                .email(req.getEmail())
                .passwordHash(encoder.encode(req.getPassword())) // 비밀번호를 BCrypt로 해시
                .nickname(req.getNickname())
                .build();

        // 4. DB에 사용자 저장
        userRepo.save(u);
    }

    /**
     * 로그인 로직 (Spring Session 사용)
     * 
     * @param req     로그인 정보 (email, password)
     * @param request 세션(Session)을 생성하기 위한 HttpServletRequest
     */
    @Transactional(readOnly = true) // DB 조작이 없으므로 읽기 전용 트랜잭션 (성능 최적화)
    public void login(LoginRequest req, HttpServletRequest request) {
        // 1. 이메일로 사용자 조회 (없으면 IllegalArgumentException 발생)
        User u = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다"));

        // 2. 비밀번호 검증 (BCrypt로 암호화된 해시와 원본 비밀번호 비교)
        if (!encoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다");
        }

        // 3. Spring Session(HTTP 세션)에 사용자 정보 저장
        // (SessionConfig + @EnableRedisHttpSession 설정에 따라 이 세션은 Redis에 저장됨)
        HttpSession session = request.getSession(true); // 세션이 없으면 새로 생성
        session.setAttribute("userId", u.getId());
        session.setAttribute("email", u.getEmail());
        session.setAttribute("nickname", u.getNickname());
    }

    /**
     * (로그인 필수) 세션에서 사용자 ID 조회
     * (다른 컨트롤러에서 API 호출 시 로그인 여부를 확인하기 위해 사용)
     * 
     * @param request 세션을 조회하기 위한 HttpServletRequest
     * @return Long 타입의 사용자 ID
     */
    @Transactional(readOnly = true)
    public Long requireUserId(HttpServletRequest request) {
        // 1. 현재 세션 조회 (없으면 null)
        HttpSession session = request.getSession(false);
        if (session == null)
            throw new IllegalStateException("로그인이 필요합니다"); // 401 Unauthorized

        // 2. 세션에서 "userId" 속성 조회
        Object v = session.getAttribute("userId");
        if (v == null)
            throw new IllegalStateException("로그인이 필요합니다"); // 401 Unauthorized

        // 3. Long 타입으로 변환하여 반환
        return (v instanceof Long) ? (Long) v : Long.valueOf(String.valueOf(v));
    }

    /**
     * 로그아웃 로직 (세션 무효화)
     * 
     * @param request 세션을 무효화하기 위한 HttpServletRequest
     */
    public void logout(HttpServletRequest request) {
        // 현재 세션 조회 (없으면 아무것도 안 함)
        HttpSession session = request.getSession(false);
        if (session != null)
            session.invalidate(); // 세션 무효화 (Redis에서도 해당 세션 정보 삭제)
    }
}