package com.cityrun.api.service;

import com.cityrun.api.entity.Emergency;
import com.cityrun.api.model.dto.SosRequest;
import com.cityrun.api.repository.EmergencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SosService {

    private final EmergencyRepository repo;

    // 긴급 요청 저장
    public void saveSOS(SosRequest req) {
        Emergency e = Emergency.builder()
                .userId(req.getUserId())
                .lat(req.getLat())
                .lng(req.getLng())
                .status("SENT")
                .build();
        repo.save(e);
    }

    // 전체 SOS 요청 확인 (관리자용)
    public List<Emergency> getAllSOS() {
        return repo.findAll();
    }
}
