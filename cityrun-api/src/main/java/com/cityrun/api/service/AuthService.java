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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Transactional
    public void register(RegisterRequest req) {
        Assert.hasText(req.getEmail(), "email required");
        Assert.hasText(req.getPassword(), "password required");

        userRepo.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalStateException("이미 가입된 이메일입니다.");
        });

        User u = User.builder()
                .email(req.getEmail())
                .passwordHash(encoder.encode(req.getPassword()))
                .nickname(req.getNickname())
                .build();

        userRepo.save(u);
    }

    @Transactional(readOnly = true)
    public void login(LoginRequest req, HttpServletRequest request) {
        User u = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        if (!encoder.matches(req.getPassword(), u.getPasswordHash())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }

        // Spring Session(HTTP 세션)만 사용
        HttpSession session = request.getSession(true); // 없으면 생성
        session.setAttribute("userId", u.getId());
        session.setAttribute("email", u.getEmail());
        session.setAttribute("nickname", u.getNickname());
        // 커스텀 레디스 키/쿠키는 더 이상 사용하지 않음
    }

    @Transactional(readOnly = true)
    public Long requireUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null)
            throw new IllegalStateException("로그인이 필요합니다.");
        Object v = session.getAttribute("userId");
        if (v == null)
            throw new IllegalStateException("로그인이 필요합니다.");
        return (v instanceof Long) ? (Long) v : Long.valueOf(String.valueOf(v));
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null)
            session.invalidate();
    }
}
