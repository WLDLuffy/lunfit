package com.lunfit.authservice.service;

import com.lunfit.authservice.entity.User;
import com.lunfit.authservice.entity.VerificationToken;
import com.lunfit.authservice.exception.TokenExpiredException;
import com.lunfit.authservice.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final VerificationTokenRepository verificationTokenRepository;
    private static final SecureRandom secureRandom = new SecureRandom();

    public String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Transactional
    public VerificationToken createVerificationToken(User user) {
        String token = generateSecureToken();

        VerificationToken verificationToken = VerificationToken.builder()
                .user(user)
                .token(token)
                .tokenType(VerificationToken.TokenType.EMAIL_VERIFICATION)
                .status(VerificationToken.TokenStatus.VALID)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        log.info("Created verification token for user: {}", user.getEmail());
        return verificationTokenRepository.save(verificationToken);
    }

    public VerificationToken validateVerificationToken(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid verification token"));

        if (verificationToken.getStatus() == VerificationToken.TokenStatus.USED) {
            throw new IllegalArgumentException("This verification link has already been used");
        }

        if (verificationToken.isExpired()) {
            throw new TokenExpiredException("Verification link has expired. Please request a new one.");
        }

        return verificationToken;
    }

    @Transactional
    public void invalidateToken(VerificationToken token) {
        token.setStatus(VerificationToken.TokenStatus.USED);
        token.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(token);
        log.info("Invalidated token for user: {}", token.getUser().getEmail());
    }

    @Transactional
    public void deleteUserTokens(Long userId, VerificationToken.TokenStatus status) {
        verificationTokenRepository.deleteByUserIdAndStatus(userId, status);
    }
}
