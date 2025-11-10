package com.cityrun.api.controller;

import com.cityrun.api.model.dto.SosRequest;
import com.cityrun.api.service.SosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sos")
public class SosController {

    private final SosService sosService;

    // 긴급 구조 신호 발생
    @PostMapping
    public ResponseEntity<Map<String, Object>> sendSOS(@RequestBody SosRequest req) {
        sosService.saveSOS(req);
        return ResponseEntity.ok(Map.of("status", "SENT"));
    }

    // 모든 SOS 요청 목록 (관리자용)
    @GetMapping("/list")
    public ResponseEntity<?> getAllSOS() {
        return ResponseEntity.ok(sosService.getAllSOS());
    }
}
