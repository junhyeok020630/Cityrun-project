// '로그인' API (/api/auth/login)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class LoginRequest {

    // 로그인할 사용자 이메일
    private String email;

    // 로그인할 사용자 비밀번호
    private String password;
}