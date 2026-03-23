# Story 1.1: Project Scaffold & Database Foundation

Status: done

## Story

As a developer,
I want the project scaffolded with Spring Boot, Maven, PostgreSQL connected, and Flyway migrations for the core `workouts` and `running_metrics` tables applied,
so that all subsequent stories have a working database-connected service to build on.

## Acceptance Criteria

1. **Given** the Spring Initializr project is initialised with dependencies: web, data-jpa, postgresql, flyway, security, validation, actuator, plus springdoc-openapi-starter-webmvc-ui, testcontainers postgresql module, and jjwt-api/impl/jackson — **When** the application starts — **Then** it connects to PostgreSQL and Flyway applies V1 and V2 migrations successfully with no errors

2. **Given** the Flyway V1 migration — **When** applied — **Then** a `workouts` table exists with columns: `id` (UUID PK), `user_id` (UUID NOT NULL), `workout_type` (VARCHAR NOT NULL), `title` (VARCHAR), `start_time` (TIMESTAMP WITH TIME ZONE NOT NULL), `end_time` (TIMESTAMP WITH TIME ZONE NOT NULL), `duration_seconds` (INTEGER NOT NULL), `distance_meters` (INTEGER NOT NULL), `notes` (TEXT), `metrics_session_id` (UUID), `created_at` (TIMESTAMP WITH TIME ZONE), `updated_at` (TIMESTAMP WITH TIME ZONE) — **And** index `idx_workouts_user_id` exists on `(user_id)` — **And** index `idx_workouts_start_time` exists on `(start_time)`

3. **Given** the Flyway V2 migration — **When** applied — **Then** a `running_metrics` table exists with columns: `id` (UUID PK), `workout_id` (UUID NOT NULL UNIQUE FK → workouts.id ON DELETE CASCADE), `avg_heart_rate` (INTEGER), `max_heart_rate` (INTEGER), `avg_pace_seconds_per_km` (INTEGER), `elevation_gain_meters` (INTEGER), `avg_cadence` (INTEGER)

4. **Given** the `Workout` and `RunningMetrics` JPA entities — **When** compiled — **Then** `Workout` has a `@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)` field to `RunningMetrics` — **And** the package structure follows `com.lunfit.workoutservice.{controller|service|repository|entity|dto|mapper|security|event|exception|config}`

5. **Given** the project is built with `./mvnw test` — **When** Testcontainers spins up a real PostgreSQL container — **Then** Flyway migrations are applied and validated with no errors — **And** all tests pass

## Tasks / Subtasks

- [x] Task 1: Initialise project from Spring Initializr (AC: 1)
  - [x] Generate project via `curl https://start.spring.io/starter.zip` with: type=maven-project, language=java, bootVersion=3.2.3, javaVersion=17, groupId=com.lunfit, artifactId=workout-service, packageName=com.lunfit.workoutservice, dependencies=web,data-jpa,postgresql,flyway,security,validation,actuator
  - [x] Add additional dependencies to pom.xml: springdoc-openapi-starter-webmvc-ui 2.3.0, spring-boot-testcontainers, testcontainers postgresql module, jjwt-api/jjwt-impl/jjwt-jackson 0.12.5, lombok
  - [x] Create all package directories: controller, service, repository, entity, dto/request, dto/response, mapper, security, event, exception, config

- [x] Task 2: Configure application.yml and application-test.yml (AC: 1)
  - [x] Configure datasource with env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  - [x] Configure Flyway to auto-apply on startup
  - [x] Configure `JWT_SECRET` env var reference
  - [x] Configure server port 8081 (to avoid conflict with auth-service on 8080)
  - [x] SecurityConfig temporary permit-all handles test startup without Spring Security blocking

- [x] Task 3: Write Flyway migration V1 — workouts table (AC: 2)
  - [x] Create `src/main/resources/db/migration/V1__create_workouts_table.sql`
  - [x] All columns per AC2 spec, using `gen_random_uuid()` for PK default
  - [x] Add `idx_workouts_user_id` index on `(user_id)`
  - [x] Add `idx_workouts_start_time` index on `(start_time)`

