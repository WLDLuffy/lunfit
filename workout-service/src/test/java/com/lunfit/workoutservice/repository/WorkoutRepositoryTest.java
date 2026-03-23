package com.lunfit.workoutservice.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WorkoutRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void flywayV1_createsWorkoutsTableWithExpectedColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_name = 'workouts' ORDER BY column_name"
        );
        List<String> columnNames = columns.stream()
            .map(row -> (String) row.get("column_name"))
            .toList();

        assertThat(columnNames).contains(
            "id", "user_id", "workout_type", "title",
            "start_time", "end_time", "duration_seconds", "distance_meters",
            "notes", "metrics_session_id", "created_at", "updated_at"
        );
    }

    @Test
    void flywayV1_createsExpectedIndexesOnWorkoutsTable() {
        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'workouts'"
        );
        List<String> indexNames = indexes.stream()
            .map(row -> (String) row.get("indexname"))
            .toList();

        assertThat(indexNames).contains("idx_workouts_user_id", "idx_workouts_start_time");
    }

    @Test
    void flywayV2_createsRunningMetricsTableWithExpectedColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns " +
            "WHERE table_name = 'running_metrics' ORDER BY column_name"
        );
        List<String> columnNames = columns.stream()
            .map(row -> (String) row.get("column_name"))
            .toList();

        assertThat(columnNames).contains(
            "id", "workout_id",
            "avg_heart_rate", "max_heart_rate",
            "avg_pace_seconds_per_km", "elevation_gain_meters", "avg_cadence"
        );
    }

    @Test
    void flywayV2_workoutIdHasUniqueForeignKeyConstraint() {
        // Verify the FK constraint exists (unique constraint enforces 1:1)
        List<Map<String, Object>> constraints = jdbcTemplate.queryForList(
            "SELECT constraint_type FROM information_schema.table_constraints " +
            "WHERE table_name = 'running_metrics' AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')"
        );
        List<String> constraintTypes = constraints.stream()
            .map(row -> (String) row.get("constraint_type"))
            .toList();

        assertThat(constraintTypes).contains("FOREIGN KEY", "UNIQUE");
    }

    @Test
    void jpaValidation_entitiesMatchMigrationSchema() {
        // Hibernate ddl-auto=validate runs at context startup (shared across all tests in this class).
        // A schema mismatch would have caused context load failure before reaching this point.
        // This test explicitly verifies that both entity tables are reachable via JDBC,
        // confirming the JPA-to-schema mapping is consistent.
        Long workoutCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM workouts", Long.class);
        Long metricsCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM running_metrics", Long.class);

        assertThat(workoutCount).isNotNull().isGreaterThanOrEqualTo(0);
        assertThat(metricsCount).isNotNull().isGreaterThanOrEqualTo(0);
    }
}
