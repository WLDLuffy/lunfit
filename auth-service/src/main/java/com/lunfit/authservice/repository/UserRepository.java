package com.lunfit.authservice.repository;

import com.lunfit.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    int deleteByStatusAndCreatedAtBefore(User.UserStatus status, LocalDateTime cutoffDate);
}
