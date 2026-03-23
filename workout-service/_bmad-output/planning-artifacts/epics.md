---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-03-23'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md']
---

# workout-service - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for workout-service, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Authenticated users can log a running workout with a start time, end time, distance, and duration
FR2: Authenticated users can include running-specific aggregate metrics when logging a workout (average heart rate, max heart rate, average pace, elevation gain, average cadence)
FR3: Authenticated users can optionally include a title and freeform notes on a workout
FR4: Authenticated users can include a metrics session reference on a workout for future linkage to a per-sample telemetry service
FR5: The system prevents a user from logging a workout that overlaps in time with an existing workout for the same user
FR6: Authenticated users can retrieve a paginated list of their own workouts
FR7: Authenticated users can filter their workout list by date range
FR8: Authenticated users can filter their workout list by workout type
FR9: Authenticated users can control the sort order of their workout list
FR10: Authenticated users can retrieve the full detail of a single workout they own
FR11: Authenticated users can update the fields of a workout they own
FR12: The system prevents users from modifying the ownership identity of a workout
FR13: Authenticated users can delete a workout they own
FR14: The system atomically removes all associated type-specific metrics records when a workout is deleted
FR15: Authenticated users can retrieve an aggregate training summary across all their workouts (total distance, total session count, average pace)
FR16: All workout operations require a valid JWT bearer token
FR17: The system rejects requests with expired or invalid JWT tokens
FR18: The system prevents users from accessing, modifying, or deleting workouts owned by other users
FR19: The system derives and permanently assigns workout ownership from JWT claims at creation time
FR20: Users can delete any individual workout along with all associated data
FR21: The system retains workout data for a minimum of 3 years from the date of logging
FR22: The system records an audit log entry for every workout creation, update, and deletion event
FR23: The system supports bulk removal of all workouts belonging to a user when an account is deleted (Phase 2)
FR24: Workout and biometric data is never transmitted to or accessible by third-party systems
FR25: API consumers can browse all available endpoints, request/response schemas, and example payloads through an auto-generated interactive documentation interface
FR26: The system returns structured error responses with field-level detail for all validation failures, and consistent error codes across all error scenarios
FR27: The system publishes a workout completion event when a workout is successfully saved, carrying sufficient context for downstream consumers (Phase 2)
FR28: The system publishes a workout deletion event when a workout is deleted, enabling downstream services to clean up associated data (Phase 2)
FR29: The system can consume an account deletion event from the auth-service to cascade-remove all workouts for a given user (Phase 2)

### NonFunctional Requirements

NFR1: POST /api/v1/workouts responds within 200ms at p95 under normal load
NFR2: GET /api/v1/workouts (paginated list) responds within 100ms at p95
NFR3: GET /api/v1/workouts/summary responds within 50ms at p95
NFR4: When the AI coach pipeline is active (Phase 2), the workout-service contributes no more than 100ms to the end-to-end event latency (time from DB write to WorkoutCompletedEvent publish)
NFR5: All data in transit uses TLS — no plaintext HTTP in any environment
NFR6: Heart rate and biometric data is stored with encryption at rest in production environments
NFR7: JWT signature validation is performed on every request — no request bypasses authentication
NFR8: Ownership checks are enforced at both the service layer and repository layer, not just the controller
NFR9: No user biometric or workout data appears in application logs, monitoring systems, or error tracking tools
NFR10: Users have the right to access, export, and delete all their workout data (GDPR alignment)
NFR11: The service supports 100+ concurrent users without response time degradation beyond p95 targets
NFR12: The service is stateless — any number of instances can be deployed behind a load balancer without session affinity
NFR13: The database schema supports adding new workout types without changes to the core workouts table
NFR14: The workout-service maintains 99.9% uptime
NFR15: All Flyway migrations are validated against a real PostgreSQL instance on every CI run
NFR16: When RabbitMQ is active (Phase 2), WorkoutCompletedEvent is published with durable queues and publisher confirms
NFR17: The CI pipeline maintains 100% pass rate on the main branch before any merge
NFR18: Zero cross-user data access incidents — integration tests explicitly assert 403 on cross-user access attempts
NFR19: Workout deletion is atomic — either the workout and all associated metrics are removed, or nothing is removed
NFR20: Service layer test coverage is ≥80% for business logic paths
NFR21: API error response format is consistent with the auth-service ErrorResponse pattern across all endpoints
NFR22: OpenAPI schema is always in sync with the actual implementation — generated from code annotations, not maintained manually

