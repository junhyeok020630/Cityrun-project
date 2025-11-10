package com.cityrun.api.controller;

import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(HttpServletRequest request) {
        Long userId = authService.requireUserId(request); // ← 세션에서 가져옴
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@RequestBody UpdateProfileRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }
}
