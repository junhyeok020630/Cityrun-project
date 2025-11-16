// 사용자의 SOS 긴급 요청(저장, 조회) API 엔드포인트를 정의
package com.cityrun.api.controller;

import com.cityrun.api.model.dto.SosRequest;
import com.cityrun.api.service.SosService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * @RestController
 *                 이 클래스가 RESTful API 컨트롤러임을 명시
 *
 * @RequiredArgsConstructor
 *                          final 필드(SosService)의 생성자를 자동으로 주입 (DI)
 *
 *                          @RequestMapping("/api/sos")
 *                          이 컨트롤러의 모든 API는 "/api/sos" 접두사를 가짐
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sos")
public class SosController {

    // SOS 관련 비즈니스 로직을 처리하는 서비스
    private final SosService sosService;

    /**
     * 긴급 구조(SOS) 신호 발생(저장) API
     * 
     * @PostMapping
     *              HTTP POST /api/sos 요청 처리
     * @param req Request Body로 전달된 SOS 요청 정보 (userId, lat, lng)
     * @return {"status":"SENT"} JSON 응답
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> sendSOS(@RequestBody SosRequest req) {
        sosService.saveSOS(req); // 서비스에 SOS 저장 로직 위임
        return ResponseEntity.ok(Map.of("status", "SENT"));
    }

    /**
     * 모든 SOS 요청 목록 조회 API (관리자용)
     * @GetMapping("/list")
     * HTTP GET /api/sos/list 요청 처리
     * 
     * @return Emergency(SOS) 목록과 200 OK 응답
     */
    @GetMapping("/list")
    public ResponseEntity<?> getAllSOS() {
        // 서비스에서 모든 SOS 목록 조회 후 반환
        return ResponseEntity.ok(sosService.getAllSOS());
    }
}