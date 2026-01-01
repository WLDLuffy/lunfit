package com.lunfit.authservice.service.impl;

import com.lunfit.authservice.dto.LoginRequest;
import com.lunfit.authservice.dto.LoginResponse;
import com.lunfit.authservice.dto.RegisterRequest;
import com.lunfit.authservice.dto.RegisterResponse;
import com.lunfit.authservice.dto.ResendVerificationRequest;
import com.lunfit.authservice.dto.ResendVerificationResponse;
import com.lunfit.authservice.dto.VerifyEmailResponse;
import com.lunfit.authservice.entity.AuthCredential;
import com.lunfit.authservice.entity.User;
import com.lunfit.authservice.entity.VerificationToken;
import com.lunfit.authservice.exception.AccountAlreadyVerifiedException;
import com.lunfit.authservice.exception.EmailAlreadyExistsException;
import com.lunfit.authservice.exception.InvalidCredentialsException;
import com.lunfit.authservice.exception.RateLimitExceededException;
import com.lunfit.authservice.exception.UserNotFoundException;
import com.lunfit.authservice.exception.VerificationRequiredException;
import com.lunfit.authservice.repository.AuthCredentialRepository;
import com.lunfit.authservice.repository.UserRepository;
import com.lunfit.authservice.repository.VerificationTokenRepository;
import com.lunfit.authservice.service.AuthService;
import com.lunfit.authservice.service.EmailService;
import com.lunfit.authservice.service.JwtService;
import com.lunfit.authservice.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuthCredentialRepository authCredentialRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Value("${app.max-resend-attempts:5}")
    private int maxResendAttempts;

    @Value("${app.resend-window-hours:24}")
    private int resendWindowHours;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        // Create user
        User user = User.builder()
                .email(email)
                .status(User.UserStatus.PENDING)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        // Hash password and create auth credential
        String passwordHash = passwordEncoder.encode(request.getPassword());
        AuthCredential authCredential = AuthCredential.builder()
                .user(user)
                .passwordHash(passwordHash)
                .build();
        authCredentialRepository.save(authCredential);

        // Create verification token
        VerificationToken verificationToken = tokenService.createVerificationToken(user);

        // Send verification email asynchronously
        emailService.sendVerificationEmail(user, verificationToken.getToken());

        log.info("User registered successfully: {}", email);

        return RegisterResponse.builder()
                .message("Registration successful. Please check your email to verify your account.")
                .email(email)
                .verificationEmailSent(true)
                .build();
    }

    @Override
    @Transactional
    public VerifyEmailResponse verifyEmail(String token) {
        // Validate token (throws exception if invalid, expired, or used)
        VerificationToken verificationToken = tokenService.validateVerificationToken(token);

        User user = verificationToken.getUser();

        // Update user status
        user.setStatus(User.UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        // Mark token as used
        tokenService.invalidateToken(verificationToken);

        log.info("Email verified successfully for user: {}", user.getEmail());

        return VerifyEmailResponse.builder()
                .message("Email verified successfully! You can now log in to your account.")
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public ResendVerificationResponse resendVerificationEmail(ResendVerificationRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // Check if already verified
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new AccountAlreadyVerifiedException("This account has already been verified");
        }

        // Check rate limiting
        checkResendRateLimit(user);

        // Delete old valid tokens for this user
        tokenService.deleteUserTokens(user.getId(), VerificationToken.TokenStatus.VALID);

        // Create new verification token
        VerificationToken newToken = tokenService.createVerificationToken(user);

        // Update resend tracking
        user.setResendCount(user.getResendCount() + 1);
        user.setLastResendAt(LocalDateTime.now());
        userRepository.save(user);

        // Send verification email asynchronously
        emailService.sendVerificationEmail(user, newToken.getToken());

        log.info("Verification email resent to: {}", email);

        return ResendVerificationResponse.builder()
                .message("Verification email resent. Please check your inbox.")
                .email(email)
                .build();
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // Check if email is verified
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new VerificationRequiredException("Please verify your email before logging in");
        }

        // Get auth credentials
        AuthCredential authCredential = authCredentialRepository.findByUserId(user.getId())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), authCredential.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // Update refresh token and device info
        authCredential.setRefreshToken(refreshToken);
        authCredential.setRefreshTokenExpiry(
                LocalDateTime.now().plusSeconds(jwtService.getAccessTokenExpiry() / 1000)
        );
        if (request.getDeviceInfo() != null) {
            authCredential.setDeviceInfo(request.getDeviceInfo());
        }
        authCredentialRepository.save(authCredential);

        // Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in successfully: {}", email);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiry() / 1000)
                .build();
    }

    private void checkResendRateLimit(User user) {
        LocalDateTime windowStart = LocalDateTime.now().minusHours(resendWindowHours);

        // If last resend was outside the window, reset counter
        if (user.getLastResendAt() == null || user.getLastResendAt().isBefore(windowStart)) {
            user.setResendCount(0);
            return;
        }

        // Check if limit exceeded
        if (user.getResendCount() >= maxResendAttempts) {
            throw new RateLimitExceededException(
                    String.format("Maximum resend attempts (%d) exceeded. Please try again after %d hours.",
                            maxResendAttempts, resendWindowHours)
            );
        }
    }
}
