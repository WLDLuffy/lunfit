---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-23'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/research/technical-workout-service-backend-research-2026-03-23.md']
workflowType: 'architecture'
project_name: 'workout-service'
user_name: 'Wongweilun'
date: '2026-03-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

29 FRs across 7 capability areas: Workout Logging (FR1–5), Retrieval & History (FR6–10), Modification (FR11–14), Training Analytics (FR15), Identity & Access Control (FR16–19), Data Lifecycle & Compliance (FR20–24), API Discoverability & Error Handling (FR25–26), and System Event Integration (FR27–29, Growth Phase). All 29 FRs must trace back to an authenticated userId — there is no anonymous access and no shared data model.

**Non-Functional Requirements:**

- Performance: <200ms p95 POST, <100ms p95 GET list, <50ms p95 summary; <100ms event publish latency (Phase 2)
- Security: TLS in transit, encryption at rest, JWT on every request, dual-layer ownership enforcement, no PII in logs, GDPR right-to-delete
- Scalability: 100+ concurrent users, stateless horizontal scaling, extension table schema for new workout types
- Reliability: 99.9% uptime, Flyway validated on every CI run, RabbitMQ publisher confirms (Phase 2), 100% CI pass rate
- Data Integrity: zero cross-user access, atomic cascade delete, ≥80% service layer test coverage
- Integration: ErrorResponse contract consistent with auth-service, OpenAPI generated from annotations

**Scale & Complexity:**

- Primary domain: REST API Backend Microservice
- Complexity level: Medium
- Estimated architectural components: 8–10 (controller, service, repository, security filter, GlobalExceptionHandler, Flyway migrations, DTO/entity mapping, event publisher interface)
- Phase 1 has zero external runtime dependencies beyond PostgreSQL — clean and testable in isolation

### Technical Constraints & Dependencies

- **Language/Runtime:** Java 17, Spring Boot 3.2.x, Maven — mandated by auth-service consistency requirement
- **Database:** PostgreSQL 16.x with Flyway schema migrations
- **Auth:** Stateless JWT validation using shared `JWT_SECRET` env var — no auth-service call at request time
- **Data model:** Extension table pattern — `workouts` (core) + `running_metrics` (type-specific); future `cycling_metrics`, `swimming_metrics`; no nullable type-specific columns on the core table
- **Error contract:** Must match auth-service `ErrorResponse` exactly (`timestamp`, `status`, `error`, `message`, `path`, `errors[]`)
- **Testing:** Testcontainers with `@ServiceConnection` for integration tests against real PostgreSQL
- **Phase 2 additions:** RabbitMQ (event publishing), Redis (summary caching) — isolated behind interfaces, not required for Phase 1

### Cross-Cutting Concerns Identified

| Concern | Affects | Architectural Home |
|---|---|---|
| JWT authentication | All endpoints | Spring Security filter chain |
| User ownership enforcement | All resource operations | Service layer ownership check |
| Error response formatting | All error scenarios | `GlobalExceptionHandler` (`@RestControllerAdvice`) |
| Audit logging | All mutations (CREATE/UPDATE/DELETE) | Service layer or AOP aspect |
| userId query scoping | All data access | Repository layer (all queries include userId predicate) |
| Cascade delete atomicity | DELETE operations | `@Transactional` + JPA `CascadeType.ALL` |
| Schema extensibility | Data model | Extension table entity design |
| Event publishing | Workout save/delete (Phase 2) | Event publisher interface (no-op impl in Phase 1) |

## Starter Template Evaluation

### Primary Technology Domain

REST API Backend Microservice — Java/Spring Boot, consistent with the existing auth-service.

### Selected Starter: Spring Initializr (start.spring.io)

**Rationale:** Tech stack is pre-determined by auth-service consistency requirement. Spring Initializr is the canonical scaffold for Spring Boot projects.

**Initialization Command:**

```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.x \
  -d javaVersion=17 \
  -d groupId=com.lunfit \
  -d artifactId=workout-service \
  -d name=workout-service \
  -d packageName=com.lunfit.workoutservice \
  -d dependencies=web,data-jpa,postgresql,flyway,security,validation,actuator \
  -o workout-service.zip
```

**Architectural Decisions Provided by Starter:**

