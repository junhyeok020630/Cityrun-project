// REST 컨트롤러(@RestControllerAdvice)에서 발생하는 예외를 처리

package com.cityrun.api.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;

import java.util.*;

/**
 * @RestControllerAdvice
 *                       모든 @RestController에서 발생하는 예외를 전역적으로 처리하는 클래스
 */
@RestControllerAdvice
public class RestExceptionHandler {

    /**
     * IllegalArgumentException (400 Bad Request) 처리
     * 
     * @param e 발생한 예외
     * @return 400 상태 코드와 오류 메시지
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException e) {
        // 일관된 JSON 오류 응답 반환
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", e.getMessage()));
    }

    /**
     * DataIntegrityViolationException (500 Internal Server Error) 처리
     * (참고: GlobalExceptionHandler에서 409 Conflict로 이미 처리하고 있음)
     * (이 핸들러는 GlobalExceptionHandler에 의해 가려질 수 있음)
     * 
     * @param e 발생한 예외
     * @return 500 상태 코드와 오류 메시지
     */
    @ExceptionHandler({ DataIntegrityViolationException.class })
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "DataIntegrityViolation",
                // 가장 근본적인 원인 메시지 추출
                "message", e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : e.getMessage()));
    }

    /**
     * 기타 모든 Exception (500 Internal Server Error) 처리
     * (최종 예외 방어선)
     * 
     * @param e 발생한 예외
     * @return 500 상태 코드와 오류 메시지
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAny(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", e.getClass().getSimpleName(),
                "message", e.getMessage()));
    }
}