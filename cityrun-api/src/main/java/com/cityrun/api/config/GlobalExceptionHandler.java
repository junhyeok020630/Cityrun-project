// 애플리케이션 전역(@ControllerAdvice)에서 발생하는 예외를 일관된 JSON 응답으로 처리

package com.cityrun.api.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import jakarta.validation.ConstraintViolationException; // ✅ validation 의존성 추가 후 인식됨

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @ControllerAdvice
 *                   모든 컨트롤러에서 발생하는 예외를 전역적으로 처리하는 클래스
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 일관된 오류 응답 본문(JSON)을 생성하는 헬퍼 메서드
     * 
     * @param status  HTTP 상태 코드
     * @param message 오류 메시지
     * @return 오류 상세 정보가 담긴 Map
     */
    private Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("timestamp", Instant.now().toString()); // 오류 발생 시간
        m.put("status", status.value()); // HTTP 상태 코드 (예: 400, 404, 500)
        m.put("error", status.getReasonPhrase()); // HTTP 상태 메시지 (예: Bad Request)
        if (message != null && !message.isBlank()) {
            m.put("message", message); // 구체적인 오류 메시지
        }
        return m;
    }

    // --- 401 / 403 / 400 분기 처리 ---
    /**
     * IllegalStateException 처리
     * 주로 AuthService에서 권한(로그인) 문제 처리에 사용
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        String msg = ex.getMessage() == null ? "" : ex.getMessage();
        HttpStatus status;
        if (msg.contains("로그인이 필요합니다")) {
            status = HttpStatus.UNAUTHORIZED; // 401 (인증 실패)
        } else if (msg.contains("권한이 없습니다")) {
            status = HttpStatus.FORBIDDEN; // 403 (인가 실패)
        } else {
            status = HttpStatus.BAD_REQUEST; // 400 (기타 잘못된 요청)
        }
        return ResponseEntity.status(status).body(body(status, msg));
    }

    // --- 400 Bad Request (잘못된 요청) ---
    /**
     * IllegalArgumentException 처리 (400)
     * 서비스 로직에서 잘못된 인수가 전달되었을 때 사용
     * (예: RouteService가 geo-engine의 4xx 에러를 변환할 때)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(body(status, ex.getMessage()));
    }

    /**
     * @Valid 어노테이션을 사용한 Request Body 검증 실패 시 처리 (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        // 오류가 발생한 필드와 메시지를 조합하여 상세 내용 생성
        String details = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + (fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage()))
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(status).body(body(status, details));
    }

    /**
     * 파라미터/경로변수 제약(@NotBlank 등) 위반 시 처리 (400)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(body(status, ex.getMessage()));
    }

    /**
     * 트랜잭션(@Transactional) 커밋 시 발생하는 제약 조건 위반 처리 (400)
     */
    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, Object>> handleTx(TransactionSystemException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        // 가장 근본적인 원인 메시지 추출
        String msg = ex.getMostSpecificCause() == null ? ex.getMessage() : ex.getMostSpecificCause().getMessage();
        return ResponseEntity.status(status).body(body(status, msg));
    }

    /**
     * 필수 @RequestParam 파라미터 누락 시 처리 (400)
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(body(status, ex.getMessage()));
    }

    /**
     * 파라미터 타입 불일치(예: Long이어야 할 PathVariable에 문자열이 들어옴) 시 처리 (400)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(body(status, "파라미터 타입이 올바르지 않습니다: " + ex.getName()));
    }

    // --- 404 Not Found (찾을 수 없음) ---
    /**
     * 정의되지 않은 API 경로(URL)로 요청 시 처리 (404)
     * (application.properties의 spring.mvc.throw-exception-if-no-handler-found=true
     * 설정 필요)
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandler(NoHandlerFoundException ex) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        return ResponseEntity.status(status).body(body(status, "경로를 찾을 수 없습니다: " + ex.getRequestURL()));
    }

    // --- 405 Method Not Allowed (허용되지 않은 메서드) ---
    /**
     * 허용되지 않은 HTTP 메서드 요청 시 처리 (405)
     * (예: GET만 허용된 엔드포인트에 POST 요청)
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        HttpStatus status = HttpStatus.METHOD_NOT_ALLOWED;
        return ResponseEntity.status(status).headers(new HttpHeaders()).body(body(status, ex.getMessage()));
    }

    // --- 409 Conflict (충돌) ---
    /**
     * 데이터베이스 무결성 제약 조건 위반(예: UNIQUE 키 중복) 시 처리 (409)
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(DataIntegrityViolationException ex) {
        HttpStatus status = HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(body(status, "데이터 무결성 위반"));
    }

    // --- 415 Unsupported Media Type (지원하지 않는 미디어 타입) ---
    /**
     * 지원하지 않는 Content-Type(예: application/json인데 text/plain으로 보냄) 요청 시 처리 (415)
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMediaType(HttpMediaTypeNotSupportedException ex) {
        HttpStatus status = HttpStatus.UNSUPPORTED_MEDIA_TYPE;
        return ResponseEntity.status(status).body(body(status, ex.getMessage()));
    }

    // --- 500 Internal Server Error (서버 내부 오류) ---
    /**
     * 위에서 처리되지 않은 모든 기타 예외를 처리 (500)
     * 서버 로직 오류의 최종 방어선
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAny(Exception ex) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(body(status, ex.getMessage()));
    }
}