// '사용자 프로필' 관련 비즈니스 로직(조회, 수정)을 처리하는 서비스
package com.cityrun.api.service;

import com.cityrun.api.model.dto.UpdateProfileRequest;
import com.cityrun.api.model.dto.UserResponse;
import com.cityrun.api.entity.User;
import com.cityrun.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(UserRepository)의 생성자를 자동으로 주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class UserService {

    // User 엔티티에 접근하기 위한 JPA 리포지토리
    private final UserRepository userRepo;

    /**
     * 사용자 프로필 조회
     * 
     * @param userId 조회할 사용자 ID (세션에서 획득)
     * @return UserResponse DTO (id, email, nickname)
     */
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션 (성능 최적화)
    public UserResponse getProfile(Long userId) {
        // 1. 리포지토리에서 ID로 사용자 조회 (없으면 IllegalArgumentException 발생)
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다 id=" + userId));
        // 2. User 엔티티를 UserResponse DTO로 변환하여 반환
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }

    /**
     * 사용자 프로필 수정 (현재 닉네임만 수정)
     * 
     * @param userId 수정할 사용자 ID (세션에서 획득)
     * @param req    수정할 프로필 정보 (UpdateProfileRequest DTO)
     * @return 수정 완료된 UserResponse DTO
     */
    @Transactional // 트랜잭션으로 실행 (DB 업데이트)
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        // 1. 리포지토리에서 ID로 사용자 조회 (없으면 IllegalArgumentException 발생)
        User u = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다 id=" + userId));

        // 2. 닉네임이 DTO에 포함되어 있고, 비어있지 않으면 엔티티의 닉네임 변경
        if (req.getNickname() != null && !req.getNickname().isBlank()) {
            u.setNickname(req.getNickname());
        }

        // 3. DB에 변경 사항 저장 (트랜잭션 종료 시 자동 커밋)
        userRepo.save(u);
        // 4. 수정된 정보를 DTO로 변환하여 반환
        return new UserResponse(u.getId(), u.getEmail(), u.getNickname());
    }
}