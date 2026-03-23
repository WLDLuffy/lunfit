---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['_bmad-output/planning-artifacts/research/technical-workout-service-backend-research-2026-03-23.md']
classification:
  projectType: api_backend
  domain: consumer_fitness_general
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - workout-service

**Author:** Wongweilun
**Date:** 2026-03-23

## Executive Summary

LunFit is an AI-powered endurance sports coaching platform that delivers real-time, personalised coaching through a voice agent — solving the core friction of heart rate zone training: athletes currently must interrupt their run to check a watch or phone to know if they've crossed a zone boundary. LunFit's voice coach monitors biometric data during the workout and announces zone crossings directly to the athlete's earphones, enabling true zone-disciplined training without attention overhead.

The target users are self-coached endurance athletes — primarily recreational and intermediate runners who want to train with structure and sports science, not just log miles. The secondary audience is triathletes who need unified tracking across running, cycling, and swimming. The deeper need being solved is not just data logging — it's the gap between knowing evidence-based training principles (80/20 zone 2, progressive overload) and actually executing them consistently. LunFit bridges that gap with a coach that educates, monitors, and adapts in real time.

The `workout-service` is the foundational backend microservice for this platform. Its immediate scope is to provide a reliable, extensible workout data store — beginning with running sessions — that powers the AI coaching layer. It is architected from day one for multi-sport extensibility (cycling, swimming, triathlon) and async AI agent integration via event publishing, without coupling the workout data layer to any specific coaching implementation.

### What Makes This Special

**Real-time voice zone coaching** — no existing mainstream running app (Strava, Garmin Connect, Nike Run Club) provides live in-ear heart rate zone alerts during a run. This is a specific, solved friction point for a large and underserved segment of serious recreational runners.

**Theory + execution** — the AI coach doesn't just prescribe workouts; it explains the sports science behind them (why 80% of mileage should be Zone 2, what threshold training achieves, how progressive overload works). Athletes who understand their training are more compliant and more motivated.

**Coaching presence, not a dashboard** — the product emotion is "I have a coach" not "I have a tracker." Post-run summaries, in-run cues, and progressive plan adjustments create a continuous coaching relationship rather than a data logging tool.

**Endurance sports platform scope** — designed from the data model up to support running, cycling, and swimming, positioning LunFit as the go-to platform for triathlon training — a high-intent, underserved user segment with strong willingness to pay.

## Project Classification

- **Project Type:** REST API Backend Microservice
- **Domain:** Consumer Fitness / Endurance Sports
- **Complexity:** Medium — extensible multi-sport data model, JWT-integrated microservice ecosystem, async AI agent event pipeline
- **Project Context:** Greenfield — new service within the existing LunFit microservice platform (auth-service already built)

## Success Criteria

### User Success

- **Zone 2 pace improvement:** Users can observe their pace at a given heart rate improving over weeks — running the same route faster at the same effort level is the primary long-term success indicator.
- **Perceived exertion improvement:** Running feels progressively easier at the same paces over time. Users can correlate this with their logged aggregate HR data.
- **Coaching presence (Phase 2):** During a run, users feel accompanied — real-time voice zone alerts remove the friction of checking devices and create the sensation of having a coach alongside them.
- **Frictionless logging:** A completed run is logged with all aggregate metrics in under 60 seconds of user interaction.

### Business Success

- **Month 1:** 100 active users successfully logging runs with aggregate metrics.
- **Data quality:** >90% of logged workouts include complete HR and pace data.
- **Low AI feedback latency (Phase 2):** When the AI coaching layer is added, voice and post-run coaching responses must feel near-instantaneous — target <2s from event trigger to coach response delivery.
- **Retention signal:** Users who log at least 3 runs in week 1 continue logging in week 4.

### Technical Success

- **API performance:** POST `/api/v1/workouts` < 200ms p95; GET list (cached) < 100ms p95; summary endpoint < 50ms p95.
- **Concurrency:** Supports 100+ concurrent users without degradation.
- **Data integrity:** Zero cross-user data leakage — all queries scoped to authenticated `userId`.
- **Test quality:** All Flyway migrations validated against real PostgreSQL on every CI run; >80% unit test coverage on service layer.
- **Inter-service readiness:** `metrics_session_id` reference field present from day one, enabling metrics-service linkage without schema changes.

