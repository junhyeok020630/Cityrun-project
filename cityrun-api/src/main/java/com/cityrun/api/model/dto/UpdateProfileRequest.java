// '내 정보 수정' API (/api/users/me)의 Request Body DTO
package com.cityrun.api.model.dto;

import lombok.Data;

/**
 * @Data
 *       Lombok
 *       어노테이션: @Getter, @Setter, @ToString, @EqualsAndHashCode, @RequiredArgsConstructor
 *       자동 생성
 */
@Data
public class UpdateProfileRequest {

    // 수정할 새로운 닉네임
    private String nickname;
}