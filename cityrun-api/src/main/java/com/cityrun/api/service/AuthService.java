package com.cityrun.api.service;

import com.cityrun.api.entity.User;
import com.cityrun.api.repository.UserRepository;
import com.cityrun.api.model.dto.LoginRequest;
import com.cityrun.api.model.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public void register(RegisterRequest req) {
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        });

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(encoder.encode(req.getPassword()))
                .nickname(req.getNickname())
                .build();

        userRepository.save(user);
    }

    public String login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!encoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }

        // 세션ID 생성 및 Redis에 저장
        String sessionId = UUID.randomUUID().toString();
        HashOperations<String, Object, Object> ops = redisTemplate.opsForHash();
        ops.put("session:" + sessionId, "userId", String.valueOf(user.getId()));
        ops.put("session:" + sessionId, "email", user.getEmail());

        return sessionId;
    }

    public void logout(String sessionId) {
        redisTemplate.delete("session:" + sessionId);
    }

    public Optional<User> validate(String sessionId) {
        HashOperations<String, Object, Object> ops = redisTemplate.opsForHash();
        Object email = ops.get("session:" + sessionId, "email");
        return (email != null) ? userRepository.findByEmail(email.toString()) : Optional.empty();
    }

    public Long requireUserId(String sessionId) {
        if (sessionId == null || sessionId.isBlank())
            throw new IllegalStateException("세션이 없습니다.");

        var ops = redisTemplate.opsForHash();
        Object v = ops.get("session:" + sessionId, "userId");
        if (v == null)
            throw new IllegalStateException("로그인이 필요합니다.");
        return Long.parseLong(v.toString());
    }

}
