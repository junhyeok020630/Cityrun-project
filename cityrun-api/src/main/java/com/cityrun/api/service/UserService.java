package com.cityrun.api.service;

import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.entity.User;
import com.cityrun.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + userId));
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. id=" + userId));

        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            u.setNickname(req.getNickname());
        }

        // 필요한 다른 필드가 있다면 여기서 추가 업데이트

        userRepo.save(u);
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }
}
