// '내 정보 조회' API (/api/users/me) 등의 응답(Response) DTO
package com.cityrun.api.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * @Data
 *       Lombok 어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode 자동 생성
 *
 * @AllArgsConstructor
 *                     모든 필드를 인자로 받는 생성자 자동 생성
 */
@Data
@AllArgsConstructor
public class UserResponse {

    // 사용자 고유 ID
    private Long id;

    // 사용자 이메일
    private String email;

    // 사용자 닉네임
    private String nickname;
}