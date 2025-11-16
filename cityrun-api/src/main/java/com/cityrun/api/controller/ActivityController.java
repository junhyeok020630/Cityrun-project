// 사용자의 운동 기록(Activity)과 관련된 API 엔드포인트를 정의

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

/**
 * @RestController
 *                 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 *                 @RequestMapping("/api/activities")
 *                 이 컨트롤러의 모든 API는 "/api/activities" 접두사를 가짐
 *
 * @RequiredArgsConstructor
 *                          final 필드(AuthService, ActivityService)의 생성자를 자동으로 주입
 *                          (DI)
 */
@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final AuthService authService; // 인증/권한(세션) 관련 서비스
    private final ActivityService activityService; // 운동 기록 관련 비즈니스 로직 서비스

    /**
     * 운동 기록 저장 API (운동 중단 시 호출)
     * 
     * @PostMapping
     *              HTTP POST /api/activities 요청 처리
     * @param req     Request Body로 전달된 운동 기록 데이터
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return 생성된 Activity 객체와 200 OK 응답
     */
    @PostMapping
    public ResponseEntity<Activity> createActivity(@RequestBody ActivityCreateRequest req,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 운동 기록 저장 로직 위임
        Activity savedActivity = activityService.saveActivity(userId, req);
        // 3. 저장된 객체 반환
        return ResponseEntity.ok(savedActivity);
    }

    /**
     * 내 모든 운동 기록 조회 API (프론트 '활동' 탭)
     * @GetMapping("/mine")
     * HTTP GET /api/activities/mine 요청 처리
     * 
     * @param request 현재 로그인한 사용자 ID를 세션에서 조회하기 위한 HttpServletRequest
     * @return Activity 목록(List)과 200 OK 응답
     */
    @GetMapping("/mine")
    public ResponseEntity<List<Activity>> getMyActivities(HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에서 해당 사용자의 모든 활동 기록 조회
        List<Activity> activities = activityService.getUserActivities(userId);
        // 3. 조회된 목록 반환
        return ResponseEntity.ok(activities);
    }

    /**
     * 운동 기록 삭제 API
     * @DeleteMapping("/{id}")
     * HTTP DELETE /api/activities/{id} 요청 처리 (예: /api/activities/1)
     * 
     * @param activityId @PathVariable을 통해 URL 경로에서 추출한 활동 ID
     * @param request    삭제 권한을 확인하기 위해 현재 사용자 ID를 조회하는 HttpServletRequest
     * @return 204 No Content 응답 (성공적으로 삭제되었으나 본문 내용은 없음)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable("id") Long activityId,
            HttpServletRequest request) {
        // 1. 세션에서 현재 사용자 ID 획득
        Long userId = authService.requireUserId(request);
        // 2. 서비스에 활동 삭제 로직 위임 (본인 기록인지 권한 확인 포함)
        activityService.deleteActivity(userId, activityId);
        // 3. 204 응답 반환
        return ResponseEntity.noContent().build();
    }
}