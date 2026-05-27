package com.codesync.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {

    @NotBlank(message = "Username or Email cannot be blank")
    private String identifier; // can be username or email

    @NotBlank(message = "Password cannot be blank")
    private String password;
}
