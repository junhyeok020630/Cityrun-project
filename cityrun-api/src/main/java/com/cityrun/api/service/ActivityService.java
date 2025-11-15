package com.cityrun.api.service;

import com.cityrun.api.entity.Activity;
import com.cityrun.api.model.dto.ActivityCreateRequest;
import com.cityrun.api.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepo;

    /**
     * 운동 기록 저장
     */
    @Transactional
    public Activity saveActivity(Long userId, ActivityCreateRequest req) {
        Activity activity = Activity.builder()
                .userId(userId)
                .distanceM(req.getDistanceM())
                .durationS(req.getDurationS())
                .avgPaceSPerKm(req.getAvgPaceSPerKm())
                .build();

        return activityRepo.save(activity);
    }

    /**
     * 내 운동 기록 모두 조회 (활동 탭)
     */
    @Transactional(readOnly = true)
    public List<Activity> getUserActivities(Long userId) {
        return activityRepo.findByUserIdOrderByIdDesc(userId);
    }

    // 🔻 1. 활동 삭제 메서드 추가 🔻
    @Transactional
    public void deleteActivity(Long userId, Long activityId) {
        // 1. 활동 기록 찾기
        Activity activity = activityRepo.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("활동 기록을 찾을 수 없습니다. id=" + activityId));

        // 2. 사용자 ID 일치 확인
        if (!activity.getUserId().equals(userId)) {
            throw new IllegalStateException("이 활동 기록을 삭제할 권한이 없습니다.");
        }

        // 3. 삭제
        activityRepo.delete(activity);
    }
    // 🔺🔺🔺
}