package com.lunfit.authservice.scheduler;

import com.lunfit.authservice.entity.User;
import com.lunfit.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountCleanupScheduler {

    private final UserRepository userRepository;

    @Value("${app.unverified-account-cleanup-days:30}")
    private int cleanupDays;

    /**
     * Scheduled task to clean up unverified accounts
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupUnverifiedAccounts() {
        log.info("Starting cleanup of unverified accounts older than {} days", cleanupDays);

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(cleanupDays);

        int deletedCount = userRepository.deleteByStatusAndCreatedAtBefore(
                User.UserStatus.PENDING,
                cutoffDate
        );

        log.info("Cleanup completed. Deleted {} unverified accounts", deletedCount);
    }
}
