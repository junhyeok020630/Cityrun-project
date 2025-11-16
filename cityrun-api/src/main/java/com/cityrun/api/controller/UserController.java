// 사용자 프로필 정보(조회, 수정) API 엔드포인트를 정의
package com.cityrun.api.controller;

import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * @RestController
 *                 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 *                 @RequestMapping("/api/users")
 *                 이 컨트롤러의 모든 API는 "/api/users" 접두사를 가짐
 *
 * @RequiredArgsConstructor
 *                          final 필드(AuthService, UserService)의 생성자를 자동으로 주입
 *                          (DI)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService; // 인증/권한(세션) 관련 서비스
    private final UserService userService; // 사용자 정보 관련 비즈니스 로직 서비스

    /**
     * '내 정보' 조회 API (세션 기준)
     * (프론트엔드에서 로그인 상태 확인 및 MyPage에서 사용)
     * @GetMapping("/me")
     * HTTP GET /api/users/me 요청 처리
     * 
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return UserResponse (id, email, nickname)와 200 OK 응답
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득 (로그인 필요)
        Long userId = authService.requireUserId(request);
        // 2. 서비스에서 프로필 정보 조회
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    /**
     * '내 정보' 수정 API (닉네임 등)
     * @PutMapping("/me")
     * HTTP PUT /api/users/me 요청 처리
     * 
     * @param req     Request Body로 전달된 수정할 프로필 정보 (예: nickname)
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return 수정된 UserResponse (id, email, nickname)와 200 OK 응답
     */
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@RequestBody UpdateProfileRequest req,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득 (로그인 필요)
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 프로필 업데이트 로직 위임
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }
}