- [x] Task 4: Write Flyway migration V2 — running_metrics table (AC: 3)
  - [x] Create `src/main/resources/db/migration/V2__create_running_metrics_table.sql`
  - [x] All columns per AC3 spec
  - [x] FK `workout_id` references `workouts(id) ON DELETE CASCADE`
  - [x] UNIQUE constraint on `workout_id` (enforces 1:1)

- [x] Task 5: Create WorkoutType enum (AC: 4)
  - [x] `entity/WorkoutType.java` — enum with value `RUN` (comment: CYCLING, SWIM deferred to Phase 2)

- [x] Task 6: Create Workout JPA entity (AC: 4)
  - [x] `entity/Workout.java` — all fields matching V1 migration columns; extends BaseEntity for createdAt/updatedAt
  - [x] `@OneToOne(mappedBy="workout", cascade = CascadeType.ALL, orphanRemoval = true)` on `runningMetrics` field
  - [x] `@Enumerated(EnumType.STRING)` on `workoutType`
  - [x] Use `Instant` for `startTime`, `endTime`; `BaseEntity` handles `createdAt`, `updatedAt`
  - [x] Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor` on entity

- [x] Task 7: Create RunningMetrics JPA entity (AC: 4)
  - [x] `entity/RunningMetrics.java` — all fields matching V2 migration columns
  - [x] `@OneToOne` owns FK via `@JoinColumn(name="workout_id")` on RunningMetrics; Workout uses `mappedBy="workout"`
  - [x] All metric fields are `Integer` (nullable, not primitive int) to allow partial metrics
  - [x] Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor` on entity

- [x] Task 8: Create repository stubs (AC: 4)
  - [x] `repository/WorkoutRepository.java` — extends `JpaRepository<Workout, UUID>`; stub only, no custom methods yet (added in Stories 2.x–3.x)
  - [x] `repository/RunningMetricsRepository.java` — extends `JpaRepository<RunningMetrics, UUID>`; stub only

- [x] Task 9: Create Testcontainers migration test (AC: 5)
  - [x] `test/.../repository/WorkoutRepositoryTest.java`
  - [x] Use `@SpringBootTest` + `@Testcontainers` + `@ServiceConnection` on `PostgreSQLContainer`
  - [x] Inject `JdbcTemplate` and assert both tables and all indexes exist after migrations run
  - [x] 5 tests pass with `./mvnw test` — BUILD SUCCESS

## Dev Notes

### Stack Versions (use exactly these)

- **Spring Boot:** 3.2.3
- **Java:** 17
- **jjwt:** 0.12.5 (api + impl + jackson) — same version as auth-service
- **springdoc-openapi-starter-webmvc-ui:** 2.3.0
- **Testcontainers:** managed by Spring Boot BOM via `spring-boot-testcontainers` dependency — do NOT add explicit TC version to avoid BOM conflicts
- **PostgreSQL driver:** managed by Spring Boot BOM

### pom.xml — Required Dependencies

```xml
<!-- Spring Initializr generated (managed by Spring Boot BOM) -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-validation</dependency>
<dependency>spring-boot-starter-actuator</dependency>
<dependency>postgresql (runtime scope)</dependency>
<dependency>flyway-core</dependency>

<!-- Additional Phase 1 deps -->
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.3.0</version>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-testcontainers</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>postgresql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.5</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.5</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.5</version>
  <scope>runtime</scope>
</dependency>
```

### application.yml Template

```yaml
server:
  port: 8081

spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/workoutdb}
    username: ${DB_USERNAME:workout}
    password: ${DB_PASSWORD:workout}
  jpa:
    hibernate:
      ddl-auto: validate   # Flyway owns schema — never let Hibernate create/update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration

jwt:
  secret: ${JWT_SECRET}

management:
  endpoints:
    web:
      exposure:
        include: health
```