### Additional Requirements

- **Project Scaffold**: Spring Initializr — Java 17, Spring Boot 3.2.x, Maven, dependencies: web, data-jpa, postgresql, flyway, security, validation, actuator. Additional: springdoc-openapi-starter-webmvc-ui, testcontainers + postgresql TC module, jjwt-api/impl/jackson
- **Database migrations**: Flyway V1__create_workouts_table.sql + V2__create_running_metrics_table.sql must be validated on every CI run against real PostgreSQL (Testcontainers)
- **JPA data model**: Workout entity + RunningMetrics entity with @OneToOne(cascade=ALL, orphanRemoval=true); workouts table is core, running_metrics is extension
- **JWT security filter**: OncePerRequestFilter validates JWT_SECRET, extracts userId and email claims; userId passed explicitly as method parameter to all service methods
- **Event publisher interface**: WorkoutEventPublisher interface with NoOpWorkoutEventPublisher Phase 1 implementation — RabbitMQ implementation deferred to Phase 2
- **Error handling**: GlobalExceptionHandler (@RestControllerAdvice) must match auth-service ErrorResponse contract exactly (timestamp, status, error, message, path, errors[])
- **API documentation**: Swagger UI at /swagger-ui.html via springdoc-openapi; all endpoints annotated with @Operation and @ApiResponse
- **Containerisation**: Dockerfile (multi-stage: Maven build + JRE 17-slim) + docker-compose.yml (PostgreSQL only for local dev)
- **CI/CD**: GitHub Actions pipeline — build, test (including Testcontainers), lint on every PR and push to main

### UX Design Requirements

N/A — workout-service is a backend REST API with no frontend UI.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Log workout with start/end time, distance, duration |
| FR2 | Epic 2 | Running aggregate metrics (HR, pace, elevation, cadence) |
| FR3 | Epic 2 | Optional title and notes |
| FR4 | Epic 2 | metricsSessionId reference field |
| FR5 | Epic 2 | Overlap prevention (409 Conflict) |
| FR6 | Epic 3 | Paginated workout list |
| FR7 | Epic 3 | Filter by date range |
| FR8 | Epic 3 | Filter by workout type |
| FR9 | Epic 3 | Sort order control |
| FR10 | Epic 3 | Single workout detail |
| FR11 | Epic 4 | Update workout fields |
| FR12 | Epic 4 | Ownership immutability on update |
| FR13 | Epic 4 | Delete workout |
| FR14 | Epic 4 | Atomic cascade delete of metrics |
| FR15 | Epic 5 | Aggregate training summary |
| FR16 | Epic 1 | JWT required on all operations |
| FR17 | Epic 1 | Reject expired/invalid tokens |
| FR18 | Epic 1 | Cross-user access prevention |
| FR19 | Epic 1 | Ownership assigned from JWT claims |
| FR20 | Epic 4 | Delete workout + all associated data |
| FR21 | Epic 5 | 3-year data retention |
| FR22 | Epic 1 | Audit log on create/update/delete |
| FR23 | Epic 6 | Bulk delete on account deletion (Phase 2) |
| FR24 | Epic 1 | No third-party data transmission |
| FR25 | Epic 1 | Swagger UI / OpenAPI docs |
| FR26 | Epic 1 | Consistent structured error responses |
| FR27 | Epic 6 | WorkoutCompletedEvent publish (Phase 2) |
| FR28 | Epic 6 | WorkoutDeletedEvent publish (Phase 2) |
| FR29 | Epic 6 | UserDeletedEvent consumer (Phase 2) |

## Epic List

### Epic 1: Service Foundation & Security
The service is scaffolded, connected to PostgreSQL, secured with JWT authentication, and returns consistent documented API responses. No business features work without this epic.
**FRs covered:** FR16, FR17, FR18, FR19, FR22, FR24, FR25, FR26

### Epic 2: Workout Logging
Users can log a completed running workout with full aggregate metrics.
**FRs covered:** FR1, FR2, FR3, FR4, FR5

### Epic 3: Workout History & Retrieval
Users can browse their full workout history with filtering, sorting, pagination, and individual detail views.
**FRs covered:** FR6, FR7, FR8, FR9, FR10

