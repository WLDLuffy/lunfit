package com.lunfit.workoutservice.repository;

import com.lunfit.workoutservice.entity.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

// Custom queries (pagination, overlap detection, filtering) added in Stories 2.x and 3.x
@Repository
public interface WorkoutRepository extends JpaRepository<Workout, UUID> {
}
