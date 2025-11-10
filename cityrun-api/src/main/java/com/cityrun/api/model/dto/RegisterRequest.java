package com.cityrun.api.model.dto;
import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String nickname;
}