### Epic 4: Workout Management
Users can correct mistakes in logged workouts and permanently delete workouts with all associated data.
**FRs covered:** FR11, FR12, FR13, FR14, FR20

### Epic 5: Training Analytics & Data Compliance
Users can view aggregate training statistics. The service enforces data retention and GDPR compliance.
**FRs covered:** FR15, FR21

### Epic 6: Event Integration & Account Lifecycle _(Phase 2)_
The AI coach pipeline is wired — workout events are published on save/delete, and account deletion cascades cleanly.
**FRs covered:** FR23, FR27, FR28, FR29

---

## Epic 1: Service Foundation & Security

The service is scaffolded, connected to PostgreSQL, JWT-authenticated, and returns consistent documented API responses. No business features work without this epic.

### Story 1.1: Project Scaffold & Database Foundation

As a **developer**,
I want the project scaffolded with Spring Boot, Maven, PostgreSQL connected, and Flyway migrations for the core `workouts` and `running_metrics` tables applied,
So that all subsequent stories have a working database-connected service to build on.

**Acceptance Criteria:**

**Given** the Spring Initializr project is initialised with dependencies: web, data-jpa, postgresql, flyway, security, validation, actuator, plus springdoc-openapi-starter-webmvc-ui, testcontainers postgresql module, and jjwt-api/impl/jackson
**When** the application starts
**Then** it connects to PostgreSQL and Flyway applies V1 and V2 migrations successfully with no errors

**Given** the Flyway V1 migration
**When** applied
**Then** a `workouts` table exists with columns: `id` (UUID PK), `user_id` (UUID NOT NULL), `workout_type` (VARCHAR NOT NULL), `title` (VARCHAR), `start_time` (TIMESTAMP WITH TIME ZONE NOT NULL), `end_time` (TIMESTAMP WITH TIME ZONE NOT NULL), `duration_seconds` (INTEGER NOT NULL), `distance_meters` (INTEGER NOT NULL), `notes` (TEXT), `metrics_session_id` (UUID), `created_at` (TIMESTAMP WITH TIME ZONE), `updated_at` (TIMESTAMP WITH TIME ZONE)
**And** index `idx_workouts_user_id` exists on `(user_id)`
**And** index `idx_workouts_start_time` exists on `(start_time)`

**Given** the Flyway V2 migration
**When** applied
**Then** a `running_metrics` table exists with columns: `id` (UUID PK), `workout_id` (UUID NOT NULL UNIQUE FK → workouts.id ON DELETE CASCADE), `avg_heart_rate` (INTEGER), `max_heart_rate` (INTEGER), `avg_pace_seconds_per_km` (INTEGER), `elevation_gain_meters` (INTEGER), `avg_cadence` (INTEGER)

**Given** the `Workout` and `RunningMetrics` JPA entities
**When** compiled
**Then** `Workout` has a `@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)` field to `RunningMetrics`
**And** the package structure follows `com.lunfit.workoutservice.{controller|service|repository|entity|dto|mapper|security|event|exception|config}`

**Given** the project is built with `./mvnw test`
**When** Testcontainers spins up a real PostgreSQL container
**Then** Flyway migrations are applied and validated with no errors
**And** all tests pass

---

### Story 1.2: JWT Security Filter Chain

As a **developer**,
I want all API endpoints protected by a JWT authentication filter that validates tokens and extracts the userId,
So that unauthenticated requests are rejected before reaching any business logic.

**Acceptance Criteria:**

**Given** a request to any `/api/v1/**` endpoint with no `Authorization` header
**When** the request is processed
**Then** the response is `401 Unauthorized` with the standard `ErrorResponse` body

**Given** a request with an `Authorization: Bearer {token}` where the token is expired or has an invalid signature against `JWT_SECRET`
**When** the request is processed
**Then** the response is `401 Unauthorized`

**Given** a request with a valid JWT signed with `JWT_SECRET`
**When** the JWT filter processes it
**Then** an `AuthenticatedUser` principal is placed in the Spring SecurityContext containing `userId` (from `sub` claim) and `email`
**And** the request proceeds to the controller

**Given** the security configuration
**When** compiled
**Then** session management is `STATELESS`, CSRF is disabled, and all `/api/v1/**` paths require authentication
**And** `/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`, and `/actuator/health` are publicly accessible

---

### Story 1.3: Global Error Handling & API Documentation