**CRITICAL:** `spring.jpa.hibernate.ddl-auto=validate` prevents Hibernate from modifying schema. Flyway is the sole schema owner.

### Flyway Migration SQL Patterns

**V1 — Primary key and timestamps:**

```sql
CREATE TABLE workouts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL,
    workout_type      VARCHAR(50) NOT NULL,
    title             VARCHAR(255),
    start_time        TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time          TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds  INTEGER NOT NULL,
    distance_meters   INTEGER NOT NULL,
    notes             TEXT,
    metrics_session_id UUID,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_start_time ON workouts(start_time);
```

**V2 — FK with cascade and unique constraint:**

```sql
CREATE TABLE running_metrics (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id                UUID NOT NULL UNIQUE REFERENCES workouts(id) ON DELETE CASCADE,
    avg_heart_rate            INTEGER,
    max_heart_rate            INTEGER,
    avg_pace_seconds_per_km   INTEGER,
    elevation_gain_meters     INTEGER,
    avg_cadence               INTEGER
);
```

### JPA Entity Patterns

**Workout.java key annotations:**

```java
@Entity
@Table(name = "workouts")
public class Workout {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "workout_type", nullable = false)
    private WorkoutType workoutType;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    // ... other fields

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "workout_id", referencedColumnName = "id")
    private RunningMetrics runningMetrics;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
```

**CRITICAL:** `@JoinColumn` on the `Workout` side means `running_metrics.workout_id` is the FK column. The `RunningMetrics` entity side uses `mappedBy = "runningMetrics"` — do NOT add a `@JoinColumn` there.

**RunningMetrics.java — all Integer (nullable), never int:**

```java
@Entity
@Table(name = "running_metrics")
public class RunningMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(mappedBy = "runningMetrics")
    private Workout workout;

    private Integer avgHeartRate;      // nullable
    private Integer maxHeartRate;      // nullable
    private Integer avgPaceSecondsPerKm; // nullable
    private Integer elevationGainMeters; // nullable
    private Integer avgCadence;        // nullable
}
```

### Testcontainers Test Pattern

Use `@ServiceConnection` — this auto-configures the datasource to point at the TC container without any property overrides:

```java
@SpringBootTest
@Testcontainers
class WorkoutRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void flywayMigrationsCreateExpectedSchema() {
        // Assert workouts table
        var workoutCols = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'workouts'");
        assertThat(workoutCols).extracting("column_name")
            .contains("id", "user_id", "workout_type", "start_time", "end_time",
                      "duration_seconds", "distance_meters", "metrics_session_id");

        // Assert running_metrics table
        var metricsCols = jdbcTemplate.queryForList(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'running_metrics'");
        assertThat(metricsCols).extracting("column_name")
            .contains("id", "workout_id", "avg_heart_rate", "avg_pace_seconds_per_km");

        // Assert indexes
        var indexes = jdbcTemplate.queryForList(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'workouts'");
        assertThat(indexes).extracting("indexname")
            .contains("idx_workouts_user_id", "idx_workouts_start_time");
    }
}
```

**CRITICAL for @ServiceConnection:** requires `spring-boot-testcontainers` on the classpath. The `@ServiceConnection` annotation auto-registers TC container as the datasource — no `@DynamicPropertySource` needed.

### Spring Security Note (Story 1.1 Only)

Spring Security auto-configuration will protect all endpoints out of the box. Since the JWT filter chain is built in Story 1.2, this story needs a **temporary** `SecurityConfig` that permits all requests so the app starts and tests pass without 401 errors. Story 1.2 will replace this entirely.

```java
// TEMPORARY — Story 1.2 replaces this completely
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable());
        return http.build();
    }
}
```

Place in `security/SecurityConfig.java` with a comment that Story 1.2 replaces it.

### Project Structure Notes

