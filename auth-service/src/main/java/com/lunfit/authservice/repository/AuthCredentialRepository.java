package com.lunfit.authservice.repository;

import com.lunfit.authservice.entity.AuthCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthCredentialRepository extends JpaRepository<AuthCredential, Long> {

    Optional<AuthCredential> findByRefreshToken(String refreshToken);

    Optional<AuthCredential> findByUserId(Long userId);
}