As an **API consumer**,
I want all errors returned in a consistent structured format and all endpoints browsable via Swagger UI,
So that the client app handles errors uniformly and the frontend team can develop against documented schemas.

**Acceptance Criteria:**

**Given** a request with an invalid request body (missing required field or failed validation)
**When** processed by the `GlobalExceptionHandler`
**Then** the response is `400 Bad Request` with `ErrorResponse` body containing `timestamp`, `status` (400), `error` ("BAD_REQUEST"), `message`, `path`, and `errors[]` with per-field `field` and `message` entries
**And** the format matches the auth-service `ErrorResponse` contract exactly (`timestamp` as LocalDateTime, no `Z` suffix)

**Given** a request for a resource that does not exist
**When** processed
**Then** the response is `404 Not Found` with `ErrorResponse` body and `errors` field omitted (null fields excluded via `@JsonInclude(NON_NULL)`)

**Given** any unhandled server exception
**When** processed
**Then** the response is `500 Internal Server Error` with `ErrorResponse` body and no internal stack trace exposed

**Given** the application is running
**When** a browser navigates to `/swagger-ui.html`
**Then** the Swagger UI loads and displays all `/api/v1/workouts` endpoints with request/response schemas and example values

**Given** a GET request to `/v3/api-docs`
**When** processed
**Then** a valid OpenAPI JSON document is returned reflecting the current implementation annotations

---

### Story 1.4: WorkoutEventPublisher No-Op & Docker Setup

As a **developer**,
I want a `WorkoutEventPublisher` interface with a no-op Phase 1 implementation, a multi-stage Dockerfile, and a local docker-compose.yml,
So that Phase 2 event wiring requires no architectural changes, and the service runs locally without manual PostgreSQL setup.

**Acceptance Criteria:**

**Given** the `WorkoutEventPublisher` interface
**When** compiled
**Then** it declares `publishWorkoutCompleted(WorkoutCompletedEvent)` and `publishWorkoutDeleted(WorkoutDeletedEvent)` methods
**And** `NoOpWorkoutEventPublisher` is the active `@Primary` `@Component` bean, logging calls at DEBUG level without throwing

**Given** the `WorkoutCompletedEvent` record
**When** compiled
**Then** it contains fields: `userId` (UUID), `workoutId` (UUID), `workoutType` (String), `distanceMeters` (int), `durationSeconds` (int), `avgHeartRate` (Integer), `avgPaceSecondsPerKm` (Integer), `startTime` (Instant)

**Given** the `Dockerfile`
**When** built with `docker build`
**Then** it uses a multi-stage build: stage 1 runs `./mvnw package -DskipTests`, stage 2 uses `eclipse-temurin:17-jre-alpine` and runs the JAR
**And** the built image starts the application successfully

**Given** `docker-compose.yml`
**When** run with `docker compose up`
**Then** a PostgreSQL 16 container starts and the workout-service connects to it with `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` sourced from environment

**Given** the GitHub Actions `ci.yml`
**When** a PR is opened or a push to `main` occurs
**Then** the pipeline runs `./mvnw verify` including Testcontainers integration tests and fails if any test fails

---

## Epic 2: Workout Logging

Users can log a completed running workout with full aggregate metrics.

### Story 2.1: Log a Running Workout

As an **authenticated user**,
I want to submit a running workout with aggregate metrics via `POST /api/v1/workouts`,
So that my run is permanently recorded with all performance data.

**Acceptance Criteria:**

**Given** an authenticated user with a valid JWT
**When** they POST to `/api/v1/workouts` with a valid `CreateWorkoutRequest` body containing `workoutType: "RUN"`, `startTime`, `endTime`, `durationSeconds`, `distanceMeters`
**Then** the response is `201 Created` with a `WorkoutResponse` body containing a generated `id` (UUID), `userId` set from the JWT `sub` claim, all submitted fields, `createdAt`, and `updatedAt`
**And** a `workouts` row and a `running_metrics` row are persisted in the database atomically

**Given** a `CreateWorkoutRequest` with running metrics: `avgHeartRate`, `maxHeartRate`, `avgPaceSecondsPerKm`, `elevationGainMeters`, `avgCadence`
**When** the workout is saved
**Then** all metrics are stored in the `running_metrics` table linked to the workout via `workout_id`
**And** the response includes all metric fields

