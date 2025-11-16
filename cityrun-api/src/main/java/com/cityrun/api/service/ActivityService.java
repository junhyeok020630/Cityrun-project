// '운동 기록(Activity)' 관련 비즈니스 로직(저장, 조회, 삭제)을 처리하는 서비스
package com.cityrun.api.service;

import com.cityrun.api.entity.Activity;
import com.cityrun.api.model.dto.ActivityCreateRequest;
import com.cityrun.api.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(ActivityRepository)의 생성자를 자동으로 주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class ActivityService {

    // Activity 엔티티에 접근하기 위한 JPA 리포지토리
    private final ActivityRepository activityRepo;

    /**
     * 운동 기록 저장
     * 
     * @param userId 운동 기록을 저장할 사용자 ID (세션에서 획득)
     * @param req    저장할 운동 기록 데이터 (DTO)
     * @return 저장된 Activity 엔티티 객체
     */
    @Transactional // 이 메서드가 하나의 트랜잭션으로 실행됨을 명시 (DB 저장)
    public Activity saveActivity(Long userId, ActivityCreateRequest req) {
        // DTO를 Activity 엔티티로 변환
        Activity activity = Activity.builder()
                .userId(userId)
                .distanceM(req.getDistanceM())
                .durationS(req.getDurationS())
                .avgPaceSPerKm(req.getAvgPaceSPerKm())
                .build();

        // 리포지토리를 통해 DB에 저장
        return activityRepo.save(activity);
    }

    /**
     * 특정 사용자의 모든 운동 기록 조회 (프론트 '활동' 탭)
     * 
     * @param userId 조회할 사용자 ID
     * @return Activity 엔티티 목록 (최신순)
     */
    @Transactional(readOnly = true) // 이 메서드가 읽기 전용 트랜잭션임을 명시 (성능 최적화)
    public List<Activity> getUserActivities(Long userId) {
        // 리포지토리의 쿼리 메서드를 호출하여 조회
        return activityRepo.findByUserIdOrderByIdDesc(userId);
    }

    /**
     * 특정 운동 기록 삭제
     * 
     * @param userId     삭제를 요청한 사용자 ID (권한 확인용)
     * @param activityId 삭제할 활동 기록 ID
     */
    @Transactional // 이 메서드가 하나의 트랜잭션으로 실행됨을 명시 (DB 삭제)
    public void deleteActivity(Long userId, Long activityId) {
        // 1. 활동 기록 찾기 (없으면 IllegalArgumentException 발생)
        Activity activity = activityRepo.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("활동 기록을 찾을 수 없습니다 id=" + activityId));

        // 2. 사용자 ID 일치 확인 (본인 기록인지 권한 확인)
        if (!activity.getUserId().equals(userId)) {
            throw new IllegalStateException("이 활동 기록을 삭제할 권한이 없습니다");
        }

        // 3. 리포지토리를 통해 DB에서 삭제
        activityRepo.delete(activity);
    }
}