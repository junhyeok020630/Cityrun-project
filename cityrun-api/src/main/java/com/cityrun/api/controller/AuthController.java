package com.cityrun.api.controller;

import com.cityrun.api.model.dto.LoginRequest;
import com.cityrun.api.model.dto.RegisterRequest;
import com.cityrun.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok("회원가입 성공");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        authService.login(req, request); // ← HttpServletRequest 넘김
        return ResponseEntity.ok("로그인 성공");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        authService.logout(request); // ← HttpServletRequest 넘김
        return ResponseEntity.ok("로그아웃 성공");
    }

    // 편의상 GET도 허용(원칙은 POST)
    @GetMapping("/logout")
    public ResponseEntity<?> logoutGet(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok("로그아웃 성공");
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok("{\"status\":\"OK\"}");
    }
}