**Given** a `CreateWorkoutRequest` with optional fields `title` and `notes` provided
**When** the workout is saved
**Then** both fields are persisted and returned in the response

**Given** a `CreateWorkoutRequest` with `metricsSessionId` set to a UUID
**When** the workout is saved
**Then** the `metrics_session_id` field is persisted and returned in the response

**Given** a `CreateWorkoutRequest` with `metricsSessionId` omitted or null
**When** the response is serialised
**Then** `metricsSessionId` is absent from the JSON response body (not serialised as `null`)

**Given** an unauthenticated request
**When** POST `/api/v1/workouts` is called
**Then** the response is `401 Unauthorized`

**Given** a workout is successfully created
**When** the service audit logger runs
**Then** a log entry is written at INFO level with `action=CREATE`, `userId`, `workoutId`, and `timestamp`

---

### Story 2.2: Workout Input Validation

As an **authenticated user**,
I want the API to reject invalid workout submissions with clear field-level error messages,
So that data quality is enforced and I know exactly what to fix.

**Acceptance Criteria:**

**Given** a `CreateWorkoutRequest` with `distanceMeters` set to 0 or negative
**When** submitted
**Then** the response is `400 Bad Request` with `errors[]` containing `{ "field": "distanceMeters", "message": "must be greater than 0" }`

**Given** a `CreateWorkoutRequest` with `durationSeconds` set to 0 or negative
**When** submitted
**Then** the response is `400 Bad Request` with a field error on `durationSeconds`

**Given** a `CreateWorkoutRequest` missing required field `startTime`
**When** submitted
**Then** the response is `400 Bad Request` with a field error on `startTime`

**Given** a `CreateWorkoutRequest` with `avgHeartRate` outside the range 1–300
**When** submitted
**Then** the response is `400 Bad Request` with a field error on `avgHeartRate`

**Given** a `CreateWorkoutRequest` with `workoutType` missing or blank
**When** submitted
**Then** the response is `400 Bad Request` with a field error on `workoutType`

**Given** a `CreateWorkoutRequest` with multiple invalid fields simultaneously
**When** submitted
**Then** the `errors[]` array contains one entry per invalid field

---

### Story 2.3: Overlap Prevention

As an **authenticated user**,
I want the system to prevent me from logging a workout that overlaps in time with an existing workout,
So that my training log remains accurate with no duplicate or conflicting sessions.

**Acceptance Criteria:**

**Given** a user has an existing workout from `07:00` to `07:30`
**When** they attempt to log a new workout from `07:15` to `07:45`
**Then** the response is `409 Conflict` with `ErrorResponse` containing `error: "CONFLICT"` and a message describing the overlap

**Given** a user has an existing workout from `07:00` to `07:30`
**When** they log a new workout starting at `07:30` or later
**Then** the response is `201 Created` and the workout is saved

**Given** a user has no existing workouts
**When** they log their first workout
**Then** the response is `201 Created` with no conflict

**Given** two different users each have a workout in the same time window
**When** user B logs a workout
**Then** user A's workout does not trigger a conflict — overlap is checked per `userId` only

---

## Epic 3: Workout History & Retrieval

Users can browse their full workout history with filtering, sorting, pagination, and individual detail views.

### Story 3.1: Paginated Workout List

As an **authenticated user**,
I want to retrieve a paginated list of my workouts sorted by most recent first,
So that I can browse my training history without loading all records at once.

**Acceptance Criteria:**

**Given** an authenticated user with several logged workouts
**When** they GET `/api/v1/workouts`
**Then** the response is `200 OK` with a paginated body containing `content[]` (array of `WorkoutResponse`), `totalElements`, `totalPages`, `page`, and `size`
**And** results default to page 0, size 20, sorted by `startTime` descending

**Given** a request with `?page=1&size=5`
**When** processed
**Then** the response returns the second page of results with up to 5 workouts

**Given** a request with `?size=101`
**When** processed
**Then** the response is `400 Bad Request` — page size is capped at 100

**Given** an authenticated user with no workouts
**When** they GET `/api/v1/workouts`
**Then** the response is `200 OK` with `content: []` and `totalElements: 0`

**Given** any workout list request
**When** processed
**Then** the response contains ONLY workouts belonging to the authenticated `userId` — no other users' data is ever included

---

### Story 3.2: Filter Workouts by Date Range and Type

