package com.cityrun.api.controller;

import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.service.AuthService;
import com.cityrun.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(
            @CookieValue(name="SID", required=false) String cookieSid,
            @RequestHeader(value="X-Session-Id", required=false) String headerSid) {
        String sid = headerSid != null ? headerSid : cookieSid;
        Long userId = authService.requireUserId(sid);
        return ResponseEntity.ok(userService.getUser(userId));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @CookieValue(name="SID", required=false) String cookieSid,
            @RequestHeader(value="X-Session-Id", required=false) String headerSid,
            @RequestBody UpdateProfileRequest req) {
        String sid = headerSid != null ? headerSid : cookieSid;
        Long userId = authService.requireUserId(sid);
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }
}