- Root directory is already `/Users/wongweilun/Desktop/Workspace/Coding/repos/lunfit/workout-service/` — do NOT create a nested `workout-service/` subdirectory
- Package root: `src/main/java/com/lunfit/workoutservice/`
- Migration files: `src/main/resources/db/migration/`
- Auth-service uses port 8080 — configure this service on **8081** to avoid local port conflict
- `mvnw` / `mvnw.cmd` Maven wrapper must be committed (generated by Spring Initializr)
- DO NOT add `spring-boot-starter-test` explicitly — it is included by Spring Initializr by default

### What NOT to Implement in This Story

- No JWT filter logic (Story 1.2)
- No GlobalExceptionHandler (Story 1.3)
- No Swagger config (Story 1.3)
- No WorkoutEventPublisher (Story 1.4)
- No Dockerfile or docker-compose.yml (Story 1.4)
- No business logic — WorkoutRepository stubs only (no custom queries)
- No DTOs or mappers (Stories 2.x)

### References

- Architecture: Package structure — [Source: `_bmad-output/planning-artifacts/architecture.md#Layer Package Organisation`]
- Architecture: JPA entity patterns — [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Architecture: Starter dependencies — [Source: `_bmad-output/planning-artifacts/architecture.md#Selected Starter: Spring Initializr`]
- Architecture: Naming conventions — [Source: `_bmad-output/planning-artifacts/architecture.md#Naming Patterns`]
- Architecture: Enforcement guidelines — [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Removed `flyway-database-postgresql` — only exists in Flyway 10.x; Spring Boot 3.2.x ships Flyway 9.22.3 where `flyway-core` handles PostgreSQL natively.
- JPA mapping: `RunningMetrics` owns the FK (`@JoinColumn`); `Workout` uses `mappedBy="workout"` with `cascade=ALL, orphanRemoval=true`. This matches the SQL schema (`running_metrics.workout_id`) and the extension table pattern.
- Entities use `@Data @Builder @NoArgsConstructor @AllArgsConstructor` + `@EqualsAndHashCode(callSuper=false)` on `Workout` to suppress Lombok warning about superclass.
- `BaseEntity` added with `@MappedSuperclass` — holds `createdAt`/`updatedAt` for all entities that need audit timestamps.

### Completion Notes List

- All 9 tasks complete. 5 Testcontainers tests pass (BUILD SUCCESS).
- Flyway V1 and V2 migrations applied successfully against PostgreSQL 16 via Testcontainers.
- Hibernate `ddl-auto=validate` confirms JPA entity-to-table mapping is correct.
- Lombok added to pom.xml — entities use `@Data @Builder @NoArgsConstructor @AllArgsConstructor`.
- `BaseEntity` (`@MappedSuperclass`) introduced for `createdAt`/`updatedAt` reuse; `Workout` extends it.
- Temporary `SecurityConfig` (permit-all) in place — Story 1.2 replaces it with JWT filter chain.

### File List

- `pom.xml`
- `mvnw`
- `mvnw.cmd`
- `.mvn/wrapper/maven-wrapper.properties`
- `src/main/java/com/lunfit/workoutservice/WorkoutServiceApplication.java`
- `src/main/java/com/lunfit/workoutservice/entity/BaseEntity.java`
- `src/main/java/com/lunfit/workoutservice/entity/Workout.java`
- `src/main/java/com/lunfit/workoutservice/entity/RunningMetrics.java`
- `src/main/java/com/lunfit/workoutservice/entity/WorkoutType.java`
- `src/main/java/com/lunfit/workoutservice/repository/WorkoutRepository.java`
- `src/main/java/com/lunfit/workoutservice/repository/RunningMetricsRepository.java`
- `src/main/java/com/lunfit/workoutservice/security/SecurityConfig.java` (temporary — replaced in Story 1.2)
- `src/main/resources/application.yml`
- `src/main/resources/db/migration/V1__create_workouts_table.sql`
- `src/main/resources/db/migration/V2__create_running_metrics_table.sql`
- `src/test/java/com/lunfit/workoutservice/repository/WorkoutRepositoryTest.java`