As an **authenticated user**,
I want to filter my workout list by date range and workout type,
So that I can view specific training periods or sport-specific sessions.

**Acceptance Criteria:**

**Given** a request with `?from=2026-03-01&to=2026-03-31`
**When** processed
**Then** the response contains only workouts where `startTime` falls within the specified range (inclusive)

**Given** a request with `?type=RUN`
**When** processed
**Then** the response contains only workouts with `workoutType` matching `RUN`

**Given** a request with both `?from=2026-03-01&type=RUN`
**When** processed
**Then** both filters are applied — only RUN workouts within the date range are returned

**Given** a request with a `from` date after the `to` date
**When** processed
**Then** the response is `400 Bad Request` with a meaningful error message

**Given** a request with no filter parameters
**When** processed
**Then** all workouts for the authenticated user are returned (paginated, no filter applied)

---

### Story 3.3: Sort Workout List

As an **authenticated user**,
I want to control the sort order of my workout list,
So that I can view workouts in the order most useful to me.

**Acceptance Criteria:**

**Given** a request with `?sort=startTime,asc`
**When** processed
**Then** workouts are returned ordered by `startTime` ascending (oldest first)

**Given** a request with `?sort=startTime,desc`
**When** processed
**Then** workouts are returned ordered by `startTime` descending (newest first)

**Given** a request with no `sort` parameter
**When** processed
**Then** workouts default to `startTime` descending

**Given** a request with `?sort=distanceMeters,desc`
**When** processed
**Then** workouts are returned ordered by `distanceMeters` descending

---

### Story 3.4: Get Single Workout Detail

As an **authenticated user**,
I want to retrieve the full detail of a specific workout by its ID,
So that I can view all metrics and notes for an individual session.

**Acceptance Criteria:**

**Given** an authenticated user requests `GET /api/v1/workouts/{id}` for a workout they own
**When** processed
**Then** the response is `200 OK` with the full `WorkoutResponse` including all running metrics fields

**Given** an authenticated user requests `GET /api/v1/workouts/{id}` for a workout ID that does not exist
**When** processed
**Then** the response is `404 Not Found` with `ErrorResponse`

**Given** an authenticated user requests `GET /api/v1/workouts/{id}` for a workout owned by a different user
**When** processed
**Then** the response is `403 Forbidden` — the workout is not exposed regardless of whether it exists

**Given** an unauthenticated request to `GET /api/v1/workouts/{id}`
**When** processed
**Then** the response is `401 Unauthorized`

---

## Epic 4: Workout Management

Users can update and delete their own workouts with full ownership enforcement and atomic data cleanup.

### Story 4.1: Update Workout Fields

As an **authenticated user**,
I want to update the fields of an existing workout I own,
So that I can correct errors or refine my workout data after logging it.

**Acceptance Criteria:**

**Given** a valid JWT and a workout owned by the requesting user
**When** PUT `/api/v1/workouts/{workoutId}` is called with a valid `UpdateWorkoutRequest` body
**Then** the workout is updated atomically and the updated `WorkoutResponse` is returned with HTTP 200
**And** only non-null fields in the request body are applied (partial update semantics)

**Given** a valid JWT and a workout owned by the requesting user
**When** the update would cause a time overlap with another of the user's existing workouts (excluding the workout being updated)
**Then** HTTP 409 Conflict is returned with error message indicating overlap

**Given** a valid JWT and a `workoutId` that does not exist
**When** PUT `/api/v1/workouts/{workoutId}` is called
**Then** HTTP 404 Not Found is returned

**Given** a valid JWT and a workout owned by a different user
**When** PUT `/api/v1/workouts/{workoutId}` is called
**Then** HTTP 403 Forbidden is returned and no data is modified

**Given** a workout is successfully updated
**When** the service audit logger runs
**Then** a log entry is written at INFO level with `action=UPDATE`, `userId`, `workoutId`, and `timestamp`

---

### Story 4.2: Ownership Immutability

As the **system**,
I want the `userId` field of a workout to be immutable after creation,
So that ownership cannot be transferred or manipulated through update endpoints.

**Acceptance Criteria:**

**Given** a valid `UpdateWorkoutRequest` body that includes a `userId` field
**When** the update is processed by the service layer
**Then** the `userId` value in the request is silently ignored and the original `userId` is preserved

