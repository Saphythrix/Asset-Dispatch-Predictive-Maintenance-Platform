package com.enterprise.auth_service.Dto;

import com.enterprise.auth_service.Entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Billing tier is required")
    private String billingTier;

    @NotNull(message = "Role is required")
    private Role role;
}