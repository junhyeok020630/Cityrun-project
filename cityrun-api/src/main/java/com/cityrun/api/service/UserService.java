package com.cityrun.api.service;

import com.cityrun.api.entity.User;
import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepo;

    public UserResponse getUser(Long userId) {
        User u = userRepo.findById(userId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }

    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User u = userRepo.findById(userId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        if (req.getNickname() != null) u.setNickname(req.getNickname());
        userRepo.save(u);
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }
}
