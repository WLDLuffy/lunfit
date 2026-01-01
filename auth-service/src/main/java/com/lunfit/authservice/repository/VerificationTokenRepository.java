package com.lunfit.authservice.repository;

import com.lunfit.authservice.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByToken(String token);

    void deleteByUserIdAndStatus(Long userId, VerificationToken.TokenStatus status);

    void deleteByUserId(Long userId);
}