**Given** a workout record in the database
**When** any update operation is performed via the service layer
**Then** the `userId` column value in the database remains unchanged after the operation

**Given** a `WorkoutMapper.updateEntity(UpdateWorkoutRequest, Workout)` method
**When** called with any request
**Then** the method never sets the `userId` field on the entity

---

### Story 4.3: Delete Workout

As an **authenticated user**,
I want to delete a workout I own,
So that I can remove incorrectly logged or unwanted workout records.

**Acceptance Criteria:**

**Given** a valid JWT and a workout owned by the requesting user
**When** DELETE `/api/v1/workouts/{workoutId}` is called
**Then** the workout is deleted and HTTP 204 No Content is returned with an empty body

**Given** a valid JWT and a `workoutId` that does not exist
**When** DELETE `/api/v1/workouts/{workoutId}` is called
**Then** HTTP 404 Not Found is returned

**Given** a valid JWT and a workout owned by a different user
**When** DELETE `/api/v1/workouts/{workoutId}` is called
**Then** HTTP 403 Forbidden is returned and the workout record is not deleted

**Given** a workout is successfully deleted
**When** the service audit logger runs
**Then** a log entry is written at INFO level with `action=DELETE`, `userId`, `workoutId`, and `timestamp`

---

### Story 4.4: Atomic Cascade Delete of Associated Data

As the **system**,
I want all type-specific metrics records associated with a workout to be deleted atomically when the workout is deleted,
So that no orphaned data remains in the database and referential integrity is maintained.

**Acceptance Criteria:**

**Given** a `RUNNING` workout with an associated `running_metrics` row
**When** the workout is deleted via the service layer
**Then** both the `workouts` row and the `running_metrics` row are deleted within the same transaction
**And** if any part of the deletion fails, neither row is deleted (full rollback)

**Given** the `Workout` entity has `@OneToOne(cascade=CascadeType.ALL, orphanRemoval=true)` on the `runningMetrics` field
**When** `workoutRepository.delete(workout)` is called
**Then** JPA cascade handling automatically deletes the associated `RunningMetrics` without an explicit repository call

**Given** a workout with no associated type-specific metrics
**When** the workout is deleted
**Then** the deletion completes successfully without errors

---

## Epic 5: Training Analytics & Data Compliance

Users can view aggregate training statistics and exercise full GDPR data rights over their workout records.

### Story 5.1: Workout Summary Statistics

As an **authenticated user**,
I want to retrieve aggregate training statistics for a given time period,
So that I can understand my overall training volume, pace trends, and consistency at a glance.

**Acceptance Criteria:**

**Given** an authenticated user with logged workouts
**When** GET `/api/v1/workouts/summary?from=2026-03-01&to=2026-03-31` is called
**Then** the response is `200 OK` with a `WorkoutSummaryResponse` containing `totalWorkouts`, `totalDistanceMeters`, `totalDurationSeconds`, `avgPaceSecondsPerKm`, and `totalElevationGainMeters` computed from all workouts in the range owned by the user

**Given** a summary request with `?type=RUN`
**When** processed
**Then** summary statistics are computed only from workouts matching that type

**Given** a summary request where no workouts exist in the specified range
**When** processed
**Then** the response is `200 OK` with all numeric fields set to 0 (not null)

**Given** an unauthenticated request to the summary endpoint
**When** processed
**Then** the response is `401 Unauthorized`

**Given** a summary request with an invalid date range (from after to)
**When** processed
**Then** the response is `400 Bad Request`

---

### Story 5.2: Export Workout Data (GDPR)

As an **authenticated user**,
I want to export all my workout data in a portable format,
So that I can retain a copy of my data or migrate to another service.

**Acceptance Criteria:**

**Given** an authenticated user
**When** GET `/api/v1/workouts/export` is called
**Then** the response is `200 OK` with `Content-Type: application/json` and a JSON array of all workouts owned by the user including all running metrics fields
**And** the response includes `Content-Disposition: attachment; filename="workouts-export.json"`

**Given** an authenticated user with no workouts
**When** the export is requested
**Then** the response is `200 OK` with an empty JSON array `[]`

**Given** an unauthenticated request to the export endpoint
**When** processed
**Then** the response is `401 Unauthorized`

---

### Story 5.3: Delete All User Data (GDPR Right to Erasure)

As an **authenticated user**,
I want to request deletion of all my workout data,
So that I can exercise my right to erasure under data protection requirements.