| Area | Decision |
|---|---|
| Language & Runtime | Java 17 LTS, Spring Boot 3.2.x |
| Build tooling | Maven 3.9+, `mvnw` wrapper |
| Web layer | Spring Web MVC (embedded Tomcat) |
| Persistence | Spring Data JPA + Hibernate ORM |
| Database migration | Flyway (auto-applied on startup) |
| Validation | Jakarta Bean Validation (Hibernate Validator) |
| Security | Spring Security (filter chain, customised for JWT) |
| Health/metrics | Spring Actuator (`/actuator/health`) |
| Package structure | `com.lunfit.workoutservice` |

**Additional dependencies (post-init):**

| Dependency | Purpose | Phase |
|---|---|---|
| `springdoc-openapi-starter-webmvc-ui` | Swagger UI at `/swagger-ui.html` | Phase 1 |
| `testcontainers` + `postgresql` TC module | Real PostgreSQL in CI integration tests | Phase 1 |
| `jjwt-api` / `jjwt-impl` / `jjwt-jackson` | JWT parsing (same as auth-service) | Phase 1 |
| `spring-amqp` | RabbitMQ event publishing | Phase 2 |
| `spring-data-redis` | Redis summary caching | Phase 2 |

**Note:** Project initialization using this scaffold is the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- JPA entity relationship strategy: `@OneToOne` with `CascadeType.ALL`
- UserId propagation: explicit method parameter (Controller → Service → Repository)
- DTO strategy: manual `WorkoutMapper`, separate request/response DTOs
- Overlap detection: JPQL interval query within `@Transactional` block
- Pagination: Spring Data `Pageable` + `Page<WorkoutResponse>`

**Important Decisions (Shape Architecture):**
- Audit logging: inline `log.info()` in service layer (3 methods: create, update, delete)
- Event publishing: interface with no-op Phase 1 implementation, wired implementation in Phase 2

**Deferred Decisions (Post-MVP):**
- Redis caching for summary endpoint — Phase 2 (not needed at <100 users)
- RabbitMQ event publishing implementation — Phase 2
- MapStruct migration — if manual mapping becomes burdensome at scale

### Data Architecture

**Database:** PostgreSQL 16.x
**Migrations:** Flyway — applied automatically on startup; all migrations validated against real PostgreSQL on every CI run via Testcontainers

**Entity Relationship:** `@OneToOne` with `CascadeType.ALL` + `orphanRemoval = true`
- `Workout` entity owns the relationship
- `RunningMetrics` has a `@OneToOne(mappedBy = "runningMetrics")` back-reference
- `running_metrics.workout_id` is the FK — unique constraint ensures 1:1
- Deleting a `Workout` cascades to `RunningMetrics` atomically via JPA

**Overlap Detection:**
```java
// Repository method — runs inside @Transactional on workout creation
@Query("SELECT COUNT(w) FROM Workout w WHERE w.userId = :userId " +
       "AND w.startTime < :endTime AND w.endTime > :startTime")
long countOverlappingWorkouts(@Param("userId") UUID userId,
                               @Param("startTime") Instant startTime,
                               @Param("endTime") Instant endTime);
```
Returns 409 Conflict if count > 0.

**Pagination:** Spring Data `Pageable` resolved from request params (`?page=0&size=20&sort=startTime,desc`), returning `Page<WorkoutResponse>`.

**Caching:** Deferred to Phase 2 — Redis `@Cacheable` on summary endpoint.

### Authentication & Security

**Method:** Stateless JWT Bearer token — `Authorization: Bearer {token}` header
**Validation:** `OncePerRequestFilter` subclass reads `JWT_SECRET` from environment, validates signature, extracts `sub` (userId) and `email` claims
**UserId propagation:** Filter authenticates and stores the authenticated user; **Controller extracts userId and passes it explicitly as a method parameter to all service calls** — no SecurityContextHolder access below the controller layer

```java
// Controller pattern
@PostMapping
public ResponseEntity<WorkoutResponse> createWorkout(
    @AuthenticationPrincipal AuthenticatedUser user,  // resolved by Spring Security
    @Valid @RequestBody CreateWorkoutRequest request) {
    return ResponseEntity.status(201)
        .body(workoutService.createWorkout(user.getUserId(), request));
}

// Service method signature
public WorkoutResponse createWorkout(UUID userId, CreateWorkoutRequest request) { ... }
```

**Ownership enforcement:** Service layer checks `workout.getUserId().equals(userId)` before any update/delete/read by ID — throws `WorkoutNotFoundException` (404) for non-existent IDs, `WorkoutAccessDeniedException` (403) for ownership mismatch.

