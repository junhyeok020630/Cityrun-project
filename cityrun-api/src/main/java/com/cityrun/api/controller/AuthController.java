// 사용자 인증(회원가입, 로그인, 로그아웃) API 엔드포인트를 정의

package com.cityrun.api.controller;

import com.cityrun.api.model.dto.LoginRequest;
import com.cityrun.api.model.dto.RegisterRequest;
import com.cityrun.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @RestController
 *                 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 *                 @RequestMapping("/api/auth")
 *                 이 컨트롤러의 모든 API는 "/api/auth" 접두사(prefix)를 가짐
 *
 * @RequiredArgsConstructor
 *                          final로 선언된 필드(AuthService)의 생성자를 자동으로 주입 (DI)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // AuthService 비즈니스 로직을 처리하는 서비스 클래스
    private final AuthService authService;

    /**
     * 회원가입 API 엔드포인트
     * @PostMapping("/register")
     * HTTP POST /api/auth/register 요청 처리
     * 
     * @param req Request Body로 전달된 회원가입 정보 (email, password, nickname)
     * @return 성공 시 "회원가입 성공" 메시지 반환
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        authService.register(req); // 서비스에 회원가입 로직 위임
        return ResponseEntity.ok("회원가입 성공");
    }

    /**
     * 로그인 API 엔드포인트
     * @PostMapping("/login")
     * HTTP POST /api/auth/login 요청 처리
     * 
     * @param req     Request Body로 전달된 로그인 정보 (email, password)
     * @param request 세션(Session)을 생성하기 위한 HttpServletRequest
     * @return 성공 시 "로그인 성공" 메시지 반환
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        // 서비스에 로그인 로직 위임 (세션 생성 포함)
        authService.login(req, request);
        return ResponseEntity.ok("로그인 성공");
    }

    /**
     * 로그아웃 API 엔드포인트
     * @PostMapping("/logout")
     * HTTP POST /api/auth/logout 요청 처리
     * 
     * @param request 세션을 무효화하기 위한 HttpServletRequest
     * @return 성공 시 "로그아웃 성공" 메시지 반환
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        authService.logout(request); // 서비스에 로그아웃 로직 위임 (세션 무효화)
        return ResponseEntity.ok("로그아웃 성공");
    }

    /**
     * 서버 상태 헬스 체크(Health Check) API 엔드포인트
     * (Nginx, Docker 등에서 서버가 정상 작동 중인지 확인하기 위해 사용)
     * @GetMapping("/health")
     * HTTP GET /api/auth/health 요청 처리
     * 
     * @return {"status":"OK"} JSON 응답
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok("{\"status\":\"OK\"}");
    }
}