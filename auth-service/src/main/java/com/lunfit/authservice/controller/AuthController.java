package com.lunfit.authservice.controller;

import com.lunfit.authservice.dto.LoginRequest;
import com.lunfit.authservice.dto.LoginResponse;
import com.lunfit.authservice.dto.RegisterRequest;
import com.lunfit.authservice.dto.RegisterResponse;
import com.lunfit.authservice.dto.ResendVerificationRequest;
import com.lunfit.authservice.dto.ResendVerificationResponse;
import com.lunfit.authservice.dto.VerifyEmailResponse;
import com.lunfit.authservice.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration request received for email: {}", request.getEmail());
        RegisterResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(
            @RequestParam @NotBlank(message = "Token is required") String token) {
        log.info("Email verification request received");
        VerifyEmailResponse response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify/resend")
    public ResponseEntity<ResendVerificationResponse> resendVerificationEmail(
            @Valid @RequestBody ResendVerificationRequest request) {
        log.info("Resend verification email request received for: {}", request.getEmail());
        ResendVerificationResponse response = authService.resendVerificationEmail(request);
        return ResponseEntity.ok(response);
    }
}