### Measurable Outcomes

| Outcome | Metric | Target |
|---|---|---|
| User adoption | Active users logging runs | 100 by end of month 1 |
| Data completeness | Workouts with HR + pace data | >90% |
| API reliability | p95 response time (POST workout) | <200ms |
| Test confidence | CI pass rate | 100% on main branch |
| Data security | Cross-user data access incidents | 0 |

## Product Scope

### MVP — Minimum Viable Product (workout-service)

Core workout tracking for running sessions with aggregate metrics. No AI coaching agent, no per-sample telemetry.

- User authentication via JWT (validated from auth-service tokens)
- Log a running workout: distance, duration, start/end time, notes
- Running metrics captured per workout: average HR, max HR, average pace, elevation gain (scalar), average cadence
- `metrics_session_id` reference field (nullable) — reserved for future metrics-service linkage
- Retrieve workout history: paginated, filterable by date range and workout type
- Retrieve single workout detail
- Basic aggregate summary per user: total distance, total runs, average pace
- Extensible data model supporting future workout types without schema changes to existing tables

### Growth Features (Post-MVP)

- **metrics-service:** Separate microservice storing all per-sample time-series entries per workout session (GPS coordinates, HR, cadence, elevation at each timestamp). Links to workout-service via `metrics_session_id`.
- **RabbitMQ event publishing:** `WorkoutCompletedEvent` published on workout save — enables AI coach agent to be built independently.
- **Heart rate zone breakdown:** Per-workout time-in-zone analysis (Zone 1–5) based on user-configured HR zones.
- **Real-time session streaming:** WebSocket or streaming endpoint for live HR data during a run — prerequisite for voice coaching.
- **Voice zone alerts:** In-run announcement when athlete crosses HR zone boundaries (AI coach Phase 1).
- **Cycling workout support:** `cycling_metrics` extension table (cadence, power).

### Vision (Future)

- **AI running coach:** Progressive training plan generation with zone 2 education and 80/20 rationale; adapts based on workout history.
- **Triathlon training support:** Unified tracking across running, cycling, and swimming with sport-specific metrics and combined training load.
- **Swimming workout support:** Lap count, stroke rate, SWOLF score.
- **Wearable integrations:** FIT/GPX import from Garmin/Apple Watch; Strava sync.

## User Journeys

### Journey 1: Alex — The Uninitiated Runner (Primary User, Success Path)

**Who is Alex?** Alex is a 28-year-old who runs 3–4 times a week. They've been running for a year, always pushing hard because they assumed that's how you get faster. They've heard of "Zone 2" from a podcast but don't really know what it means or why it matters. Their progress has plateaued and they're frustrated — they work hard but aren't getting noticeably faster.

**Opening Scene:** Alex downloads LunFit, already registered via the auth-service. They complete their first run — 5km, average pace 5:45/km, average HR 172bpm — and open the app to log it.

**Rising Action:** Alex submits the workout via the client app. The workout-service receives a JWT-authenticated POST request, validates their identity, and stores: distance (5000m), duration (28:45), average HR (172bpm), max HR (184bpm), average pace (345 sec/km), elevation gain (42m), average cadence (168spm), and a `metrics_session_id` placeholder for the future GPS session. The service returns the saved workout with a generated ID and all computed fields.

Over the next 4 weeks, Alex logs 16 more runs. Some are harder efforts (HR 175–185), some were supposed to be "easy" but HR crept up (HR 165–170). Alex doesn't yet know that 172bpm is Zone 4 for them — they've been running "easy" runs at too high an effort.

**Climax:** Alex opens their workout history. The client app calls `GET /api/v1/workouts?limit=20&sort=-startTime`. They also hit the summary endpoint: `GET /api/v1/workouts/summary` — total distance 98km, average pace 5:42/km across all runs. The data is all there, consistently logged. When the AI coach is enabled in Phase 2, it will consume this 4-week history and immediately identify the problem: Alex has been running almost all their miles in Zone 3–4, with virtually no Zone 2 training. The coaching plan it generates will be grounded in this data.

