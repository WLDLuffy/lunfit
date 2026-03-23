package com.lunfit.workoutservice.repository;

import com.lunfit.workoutservice.entity.RunningMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

// Rarely called directly — JPA cascade from Workout handles RunningMetrics lifecycle
@Repository
public interface RunningMetricsRepository extends JpaRepository<RunningMetrics, UUID> {
}
