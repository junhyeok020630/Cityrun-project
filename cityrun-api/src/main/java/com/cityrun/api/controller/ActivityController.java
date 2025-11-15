package com.cityrun.api.controller;

import com.cityrun.api.entity.Activity;
import com.cityrun.api.model.dto.ActivityCreateRequest;
import com.cityrun.api.service.ActivityService;
import com.cityrun.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final AuthService authService;
    private final ActivityService activityService;

    /**
     * 운동 기록 저장 (운동 중단 시 호출)
     */
    @PostMapping
    public ResponseEntity<Activity> createActivity(@RequestBody ActivityCreateRequest req,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        Activity savedActivity = activityService.saveActivity(userId, req);
        return ResponseEntity.ok(savedActivity);
    }

    /**
     * 내 모든 운동 기록 조회 (활동 탭)
     */
    @GetMapping("/mine")
    public ResponseEntity<List<Activity>> getMyActivities(HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        List<Activity> activities = activityService.getUserActivities(userId);
        return ResponseEntity.ok(activities);
    }

    // 🔻 1. 활동 삭제 API 추가 🔻
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable("id") Long activityId,
            HttpServletRequest request) {
        Long userId = authService.requireUserId(request);
        activityService.deleteActivity(userId, activityId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
    // 🔺🔺🔺
}