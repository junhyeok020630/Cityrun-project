// '회원가입' API (/api/auth/register)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class RegisterRequest {

    // 가입할 사용자 이메일
    private String email;

    // 가입할 사용자 비밀번호
    private String password;

    // 가입할 사용자 닉네임
    private String nickname;
}