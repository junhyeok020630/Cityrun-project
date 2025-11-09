package com.cityrun.api.controller;

import com.cityrun.api.entity.User;
import com.cityrun.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepo;
    private final StringRedisTemplate redis;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "OK");
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String pw = req.get("password"); // 데모: 평문 비교(과제용 데모라 간단처리)
        Optional<User> user = userRepo.findByEmail(email);

        // 데모 조건: 비번 "1234"면 로그인 성공 처리
        if (user.isPresent() && "1234".equals(pw)) {
            String sid = UUID.randomUUID().toString();
            HashOperations<String, Object, Object> ops = redis.opsForHash();
            ops.put("session:" + sid, "userId", user.get().getId().toString());
            ops.put("session:" + sid, "email", email);

            return Map.of("success", true, "sessionId", sid);
        }
        return Map.of("success", false, "message", "Invalid credentials");
    }
}