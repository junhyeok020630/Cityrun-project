// 'SOS 긴급 요청' 관련 비B즈니스 로직(저장, 전체 조회)을 처리하는 서비스
package com.cityrun.api.service;

import com.cityrun.api.entity.Emergency;
import com.cityrun.api.model.dto.SosRequest;
import com.cityrun.api.repository.EmergencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @Service
 *          이 클래스가 Spring의 서비스 계층(Service Layer)의 컴포넌트임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(EmergencyRepository)의 생성자를 자동으로 주입 (DI)
 */
@Service
@RequiredArgsConstructor
public class SosService {

    // Emergency 엔티티에 접근하기 위한 JPA 리포지토리
    private final EmergencyRepository repo;

    /**
     * 긴급(SOS) 요청 저장
     * 
     * @param req SOS 요청 정보 (userId, lat, lng)
     */
    public void saveSOS(SosRequest req) {
        // DTO를 Emergency 엔티티로 변환
        Emergency e = Emergency.builder()
                .userId(req.getUserId())
                .lat(req.getLat())
                .lng(req.getLng())
                .status("SENT") // 초기 상태는 'SENT'(전송됨)로 설정
                .build();
        // 리포지토리를 통해 DB에 저장
        repo.save(e);
    }

    /**
     * 전체 SOS 요청 목록 조회 (관리자용)
     * 
     * @return Emergency 엔티티 목록
     */
    public List<Emergency> getAllSOS() {
        // 리포지토리의 findAll()을 호출하여 모든 SOS 기록 조회
        return repo.findAll();
    }
}