package com.cityrun.api.model.dto;
import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