**Resolution:** Alex's workout history is the foundation of their coaching relationship. Every run logged is a data point the coach will use. The workout-service has done its job — reliably capturing the truth of Alex's training, ready to be interpreted.

*This journey reveals requirements for: authenticated workout creation, aggregate metrics storage, paginated history retrieval, summary aggregation, extensible schema for future workout types.*

---

### Journey 2: Alex — Logging Error Recovery (Primary User, Edge Case)

**Scene:** After a long run, Alex opens the app to log their workout but accidentally enters distance as 50km instead of 5km and submits. The workout-service accepts the request (it's valid data syntactically) and stores the workout.

Alex immediately notices the error in the returned response — the average pace shows as 34:30/km, which is clearly wrong. They call `PUT /api/v1/workouts/{id}` to correct the distance to 5km. The service re-validates the JWT, confirms the workout belongs to Alex's `userId`, updates the record, and returns the corrected workout.

**Second scenario:** Alex's JWT access token expires mid-session (after 1 hour). They try to log a workout and receive a `401 Unauthorized`. The client app silently refreshes via the auth-service and retries. Alex never notices.

**Third scenario:** A bug in an early client build accidentally sends a request with another user's `workoutId` in a GET call. The workout-service checks that `workout.userId == authenticatedUserId` — it doesn't match, returns `403 Forbidden`. The data is never exposed.

*This journey reveals requirements for: workout update endpoint, JWT expiry handling (401 response), cross-user data isolation (403 on ownership mismatch), input validation with meaningful error responses.*

---

### Journey 3: The AI Coach Agent (API Consumer, System Integration)

**Who is the AI Coach?** Not a human — a downstream microservice that subscribes to workout events and queries the workout-service to generate personalised coaching plans. This is the most important system-level consumer of the workout-service API.

**Scene (Growth Phase):** Alex completes a run and the workout-service saves it. After persisting the record, the service publishes a `WorkoutCompletedEvent` to RabbitMQ: `{ userId, workoutId, workoutType: "RUN", distanceMeters: 5000, durationSeconds: 1725, avgHeartRate: 172, avgPaceSecondsPerKm: 345, startTime: "2026-03-23T07:15:00Z" }`.

The AI Coach Agent consumes the event asynchronously. It then calls `GET /api/v1/workouts?userId={alexId}&from=2026-02-23&type=RUN&limit=50` to retrieve Alex's last 4 weeks of running history. It analyses the aggregate HR and pace data across all sessions and generates a coaching recommendation: "16 of your last 17 runs were above Zone 2. This week's plan: 3 Zone 2 runs at 6:30/km target pace."

The workout-service never needs to know the AI coach exists — it publishes events and answers queries. The coach does the interpretation.

*This journey reveals requirements for: RabbitMQ WorkoutCompletedEvent publishing, filtered workout list endpoint (by userId, date range, type), consistent aggregate metric fields the coach can reason over.*

---

### Journey Requirements Summary

| Journey | Core Capabilities Required |
|---|---|
| Alex — success path | POST workout, GET history (paginated), GET summary, JWT auth, aggregate metrics storage |
| Alex — error recovery | PUT workout (update), 401/403 error handling, input validation, ownership checks |
| AI Coach Agent | RabbitMQ event publishing, GET filtered history, consistent metric schema |

**Cross-journey observations:**
- Every endpoint requires JWT authentication — no anonymous access
- All data queries must be scoped by `userId` — the ownership model is non-negotiable
- The aggregate metrics schema (avg HR, max HR, avg pace, distance, duration, cadence, elevation) must be consistent and complete from MVP — the AI coach will depend on it
- The event payload must carry enough context for the AI coach to act without additional lookups

## Domain-Specific Requirements

### Compliance & Regulatory

- **GDPR alignment:** Workout and biometric data (heart rate, pace, GPS reference) constitutes personal health data. Users have the right to access, export, and delete their data at any time.
- **No third-party health data sharing:** User biometric and workout data is never shared with, sold to, or accessible by third parties. This applies to HR data, pace history, GPS references, and any derived metrics. No exceptions, including advertising platforms or analytics providers.
- **Data minimisation:** The workout-service stores only the data necessary for coaching and personal tracking — no behavioural profiling beyond training analytics.

### Data Lifecycle & Retention

- **Retention period:** Workout data is retained for a minimum of 3 years from the date of logging to support long-term training history tracking.
- **Cascade deletion:** When a user deletes a workout, all associated data is cascade deleted — including `running_metrics` records and the `metrics_session_id` reference (triggering deletion in the metrics-service when it exists). This is atomic — partial deletion is not permitted.
- **User-informed deletion:** Before a workout deletion is processed, the client must surface a confirmation warning: "Deleting this workout will also permanently remove all associated metrics. This cannot be undone." The workout-service enforces the cascade; the warning is a client responsibility.
- **Account deletion:** When a user account is deleted (handled by auth-service), the workout-service must delete all workouts and associated metrics belonging to that `userId`. This requires the auth-service to publish a `UserDeletedEvent` that the workout-service consumes, or a direct deletion API call between services.

### Technical Constraints

- **Data ownership enforcement:** Every workout record is owned by exactly one `userId`. No cross-user read, write, or delete is permitted — enforced at both the service and repository layers.
- **Encryption:** All data transmitted over the wire uses TLS. Sensitive fields (HR data) are stored in a PostgreSQL database with encryption at rest in production environments.
- **Audit trail:** Workout creation, update, and deletion events are logged with `userId`, `workoutId`, timestamp, and action type for security audit purposes.

### Real-Time Reliability (AI Coach Phase)

Availability, event latency, and delivery guarantee requirements for the Phase 2 AI coaching pipeline are specified in NFR4, NFR14, and NFR16.

### Domain Risk Mitigations

| Risk | Mitigation |
|---|---|
| User deletes workout without understanding consequences | Confirmation warning in client before deletion; cascade is atomic and irreversible |
| Metrics-service data orphaned on workout delete | `metrics_session_id` tracked; deletion event published so metrics-service can clean up |
| Health data exposed via API misconfiguration | All endpoints require JWT; ownership check on every request; integration tests assert 403 on cross-user access |
| Event lost before AI coach consumes it | RabbitMQ durable queues with publisher confirms; dead-letter queue for failed deliveries |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Real-time voice heart rate zone coaching**
No mainstream running app provides live in-ear zone boundary alerts during a run. The current state of the art requires the athlete to glance at a watch or phone — LunFit eliminates that friction entirely by delivering coaching directly to headphones at the moment of a zone crossing. This is a specific, unsolved problem in a large and growing market.

**2. Theory-first progressive coaching**
Existing AI-powered training apps (Garmin Coach, Nike Run Club, Runna) prescribe workouts but rarely explain the sports science behind them. LunFit's AI coach is designed to educate as well as prescribe — explaining *why* Zone 2 matters, *why* 80% of mileage should be easy, and *why* the progressive plan looks the way it does. Athletes who understand their training are more compliant and more likely to stick with it.

**3. Event-driven API composition for real-time coaching**
The backend architecture is itself an innovation for the consumer fitness space. Rather than a monolithic app that tries to do everything, the workout-service acts as a clean event backbone: it stores ground-truth workout data and publishes `WorkoutCompletedEvent` that downstream services (AI coach, metrics-service, future notification service) consume independently. This decoupling means the AI coaching layer can evolve, be replaced, or be A/B tested without touching the workout data layer.

**4. Endurance sports data model from day one**
Most running apps are designed for running and bolt on cycling/swimming as an afterthought, resulting in awkward data models with nullable columns and inconsistent metrics. LunFit's extension table architecture (`running_metrics`, future `cycling_metrics`, `swimming_metrics`) is designed as a triathlon platform from the start — enabling a class of user (triathletes) who are currently underserved by any single app.

### Market Context & Competitive Landscape

- **Strava**: Social fitness tracking, no coaching, no voice agent, no zone training guidance
- **Garmin Connect**: Deep data for Garmin device users, coaching requires a Garmin watch, no voice zone alerts
- **Runna / TrainingPeaks**: Structured training plans, no real-time voice feedback, HR zone analysis is post-run only
- **Nike Run Club**: Audio guided runs with music, but not biometric-responsive — the coach doesn't react to your actual HR in real time

**The gap:** No app combines real-time biometric-responsive voice coaching + progressive zone training education + multi-sport endurance platform architecture.

### Validation Approach

| Innovation | Validation Method |
|---|---|
| Voice zone alerts reduce friction | Compare Zone 2 compliance rate (time-in-zone %) between users with and without voice alerts |
| Theory education improves retention | Track 4-week retention for users who engage with coaching explanations vs those who don't |
| Event-driven API composition | Load test the event pipeline end-to-end before AI coach launch; confirm <100ms event publish time |
| Multi-sport extensibility | Add cycling support without any migration on the `workouts` table — zero schema change validates the model |

### Innovation Risk Mitigation

| Innovation Risk | Mitigation |
|---|---|
| Voice alerts feel annoying rather than helpful | User-configurable alert frequency and zone thresholds; opt-out always available |
| Real-time HR data pipeline has too much latency for voice coaching | Benchmark event pipeline early; streaming architecture decision made before voice coach development begins |
| Triathlon users don't materialise as a segment | Running MVP ships first; cycling/swimming only added if running user retention validates the platform |
| AI coach generates generic advice rather than personalised coaching | AI coach consumes full workout history (not just last run); personalisation validated against a test cohort before broad launch |

## API Backend Specific Requirements

### Authentication Model

- **Method:** Stateless JWT Bearer token validation
- **Header:** `Authorization: Bearer {accessToken}`
- **Validation:** Signature verified using shared `JWT_SECRET` environment variable — no runtime call to auth-service
- **Claims used:** `sub` (userId), `email`
- **All endpoints require authentication** — no public/anonymous access
- **Token expiry:** 401 returned on expired token; client is expected to refresh via auth-service and retry
- **Ownership enforcement:** Every resource operation verifies `workout.userId == authenticatedUserId`; mismatched ownership returns 403

### Endpoint Specifications

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/workouts` | Log a new workout with running metrics | Required |
| `GET` | `/api/v1/workouts` | List workouts — paginated, filterable | Required |
| `GET` | `/api/v1/workouts/{id}` | Get single workout detail | Required |
| `PUT` | `/api/v1/workouts/{id}` | Update a workout (correct mistakes) | Required |
| `DELETE` | `/api/v1/workouts/{id}` | Delete workout + cascade delete metrics | Required |
| `GET` | `/api/v1/workouts/summary` | Aggregate stats (total distance, avg pace, run count) | Required |

**Query parameters for `GET /api/v1/workouts`:**
- `page` (default: 0), `size` (default: 20, max: 100)
- `sort` (default: `-startTime`)
- `type` — filter by workout type (e.g. `RUN`)
- `from`, `to` — ISO 8601 date range filter on `startTime`

### Data Schemas

**POST /api/v1/workouts — Request body:**
```json
{
  "workoutType": "RUN",
  "title": "Morning run",
  "startTime": "2026-03-23T07:00:00Z",
  "endTime": "2026-03-23T07:28:45Z",
  "durationSeconds": 1725,
  "distanceMeters": 5000,
  "avgHeartRate": 172,
  "maxHeartRate": 184,
  "avgPaceSecondsPerKm": 345,
  "elevationGainMeters": 42,
  "avgCadence": 168,
  "notes": "Felt strong today",
  "metricsSessionId": null
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "workoutType": "RUN",
  "title": "Morning run",
  "startTime": "2026-03-23T07:00:00Z",
  "endTime": "2026-03-23T07:28:45Z",
  "durationSeconds": 1725,
  "distanceMeters": 5000,
  "avgHeartRate": 172,
  "maxHeartRate": 184,
  "avgPaceSecondsPerKm": 345,
  "elevationGainMeters": 42,
  "avgCadence": 168,
  "notes": "Felt strong today",
  "metricsSessionId": null,
  "createdAt": "2026-03-23T07:29:00Z",
  "updatedAt": "2026-03-23T07:29:00Z"
}
```

### Error Codes

Follows the auth-service `ErrorResponse` pattern exactly for consistency:

```json
{
  "timestamp": "2026-03-23T07:15:00",
  "status": 400,
  "error": "BAD_REQUEST",
  "message": "distanceMeters must be positive",
  "path": "/api/v1/workouts",
  "errors": [
    { "field": "distanceMeters", "message": "must be greater than 0" }
  ]
}
```

| HTTP Status | Scenario |
|---|---|
| 201 Created | Workout successfully logged |
| 200 OK | Successful GET or PUT |
| 204 No Content | Successful DELETE |
| 400 Bad Request | Validation failure (invalid fields) |
| 401 Unauthorized | Missing or expired JWT |
| 403 Forbidden | Authenticated but accessing another user's workout |
| 404 Not Found | Workout ID does not exist |
| 409 Conflict | Duplicate active workout (business rule: one at a time) |
| 500 Internal Server Error | Unexpected server error |

### Business Rules

- **One active workout at a time:** A user cannot have two overlapping workout `startTime`/`endTime` windows. Attempting to log a workout that overlaps with an existing one returns `409 Conflict`. This is the implicit rate limit — no additional technical rate limiting required at MVP scale (100 users).
- **Ownership immutability:** `userId` on a workout is set at creation from JWT claims and can never be changed via PUT.
- **Cascade delete:** DELETE on a workout atomically removes the workout record and its `running_metrics` row. When metrics-service is live, a `WorkoutDeletedEvent` is published for it to clean up the corresponding session.

### API Documentation

- **Swagger UI** exposed at `/swagger-ui.html` (springdoc-openapi)
- **OpenAPI JSON** available at `/v3/api-docs`
- All endpoints annotated with `@Operation`, `@ApiResponse`, and schema descriptions
- Included in MVP — required for frontend team building the client app

### Implementation Notes

_For architect reference — not prescriptive requirements:_
- Swagger UI via springdoc-openapi; OpenAPI JSON at `/v3/api-docs`
- Jakarta Bean Validation on request DTOs — field errors serialised into `ErrorResponse.errors[]`
- `GlobalExceptionHandler` mirrors auth-service error handling pattern
- Null response fields omitted from JSON output (`@JsonInclude(NON_NULL)`)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Core MVP principle:** Build the smallest possible workout-service that a real user can log a real run with, and that a real AI coach could be wired to tomorrow.

The MVP is deliberately constrained to the data layer. No AI coach, no streaming, no per-sample telemetry. The coaching experience is only as good as the data foundation beneath it — every future feature (voice coaching, zone analysis, training plans) depends on consistent, clean aggregate workout records. Getting that layer right is the full scope of Phase 1.

The MVP does not feel incomplete to the user — a logged run with distance, HR, pace, elevation, and cadence is genuinely useful data. The client app can visualise it. The user gets value. The AI coach integration is a Phase 2 unlock, not a gap.

**Guiding constraints:**
- No features that require another unbuilt service to be useful (metrics-service, AI coach)
- No async infrastructure in Phase 1 (RabbitMQ deferred) — reduces operational complexity for initial deployment
- Schema must be forward-compatible from day one — `metrics_session_id` nullable field, extension table architecture, and event payload shape designed even if publishing is deferred

### MVP Feature Set (Phase 1)

| # | Feature | Rationale |
|---|---|---|
| 1 | JWT authentication (stateless, `JWT_SECRET` shared secret) | Every request requires auth; no feature works without this |
| 2 | `POST /api/v1/workouts` — log a running workout with aggregate metrics | Core value delivery |
| 3 | `GET /api/v1/workouts` — paginated list, filterable by date range and type | Users need to see their history |
| 4 | `GET /api/v1/workouts/{id}` — single workout detail | Detail view and AI coach query target |
| 5 | `PUT /api/v1/workouts/{id}` — correct a workout | Data quality; users make mistakes |
| 6 | `DELETE /api/v1/workouts/{id}` — cascade delete workout + running_metrics | GDPR; data integrity |
| 7 | `GET /api/v1/workouts/summary` — total distance, run count, avg pace | First "value" endpoint; validates training data completeness |
| 8 | `running_metrics` extension table (avg HR, max HR, avg pace, elevation, cadence) | Core training data; AI coach depends on this |
| 9 | `metrics_session_id` nullable reference field | Forward compatibility with metrics-service; zero cost at MVP |
| 10 | Extension table architecture (`workouts` + `running_metrics`) | Future cycling/swimming support with no schema changes to core table |
| 11 | 409 Conflict on overlapping workouts | Business rule; implicit rate limit at MVP scale |
| 12 | Flyway migrations | Schema version control; CI validation against real PostgreSQL |
| 13 | Testcontainers integration tests | Confidence on migrations and data integrity |
| 14 | Swagger UI at `/swagger-ui.html` | Client app team needs this from day one |
| 15 | `ErrorResponse` pattern matching auth-service | Platform consistency; client handles errors uniformly |

**Explicitly OUT of MVP scope:**
- RabbitMQ `WorkoutCompletedEvent` publishing — deferred to Phase 2
- HR zone breakdown (time-in-zone analysis) — requires user-configured HR zones; Phase 2
- Cycling/swimming workout types — extension tables ready; data deferred
- metrics-service integration — `metrics_session_id` field is ready; the service is not
- Redis caching — valid optimisation; unnecessary at <100 users
- Real-time session streaming (WebSocket) — prerequisite for voice coaching; Phase 3

### Post-MVP Features (Phased Roadmap)

#### Phase 2 — Growth (AI Coach Foundation)

_Trigger: 100 active users logging consistently; AI coach development begins_

| Feature | Dependency | Notes |
|---|---|---|
| RabbitMQ `WorkoutCompletedEvent` publishing | RabbitMQ deployed | Durable queue, publisher confirms, dead-letter queue |
| `WorkoutDeletedEvent` publishing | RabbitMQ deployed | metrics-service cleanup trigger |
| `UserDeletedEvent` consumer | auth-service publishes event | Account deletion cascade |
| Heart rate zone breakdown per workout | User HR zone configuration | Time-in-Zone 1–5 per session |
| Redis `@Cacheable` for summary endpoint | Redis deployed | Performance at scale |
| metrics-service linkage activation | metrics-service built | `metrics_session_id` already in schema |
| Cycling workout support (`cycling_metrics` table) | New Flyway migration | Zero changes to `workouts` table |

#### Phase 3 — Vision (Voice Coaching & Triathlon)

_Trigger: AI coach live and validated; running retention >40% at week 4_

| Feature | Dependency |
|---|---|
| Real-time session WebSocket streaming | Infrastructure decision (WebSocket vs SSE) |
| Voice HR zone alert integration | AI coach agent built |
| Swimming workout support (`swimming_metrics`) | Phase 2 cycling pattern proven |
| Wearable FIT/GPX import | File parsing service |
| Strava sync | Strava API integration |

### Risk Mitigation Strategy

| Risk | Probability | Impact | Mitigation | Phase |
|---|---|---|---|---|
| metrics-service not ready when workout-service ships | High | Low | `metrics_session_id` is nullable; workout-service works standalone | Phase 1 |
| RabbitMQ adds operational complexity before user base justifies it | High | Medium | Deferred to Phase 2; event shape designed now, wired later | Phase 2 |
| HR zone analysis requires user profile data not yet modelled | Medium | Medium | Phase 2 dependency on user HR zone config; not needed for data logging | Phase 2 |
| Cycling/swimming demand doesn't materialise | Medium | Low | Extension tables cost nothing until populated; no wasted investment | Phase 2+ |
| 409 Conflict logic too strict on multi-device edge cases | Low | Low | Validate with real users in Phase 1; rule can be relaxed if needed | Phase 1 |

## Functional Requirements

### Workout Logging

- **FR1:** Authenticated users can log a running workout with a start time, end time, distance, and duration
- **FR2:** Authenticated users can include running-specific aggregate metrics when logging a workout (average heart rate, max heart rate, average pace, elevation gain, average cadence)
- **FR3:** Authenticated users can optionally include a title and freeform notes on a workout
- **FR4:** Authenticated users can include a metrics session reference on a workout for future linkage to a per-sample telemetry service
- **FR5:** The system prevents a user from logging a workout that overlaps in time with an existing workout for the same user

### Workout Retrieval & History

- **FR6:** Authenticated users can retrieve a paginated list of their own workouts
- **FR7:** Authenticated users can filter their workout list by date range
- **FR8:** Authenticated users can filter their workout list by workout type
- **FR9:** Authenticated users can control the sort order of their workout list
- **FR10:** Authenticated users can retrieve the full detail of a single workout they own

### Workout Modification

- **FR11:** Authenticated users can update the fields of a workout they own
- **FR12:** The system prevents users from modifying the ownership identity of a workout
- **FR13:** Authenticated users can delete a workout they own
- **FR14:** The system atomically removes all associated type-specific metrics records when a workout is deleted

### Training Data Analytics

- **FR15:** Authenticated users can retrieve an aggregate training summary across all their workouts (total distance, total session count, average pace)

### Identity & Access Control

- **FR16:** All workout operations require a valid JWT bearer token
- **FR17:** The system rejects requests with expired or invalid JWT tokens
- **FR18:** The system prevents users from accessing, modifying, or deleting workouts owned by other users
- **FR19:** The system derives and permanently assigns workout ownership from JWT claims at creation time

### Data Lifecycle & Compliance

- **FR20:** Users can delete any individual workout along with all associated data
- **FR21:** The system retains workout data for a minimum of 3 years from the date of logging
- **FR22:** The system records an audit log entry for every workout creation, update, and deletion event
- **FR23:** The system supports bulk removal of all workouts belonging to a user when an account is deleted
- **FR24:** Workout and biometric data is never transmitted to or accessible by third-party systems

### API Discoverability & Error Handling

- **FR25:** API consumers can browse all available endpoints, request/response schemas, and example payloads through an auto-generated interactive documentation interface
- **FR26:** The system returns structured error responses with field-level detail for all validation failures, and consistent error codes across all error scenarios

### System Event Integration _(Growth Phase)_

- **FR27:** The system publishes a workout completion event when a workout is successfully saved, carrying sufficient context for downstream consumers to act without additional lookups
- **FR28:** The system publishes a workout deletion event when a workout is deleted, enabling downstream services to clean up associated data
- **FR29:** The system can consume an account deletion event from the auth-service to cascade-remove all workouts for a given user

## Non-Functional Requirements

### Performance

- **NFR1:** `POST /api/v1/workouts` responds within 200ms at p95 under normal load
- **NFR2:** `GET /api/v1/workouts` (paginated list) responds within 100ms at p95
- **NFR3:** `GET /api/v1/workouts/summary` responds within 50ms at p95
- **NFR4:** When the AI coach pipeline is active (Phase 2), the workout-service contributes no more than 100ms to the end-to-end event latency (time from DB write to `WorkoutCompletedEvent` publish)

### Security

- **NFR5:** All data in transit uses TLS — no plaintext HTTP in any environment
- **NFR6:** Heart rate and biometric data is stored with encryption at rest in production environments
- **NFR7:** JWT signature validation is performed on every request — no request bypasses authentication
- **NFR8:** Ownership checks are enforced at both the service layer and repository layer, not just the controller
- **NFR9:** No user biometric or workout data appears in application logs, monitoring systems, or error tracking tools
- **NFR10:** Users have the right to access, export, and delete all their workout data (GDPR alignment)

### Scalability

- **NFR11:** The service supports 100+ concurrent users without response time degradation beyond p95 targets
- **NFR12:** The service is stateless — any number of instances can be deployed behind a load balancer without session affinity
- **NFR13:** The database schema supports adding new workout types without changes to the core `workouts` table

### Reliability

- **NFR14:** The workout-service maintains 99.9% uptime — service unavailability prevents workout logging and breaks the coaching experience
- **NFR15:** All Flyway migrations are validated against a real PostgreSQL instance on every CI run
- **NFR16:** When RabbitMQ is active (Phase 2), `WorkoutCompletedEvent` is published with durable queues and publisher confirms — lost events are not acceptable
- **NFR17:** The CI pipeline maintains 100% pass rate on the main branch before any merge

### Data Integrity

- **NFR18:** Zero cross-user data access incidents — integration tests explicitly assert 403 on cross-user access attempts
- **NFR19:** Workout deletion is atomic — either the workout and all associated metrics are removed, or nothing is removed
- **NFR20:** Service layer test coverage is ≥80% for business logic paths

### Integration

- **NFR21:** API error response format is consistent with the auth-service `ErrorResponse` pattern across all endpoints
- **NFR22:** OpenAPI schema is always in sync with the actual implementation — generated from code annotations, not maintained manually
