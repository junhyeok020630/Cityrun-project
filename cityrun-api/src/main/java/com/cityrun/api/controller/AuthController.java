package com.cityrun.api.controller;

import com.cityrun.api.model.dto.LoginRequest;
import com.cityrun.api.model.dto.RegisterRequest;
import com.cityrun.api.entity.User;
import com.cityrun.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok("회원가입 성공");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        String sessionId = authService.login(req);
        return ResponseEntity.ok().header("Set-Cookie", "SESSION=" + sessionId + "; Path=/; HttpOnly").body("로그인 성공");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@CookieValue("SESSION") String sessionId) {
        authService.logout(sessionId);
        return ResponseEntity.ok("로그아웃 성공");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@CookieValue(value = "SESSION", required = false) String sessionId) {
        Optional<User> user = authService.validate(sessionId);
        return user.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).body("로그인 필요"));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok().body("{\"status\":\"OK\"}");
    }
}
