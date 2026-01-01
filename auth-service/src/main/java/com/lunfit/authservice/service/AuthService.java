package com.lunfit.authservice.service;

import com.lunfit.authservice.dto.LoginRequest;
import com.lunfit.authservice.dto.LoginResponse;
import com.lunfit.authservice.dto.RegisterRequest;
import com.lunfit.authservice.dto.RegisterResponse;
import com.lunfit.authservice.dto.ResendVerificationRequest;
import com.lunfit.authservice.dto.ResendVerificationResponse;
import com.lunfit.authservice.dto.VerifyEmailResponse;

public interface AuthService {

    /**
     * Register a new user account
     *
     * @param request Registration request containing email and password
     * @return Registration response with verification email status
     */
    RegisterResponse register(RegisterRequest request);

    /**
     * Verify user's email address using verification token
     *
     * @param token Verification token from email link
     * @return Verification response with success message
     */
    VerifyEmailResponse verifyEmail(String token);

    /**
     * Resend verification email to user
     *
     * @param request Request containing user's email
     * @return Response with resend status
     */
    ResendVerificationResponse resendVerificationEmail(ResendVerificationRequest request);

    /**
     * Authenticate user and generate access and refresh tokens
     *
     * @param request Login request containing email and password
     * @return Login response with JWT tokens
     */
    LoginResponse login(LoginRequest request);
}