### API & Communication Patterns

**REST:** All endpoints under `/api/v1/`, JSON request/response, HTTP verbs match CRUD semantics
**DTOs:** Separate `CreateWorkoutRequest`, `UpdateWorkoutRequest`, `WorkoutResponse`, `WorkoutSummaryResponse` — no entity exposure via API
**Mapping:** Manual `WorkoutMapper` class with static methods — no MapStruct at MVP scale
**Error handling:** Single `GlobalExceptionHandler` (`@RestControllerAdvice`) — all exceptions map to `ErrorResponse` matching auth-service contract
**API docs:** springdoc-openapi generates OpenAPI from annotations; Swagger UI at `/swagger-ui.html`

**Event publishing interface (Phase 1 — no-op):**
```java
public interface WorkoutEventPublisher {
    void publishWorkoutCompleted(WorkoutCompletedEvent event);
    void publishWorkoutDeleted(WorkoutDeletedEvent event);
}
// Phase 1 impl: no-op (logs at DEBUG)
// Phase 2 impl: RabbitMQ RabbitTemplate
```

### Infrastructure & Deployment

**CI/CD:** GitHub Actions — build, test (including Testcontainers integration tests), lint on every PR and push to main
**Containerization:** Docker — `Dockerfile` with multi-stage build (build stage with Maven, runtime stage with JRE 17-slim)
**Environment config:** All secrets via environment variables (`JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) — no secrets in code or config files
**Health check:** Spring Actuator `/actuator/health` exposed for container orchestration liveness/readiness probes

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold (Spring Initializr + additional dependencies)
2. Flyway migration V1 — `workouts` table
3. Flyway migration V2 — `running_metrics` table
4. JPA entities (`Workout`, `RunningMetrics`) with `@OneToOne` relationship
5. JWT security filter chain
6. Repository layer (`WorkoutRepository`, `RunningMetricsRepository`)
7. Service layer with ownership checks, overlap detection, audit logging
8. DTOs + `WorkoutMapper`
9. `GlobalExceptionHandler`
10. REST controllers
11. `WorkoutEventPublisher` no-op implementation
12. Testcontainers integration tests
13. Swagger UI annotations

**Cross-Component Dependencies:**
- Security filter must run before controllers — filter chain ordering is critical
- Service layer depends on userId being passed from controller — contract must be consistent
- `WorkoutMapper` used by both controller (response) and service (entity → DTO) — single source of truth
- `GlobalExceptionHandler` must handle all custom exceptions thrown by service layer — exception types defined before handler is written

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `workouts`, `running_metrics` |
| Column names | `snake_case` | `user_id`, `avg_heart_rate`, `start_time` |
| Primary keys | `id` UUID | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `{singular_table}_id` | `workout_id` |
| Indexes | `idx_{table}_{column(s)}` | `idx_workouts_user_id` |
| Flyway files | `V{n}__{description}.sql` | `V1__create_workouts_table.sql` |

**API Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Endpoint paths | `kebab-case`, plural nouns | `/api/v1/workouts` |
| Path parameters | `camelCase` | `{workoutId}` |
| Query parameters | `camelCase` | `?page=0&size=20&sort=startTime,desc` |
| JSON fields (request) | `camelCase` | `"avgHeartRate"`, `"distanceMeters"` |
| JSON fields (response) | `camelCase` | `"workoutType"`, `"metricsSessionId"` |

**Java Code Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Packages | `com.lunfit.workoutservice.{layer}` | `com.lunfit.workoutservice.service` |
| Classes | `PascalCase` | `WorkoutService`, `WorkoutController` |
| Interfaces | `PascalCase` (no `I` prefix) | `WorkoutEventPublisher` |
| Methods | `camelCase` | `createWorkout`, `findByUserId` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE` |
| DTOs | `{Entity}{Action}Request/Response` | `CreateWorkoutRequest`, `WorkoutResponse` |
| Exceptions | `{Entity}{Reason}Exception` | `WorkoutNotFoundException`, `WorkoutAccessDeniedException` |

### Structure Patterns

**Layer Package Organisation:**
```
com.lunfit.workoutservice
├── controller/          # REST controllers — no business logic
├── service/             # Business logic, @Transactional, ownership checks
├── repository/          # Spring Data JPA repositories only
├── entity/              # JPA @Entity classes
├── dto/
│   ├── request/         # Inbound request DTOs
│   └── response/        # Outbound response DTOs
├── mapper/              # WorkoutMapper — entity ↔ DTO conversion
├── security/            # JWT filter, AuthenticatedUser, SecurityConfig
├── event/               # WorkoutEventPublisher interface + event POJOs
├── exception/           # Custom exceptions + GlobalExceptionHandler
└── config/              # Spring @Configuration classes (OpenAPI, etc.)
```

**Test Structure:**
```
src/test/java/com/lunfit/workoutservice
├── controller/          # @WebMvcTest slice tests (mocked service)
├── service/             # Unit tests (mocked repositories)
├── repository/          # @DataJpaTest or Testcontainers integration tests
└── integration/         # Full-stack Testcontainers tests (JWT → DB)
```

### Format Patterns

**API Response Formats:**
- No wrapper envelope — responses are the resource directly
- Success: resource object or `Page<WorkoutResponse>` directly
- Delete success: `204 No Content` with empty body
- Error: always `ErrorResponse` pattern — never a plain string

**Error Response (must match auth-service exactly):**
```json
{
  "timestamp": "2026-03-23T07:15:00",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "Human-readable summary",
  "path": "/api/v1/workouts",
  "errors": [{ "field": "distanceMeters", "message": "must be greater than 0" }]
}
```
`errors` is `@JsonInclude(NON_NULL)` — omitted for 401/403/404/409 responses.

**Date/Time:** ISO 8601 UTC strings in JSON (`"2026-03-23T07:00:00Z"`). Java: `Instant`. SQL: `TIMESTAMP WITH TIME ZONE`.

**UUID:** Lowercase hyphenated string. Java: `UUID`. SQL: `UUID`.

**Nulls:** `@JsonInclude(NON_NULL)` on all response DTOs — never serialize `"field": null`.

### Communication Patterns

**Event Naming:**

| Event | Class | Routing key (Phase 2) |
|---|---|---|
| Workout saved | `WorkoutCompletedEvent` | `workout.completed` |
| Workout deleted | `WorkoutDeletedEvent` | `workout.deleted` |

**Audit log format:**
```java
log.info("AUDIT action={} userId={} workoutId={} timestamp={}",
    "CREATE", userId, workout.getId(), Instant.now());
```

### Process Patterns

**Transaction boundary:** `@Transactional` on service layer methods only — never controllers or repositories.

**Ownership check (all service methods accepting a workoutId):**
```java
Workout workout = workoutRepository.findById(workoutId)
    .orElseThrow(() -> new WorkoutNotFoundException(workoutId));
if (!workout.getUserId().equals(userId)) {
    throw new WorkoutAccessDeniedException(workoutId);
}
```

**Validation:** Jakarta Bean Validation on request DTOs only (`@Valid` on `@RequestBody`). No manual null checks in controllers.

### Enforcement Guidelines

**All agents MUST:**
- Place business logic in service layer, not controllers or repositories
- Pass `userId` explicitly as first parameter to all service methods
- Check ownership before any resource operation (update, delete, get-by-id)
- Use `WorkoutMapper` for all entity ↔ DTO conversions — never map inline
- Return exact `ErrorResponse` structure for all error cases
- Annotate controller methods with `@Operation` and `@ApiResponse` for Swagger
- Use `Instant` for timestamps in Java; `TIMESTAMP WITH TIME ZONE` in SQL
- Write a Testcontainers test for any new repository query
- Publish events through `WorkoutEventPublisher` interface — never call RabbitMQ directly

**Anti-patterns:**
- `@Transactional` on a controller method
- Business logic in a repository
- Direct entity exposure in API responses
- Hardcoded userId values in queries
- Custom error response format diverging from `ErrorResponse`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
workout-service/
├── .github/
│   └── workflows/
│       └── ci.yml                               # Build, test, lint on PR + main push
├── src/
│   ├── main/
│   │   ├── java/com/lunfit/workoutservice/
│   │   │   ├── WorkoutServiceApplication.java   # Spring Boot entry point
│   │   │   ├── controller/
│   │   │   │   └── WorkoutController.java        # All 6 REST endpoints
│   │   │   ├── service/
│   │   │   │   └── WorkoutService.java           # Business logic, @Transactional
│   │   │   ├── repository/
│   │   │   │   ├── WorkoutRepository.java        # findByUserId, overlap query, pagination
│   │   │   │   └── RunningMetricsRepository.java
│   │   │   ├── entity/
│   │   │   │   ├── Workout.java                  # Core workout entity
│   │   │   │   ├── RunningMetrics.java           # @OneToOne extension entity
│   │   │   │   └── WorkoutType.java              # Enum: RUN (CYCLING, SWIM Phase 2+)
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   │   ├── CreateWorkoutRequest.java
│   │   │   │   │   └── UpdateWorkoutRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── WorkoutResponse.java
│   │   │   │       ├── WorkoutSummaryResponse.java
│   │   │   │       └── PagedWorkoutResponse.java
│   │   │   ├── mapper/
│   │   │   │   └── WorkoutMapper.java            # Manual entity ↔ DTO mapping
│   │   │   ├── security/
│   │   │   │   ├── JwtAuthenticationFilter.java  # OncePerRequestFilter — JWT validation
│   │   │   │   ├── JwtTokenValidator.java         # JWT parsing/validation logic
│   │   │   │   ├── AuthenticatedUser.java         # Security principal record
│   │   │   │   └── SecurityConfig.java            # Spring Security filter chain config
│   │   │   ├── event/
│   │   │   │   ├── WorkoutEventPublisher.java     # Interface
│   │   │   │   ├── NoOpWorkoutEventPublisher.java # Phase 1 no-op implementation
│   │   │   │   ├── WorkoutCompletedEvent.java     # Event payload record
│   │   │   │   └── WorkoutDeletedEvent.java       # Event payload record
│   │   │   ├── exception/
│   │   │   │   ├── WorkoutNotFoundException.java
│   │   │   │   ├── WorkoutAccessDeniedException.java
│   │   │   │   ├── WorkoutOverlapException.java
│   │   │   │   └── GlobalExceptionHandler.java    # @RestControllerAdvice
│   │   │   └── config/
│   │   │       └── OpenApiConfig.java             # springdoc-openapi config
│   │   └── resources/
│   │       ├── application.yml                    # App config (DB, JWT, server port)
│   │       ├── application-test.yml               # Test profile config
│   │       └── db/migration/
│   │           ├── V1__create_workouts_table.sql
│   │           └── V2__create_running_metrics_table.sql
│   └── test/
│       └── java/com/lunfit/workoutservice/
│           ├── controller/
│           │   └── WorkoutControllerTest.java     # @WebMvcTest — mocked service
│           ├── service/
│           │   └── WorkoutServiceTest.java        # Unit — mocked repositories
│           ├── repository/
│           │   └── WorkoutRepositoryTest.java     # Testcontainers — real PostgreSQL
│           └── integration/
│               └── WorkoutIntegrationTest.java    # Full-stack JWT → DB
├── Dockerfile                                     # Multi-stage: Maven build + JRE 17-slim
├── docker-compose.yml                             # Local dev: PostgreSQL only
├── pom.xml
├── mvnw / mvnw.cmd
└── README.md
```

### Architectural Boundaries

**API Boundary (inbound):**
- Entry: `WorkoutController` — resolves JWT principal, delegates to service
- All requests carry `Authorization: Bearer {token}` — rejected at filter before reaching controller
- No public endpoints — filter chain blocks unauthenticated requests

**Service Boundary:**
- `WorkoutService` is sole owner of business logic: overlap detection, ownership check, audit logging, cascade delete
- Method signature: `(UUID userId, ...)` — userId is always the first parameter
- Calls `WorkoutEventPublisher` interface — decoupled from any broker

**Repository Boundary:**
- All queries include `userId` predicate — no cross-user data access possible
- `WorkoutRepository` owns overlap detection query and pagination
- JPA cascade (`CascadeType.ALL`) handles `RunningMetrics` — `RunningMetricsRepository` rarely called directly

**Data Boundary:**
- `WorkoutMapper` is the exclusive entity ↔ DTO translator — no inline mapping in controllers or services

### Requirements to Structure Mapping

| FR Category | Primary Files |
|---|---|
| Workout Logging (FR1–5) | `WorkoutController`, `WorkoutService`, `CreateWorkoutRequest`, `V1/V2 migrations` |
| Retrieval & History (FR6–10) | `WorkoutController`, `WorkoutRepository`, `WorkoutResponse`, `PagedWorkoutResponse` |
| Modification (FR11–14) | `WorkoutController`, `WorkoutService`, `UpdateWorkoutRequest` |
| Training Analytics (FR15) | `WorkoutController` (`/summary`), `WorkoutService.getSummary()`, `WorkoutSummaryResponse` |
| Identity & Access Control (FR16–19) | `JwtAuthenticationFilter`, `JwtTokenValidator`, `SecurityConfig`, `AuthenticatedUser` |
| Data Lifecycle & Compliance (FR20–24) | `WorkoutService` (delete + bulk delete), `GlobalExceptionHandler`, audit logging |
| API Discoverability (FR25–26) | `OpenApiConfig`, `@Operation`/`@ApiResponse` annotations, `GlobalExceptionHandler` |
| System Events (FR27–29, Growth) | `WorkoutEventPublisher`, `NoOpWorkoutEventPublisher`, event records |

### Integration Points

**Internal data flow:**
```
HTTP Request
  → JwtAuthenticationFilter (validate token, set AuthenticatedUser)
  → WorkoutController (extract userId, call service)
  → WorkoutService (ownership check, business logic, @Transactional)
  → WorkoutRepository / RunningMetricsRepository (PostgreSQL)
  → WorkoutMapper (entity → DTO)
  → WorkoutEventPublisher (no-op Phase 1 / RabbitMQ Phase 2)
  → ResponseEntity<WorkoutResponse>
```

**External integrations:**
- **auth-service** — shared `JWT_SECRET` env var (no runtime call)
- **metrics-service** — `metrics_session_id` UUID stored on `workouts` table; no runtime call Phase 1
- **RabbitMQ** — Phase 2 only; wired via `WorkoutEventPublisher` interface swap
- **Redis** — Phase 2 only; `@Cacheable` on summary endpoint

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible — Java 17, Spring Boot 3.2.x, Spring Security, Spring Data JPA, PostgreSQL, Flyway, jjwt, springdoc-openapi, and Testcontainers are Spring Boot 3.x compatible with no version conflicts. The no-op `WorkoutEventPublisher` removes all RabbitMQ dependency from Phase 1.

**Pattern Consistency:** `@OneToOne CascadeType.ALL` directly satisfies NFR19 and FR14. Explicit `userId` method parameters support unit testing without SecurityContext mocks. Manual `WorkoutMapper` is proportionate to MVP scope.

**Structure Alignment:** Every class named in architectural decisions has a corresponding file in the project tree. Package structure mirrors layer responsibilities exactly.

### Requirements Coverage Validation

**Functional Requirements (29 FRs):** All covered — see Requirements to Structure Mapping table above.

**Non-Functional Requirements (22 NFRs):** All architecturally supported:
- Performance: indexed queries, no N+1 via `@OneToOne` fetch strategy
- Security: dual-layer ownership + `JwtAuthenticationFilter` + `@JsonInclude(NON_NULL)`
- Scalability: stateless design + extension table schema
- Reliability: Flyway + Testcontainers on CI, no-op publisher prevents broker dependency
- Data integrity: `@Transactional` cascade delete, Testcontainers cross-user isolation tests
- Integration: `GlobalExceptionHandler` matches auth-service contract, annotation-generated OpenAPI

### Gap Analysis

**Critical gaps:** None.

**Intentional deferral:** FR23 account deletion trigger (`UserDeletedEvent` consumer) is Phase 2 — `WorkoutService.deleteAllByUserId()` method exists; event consumer wiring deferred until auth-service publishes the event.

### Architecture Completeness Checklist

- [x] Project context analysed, constraints identified, cross-cutting concerns mapped
- [x] All critical architectural decisions documented with rationale
- [x] Technology stack fully specified with versions
- [x] JPA relationship, DTO strategy, audit, propagation, pagination strategies decided
- [x] Phase 2 extension points isolated behind interfaces (no-op pattern)
- [x] Naming conventions: database, API, Java code
- [x] Layer structure, format, communication, and process patterns defined
- [x] Enforcement guidelines and anti-patterns documented
- [x] Complete directory tree with all files named
- [x] All 29 FRs mapped to specific files
- [x] All 22 NFRs architecturally covered

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level: High**

**First Implementation Step:**
```bash
curl https://start.spring.io/starter.zip \
  -d type=maven-project -d language=java -d bootVersion=3.2.x -d javaVersion=17 \
  -d groupId=com.lunfit -d artifactId=workout-service \
  -d packageName=com.lunfit.workoutservice \
  -d dependencies=web,data-jpa,postgresql,flyway,security,validation,actuator \
  -o workout-service.zip
```