**Acceptance Criteria:**

**Given** an authenticated user
**When** DELETE `/api/v1/workouts/me` is called
**Then** all workouts and associated type-specific metrics owned by that `userId` are deleted atomically
**And** the response is `204 No Content`

**Given** a user with no workouts
**When** DELETE `/api/v1/workouts/me` is called
**Then** the response is `204 No Content` (idempotent — no error if nothing to delete)

**Given** the delete-all operation executes
**When** complete
**Then** an audit log entry is written at INFO level with `action=DELETE_ALL_USER_DATA`, `userId`, `count` of deleted records, and `timestamp`

**Given** an unauthenticated request to the delete-all endpoint
**When** processed
**Then** the response is `401 Unauthorized`

---

## Epic 6: Event Integration & Account Lifecycle (Phase 2)

RabbitMQ event publishing and consumption to enable cross-service data consistency and account lifecycle management.

### Story 6.1: Publish WorkoutCompleted Event to RabbitMQ

As the **system**,
I want to publish a `WorkoutCompleted` event to RabbitMQ when a workout is successfully created,
So that downstream services can react to new training data without polling.

**Acceptance Criteria:**

**Given** a `RabbitMQWorkoutEventPublisher` implementation of `WorkoutEventPublisher` is configured as the active bean
**When** a workout is successfully created
**Then** a `WorkoutCompletedEvent` is published to the configured RabbitMQ exchange with routing key `workout.completed`
**And** the event contains `userId`, `workoutId`, `workoutType`, `distanceMeters`, `durationSeconds`, `avgHeartRate`, `avgPaceSecondsPerKm`, `startTime`

**Given** the RabbitMQ broker is unavailable
**When** a workout is created
**Then** the workout is still persisted successfully and the publish failure is logged at ERROR level without propagating an exception to the caller

**Given** the application starts with RabbitMQ connection properties (`RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`)
**When** the context loads
**Then** the application connects and exchange/queue bindings are declared successfully

---

### Story 6.2: Publish WorkoutDeleted Event to RabbitMQ

As the **system**,
I want to publish a `WorkoutDeleted` event to RabbitMQ when a workout is successfully deleted,
So that downstream services can clean up any derived data associated with that workout.

**Acceptance Criteria:**

**Given** an authenticated user deletes a workout
**When** the deletion is successful
**Then** a `WorkoutDeletedEvent` is published to the configured RabbitMQ exchange with routing key `workout.deleted`
**And** the event contains `userId` and `workoutId`

**Given** the RabbitMQ broker is unavailable
**When** a workout is deleted
**Then** the workout is still deleted from the database and the publish failure is logged at ERROR level without rolling back the deletion

---

### Story 6.3: Handle Account Deleted Event (Cascade User Data Removal)

As the **system**,
I want to consume an `AccountDeleted` event from RabbitMQ and delete all workout data for that user,
So that user data is fully removed across all services when an account is closed.

**Acceptance Criteria:**

**Given** an `AccountDeletedEvent` message is received on the `account.deleted` queue
**When** processed by the event listener
**Then** all workouts and associated type-specific metrics for the specified `userId` are deleted atomically in a single transaction

**Given** the `AccountDeletedEvent` references a `userId` with no workouts
**When** processed
**Then** the operation completes successfully with no error (idempotent)

**Given** an `AccountDeletedEvent` is processed successfully
**When** complete
**Then** an audit log entry is written at INFO level with `action=ACCOUNT_DELETED_CASCADE`, `userId`, `count` of deleted workout records, and `timestamp`

**Given** an `AccountDeletedEvent` message cannot be deserialized or processing fails
**When** the error occurs
**Then** the message is sent to a dead-letter queue and the error is logged at ERROR level — no partial data is deleted

---

### Story 6.4: Idempotent Event Processing

As the **system**,
I want event consumers to be idempotent,
So that redelivered or duplicate messages do not cause data corruption or duplicate side effects.

**Acceptance Criteria:**

**Given** an `AccountDeletedEvent` for a `userId` whose data was already deleted
**When** the same event is received again
**Then** the handler completes without error and no exception is thrown

**Given** any RabbitMQ consumer method
**When** implemented
**Then** it is annotated with `@RabbitListener` and wrapped in a `@Transactional` boundary
**And** the method is safe to call multiple times with the same payload
