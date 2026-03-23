# Implementation Tasks: Email-Based Authentication

**Feature**: Email-Based Authentication
**Branch**: 001-email-auth
**Created**: 2026-01-01
**Tech Stack**: Java Spring Boot 3.2.x + PostgreSQL 16.x

---

## Overview

This task breakdown organizes implementation by user story to enable independent development and testing. Each user story represents a complete, testable increment of functionality.

**User Stories (Priority Order)**:
1. **US1 (P1)**: New User Registration with Email Verification
2. **US2 (P1)**: Existing User Login
3. **US3 (P1)**: Authenticated Access to App Features
4. **US4 (P3)**: SSO Authentication Preparation (Future - not implemented in this phase)

**MVP Scope**: User Story 1 only (registration + email verification)

**Total Estimated Tasks**: 67 tasks across 6 phases

---

## Phase 1: Project Setup & Infrastructure

**Goal**: Initialize Spring Boot project with all dependencies and base configuration.

**Tasks**:

- [ ] T001 Create Spring Boot 3.2.x project using Spring Initializr with dependencies: Web, Security, Data JPA, PostgreSQL Driver, Flyway, Mail, Validation
- [ ] T002 Configure build.gradle with all required dependencies (JJWT 0.12.5, Thymeleaf, Lombok if desired)
- [ ] T003 Create base project structure: com.lunfit.authservice with subdirectories (config, controller, dto, entity, repository, service, security, exception, scheduled)
- [ ] T004 Create application.yml with database, JPA, Flyway, mail, and JWT configuration placeholders
- [ ] T005 Create application-dev.yml for development-specific settings (SQL logging, debug mode)
- [ ] T006 Create docker-compose.yml for local PostgreSQL 16.x database with health checks
- [ ] T007 Create .env.example file documenting all required environment variables
- [ ] T008 Create .gitignore for Java/Spring Boot (IDE files, build artifacts, .env)
- [ ] T009 Create README.md with project overview and setup instructions reference
- [ ] T010 [P] Create AuthServiceApplication.java main class with @SpringBootApplication annotation
- [ ] T011 [P] Create global exception handler in src/main/java/com/lunfit/authservice/exception/GlobalExceptionHandler.java
- [ ] T012 [P] Create custom exception classes: EmailAlreadyExistsException, InvalidCredentialsException, TokenExpiredException, VerificationRequiredException in src/main/java/com/lunfit/authservice/exception/
- [ ] T013 [P] Create ErrorResponse DTO in src/main/java/com/lunfit/authservice/dto/response/ErrorResponse.java

**Completion Criteria**:
- Project builds successfully with `./gradlew build`
- Docker Compose starts PostgreSQL successfully
- Application starts without errors (no database migrations yet)

---

## Phase 2: Foundational Layer

**Goal**: Set up database schema, core entities, security configuration, and shared services that ALL user stories depend on.

**Database Schema Tasks**:

- [ ] T014 Create Flyway migration V1__create_users_table.sql with users table (id, email, status, email_verified, created_at, verified_at, last_login_at, resend_count, last_resend_at) and indexes
- [ ] T015 Create Flyway migration V2__create_auth_credentials_table.sql with auth_credentials table (id, user_id FK, password_hash, refresh_token, refresh_token_expiry, device_info, updated_at) and indexes
- [ ] T016 Create Flyway migration V3__create_verification_tokens_table.sql with verification_tokens table (id, user_id FK, token, token_type, status, created_at, expires_at, used_at) and indexes

**Entity & Repository Tasks**:

- [ ] T017 [P] Create User entity in src/main/java/com/lunfit/authservice/entity/User.java with JPA annotations, UserStatus enum, and @PrePersist hook
- [ ] T018 [P] Create AuthCredential entity in src/main/java/com/lunfit/authservice/entity/AuthCredential.java with @OneToOne to User and @PreUpdate hook
- [ ] T019 [P] Create VerificationToken entity in src/main/java/com/lunfit/authservice/entity/VerificationToken.java with @ManyToOne to User, TokenType/TokenStatus enums, and isExpired() method
- [ ] T020 [P] Create UserRepository interface in src/main/java/com/lunfit/authservice/repository/UserRepository.java extending JpaRepository with custom query methods (findByEmail, deleteByStatusAndCreatedAtBefore)
- [ ] T021 [P] Create AuthCredentialRepository interface in src/main/java/com/lunfit/authservice/repository/AuthCredentialRepository.java with findByRefreshToken method
- [ ] T022 [P] Create VerificationTokenRepository interface in src/main/java/com/lunfit/authservice/repository/VerificationTokenRepository.java with findByToken and deleteByUserIdAndStatus methods

**Security Configuration Tasks**:

- [ ] T023 Create PasswordEncoderConfig in src/main/java/com/lunfit/authservice/config/PasswordEncoderConfig.java with BCrypt(12) bean
- [ ] T024 Create JwtConfig in src/main/java/com/lunfit/authservice/config/JwtConfig.java with @ConfigurationProperties for JWT secret and expiry values
- [ ] T025 Create JwtTokenProvider in src/main/java/com/lunfit/authservice/security/JwtTokenProvider.java with generateAccessToken, validateToken, getUserIdFromToken methods
- [ ] T026 Create JwtAuthenticationFilter in src/main/java/com/lunfit/authservice/security/JwtAuthenticationFilter.java extending OncePerRequestFilter
- [ ] T027 Create SecurityConfig in src/main/java/com/lunfit/authservice/config/SecurityConfig.java with security filter chain, permit /api/v1/auth/** (except logout), authenticated for others

**Async & Email Configuration Tasks**:

- [ ] T028 Create AsyncConfig in src/main/java/com/lunfit/authservice/config/AsyncConfig.java with @EnableAsync and emailTaskExecutor ThreadPoolTaskExecutor bean
- [ ] T029 Create email template verification-email.html in src/main/resources/templates/ with Thymeleaf placeholders for verificationUrl

**Shared Services Tasks**:

- [ ] T030 [P] Create EmailService in src/main/java/com/lunfit/authservice/service/EmailService.java with @Async sendVerificationEmail method using JavaMailSender and Thymeleaf
- [ ] T031 [P] Create TokenService in src/main/java/com/lunfit/authservice/service/TokenService.java with generateSecureToken, createVerificationToken, validateVerificationToken, invalidateToken methods

**Completion Criteria**:
- All Flyway migrations run successfully
- All entities save/retrieve from database
- BCrypt encodes passwords correctly
- JWT tokens generate and validate
- Email service can send emails (test with MailHog)

---

## Phase 3: User Story 1 - Registration & Email Verification

**Goal**: Implement complete user registration flow with email verification.

**Independent Test Criteria**:
- User can register with valid email/password
- Verification email is sent immediately (check logs or MailHog)
- Clicking verification link activates account
- User can resend verification email (rate limited)
- Expired verification links show error and offer resend
- Unverified accounts are cleaned up after 30 days

**Request/Response DTOs**:

- [ ] T032 [P] [US1] Create RegisterRequest DTO in src/main/java/com/lunfit/authservice/dto/request/RegisterRequest.java with @Email and password validation annotations
- [ ] T033 [P] [US1] Create RegisterResponse DTO in src/main/java/com/lunfit/authservice/dto/response/RegisterResponse.java
- [ ] T034 [P] [US1] Create VerifyEmailResponse DTO in src/main/java/com/lunfit/authservice/dto/response/VerifyEmailResponse.java
- [ ] T035 [P] [US1] Create ResendVerificationRequest DTO in src/main/java/com/lunfit/authservice/dto/request/ResendVerificationRequest.java
- [ ] T036 [P] [US1] Create ResendVerificationResponse DTO in src/main/java/com/lunfit/authservice/dto/response/ResendVerificationResponse.java

**Service Layer**:

- [ ] T037 [US1] Create AuthService interface in src/main/java/com/lunfit/authservice/service/AuthService.java with register, verifyEmail, resendVerificationEmail method signatures
- [ ] T038 [US1] Implement AuthServiceImpl in src/main/java/com/lunfit/authservice/service/impl/AuthServiceImpl.java:
  - register method: validate email not exists, hash password, create user (PENDING status), create verification token, send verification email async, return RegisterResponse
  - verifyEmail method: validate token exists and not expired, update user status to ACTIVE, mark token as USED, return VerifyEmailResponse
  - resendVerificationEmail method: validate user exists and PENDING, check resend count < 5 and within 24 hours, delete old tokens, create new token, send email, increment resend count

**Controller Layer**:

- [ ] T039 [US1] Create AuthController in src/main/java/com/lunfit/authservice/controller/AuthController.java with @RestController and @RequestMapping("/api/v1/auth")
- [ ] T040 [US1] Implement POST /api/v1/auth/register endpoint with @Valid RegisterRequest, call authService.register, return 201 Created with RegisterResponse
- [ ] T041 [US1] Implement GET /api/v1/auth/verify endpoint with @RequestParam token, call authService.verifyEmail, return 200 OK with VerifyEmailResponse, handle TokenExpiredException → 400 with resend offer
- [ ] T042 [US1] Implement POST /api/v1/auth/verify/resend endpoint with @Valid ResendVerificationRequest, call authService.resendVerificationEmail, return 200 OK or 429 Too Many Requests if rate limit exceeded

**Scheduled Cleanup Job**:

- [ ] T043 [US1] Create AccountCleanupScheduler in src/main/java/com/lunfit/authservice/scheduled/AccountCleanupScheduler.java with @Scheduled(cron = "0 0 2 * * *") cleanupUnverifiedAccounts method that deletes users with PENDING status and created_at < 30 days ago

**Integration & Testing**:

- [ ] T044 [US1] Manual test registration flow: POST /register → check email → GET /verify?token=xxx → verify user status is ACTIVE in database
- [ ] T045 [US1] Manual test expired token: wait 1 hour or manually expire token → GET /verify → verify 400 error with resend offer
- [ ] T046 [US1] Manual test resend limit: POST /verify/resend 6 times → verify 429 error on 6th attempt
- [ ] T047 [US1] Manual test duplicate email: POST /register with same email twice → verify 409 Conflict on second attempt

**Completion Criteria (US1)**:
✅ User can register and receive verification email
✅ Verification link activates account within 1 hour
✅ Expired links show error and offer resend
✅ Resend is rate limited to 5 attempts per 24 hours
✅ Duplicate email returns 409 Conflict
✅ Unverified accounts cleanup job configured

---

## Phase 4: User Story 2 - User Login

**Goal**: Implement login with JWT access tokens and refresh tokens.

**Independent Test Criteria**:
- Verified user can log in with correct credentials
- Login returns access token (JWT) and refresh token
- Incorrect password returns 401 without revealing email existence
- Unverified user cannot log in (returns error with resend option)
- New device login invalidates previous refresh token

**Request/Response DTOs**:

- [ ] T048 [P] [US2] Create LoginRequest DTO in src/main/java/com/lunfit/authservice/dto/request/LoginRequest.java with email and password fields
- [ ] T049 [P] [US2] Create LoginResponse DTO in src/main/java/com/lunfit/authservice/dto/response/LoginResponse.java with accessToken, refreshToken, tokenType, expiresIn, and UserInfo
- [ ] T050 [P] [US2] Create UserInfo DTO in src/main/java/com/lunfit/authservice/dto/response/UserInfo.java with id, email, emailVerified, status, createdAt, lastLoginAt

**Service Layer**:

- [ ] T051 [US2] Add login method to AuthService interface
- [ ] T052 [US2] Implement login method in AuthServiceImpl:
  - Find user by email (normalized to lowercase), throw InvalidCredentialsException if not found (generic message)
  - Verify password with BCrypt, throw InvalidCredentialsException if incorrect
  - Check user status is ACTIVE, throw VerificationRequiredException if PENDING
  - Generate JWT access token (1 hour expiration) using JwtTokenProvider
  - Generate refresh token (UUID), save to auth_credentials (delete old refresh token if exists), set expiry to 30 days from now
  - Update user.lastLoginAt to current timestamp
  - Return LoginResponse with tokens and UserInfo

**Controller Layer**:

- [ ] T053 [US2] Implement POST /api/v1/auth/login endpoint in AuthController with @Valid LoginRequest, call authService.login, return 200 OK with LoginResponse, handle VerificationRequiredException → 400 with message and resend option, handle InvalidCredentialsException → 401 with generic error

**Integration & Testing**:

- [ ] T054 [US2] Manual test successful login: Register + verify user → POST /login with correct credentials → verify 200 response with accessToken and refreshToken
- [ ] T055 [US2] Manual test invalid password: POST /login with wrong password → verify 401 with generic error message
- [ ] T056 [US2] Manual test unverified user: Register but don't verify → POST /login → verify 400 error suggesting email verification
- [ ] T057 [US2] Manual test single session: Login on "device 1" (save refresh token) → login on "device 2" → verify device 1's refresh token is deleted from database

**Completion Criteria (US2)**:
✅ Verified users can log in successfully
✅ Access token (JWT) and refresh token returned
✅ Invalid credentials return 401 with generic message
✅ Unverified users get 400 with verification reminder
✅ New device login invalidates previous session

---

## Phase 5: User Story 3 - Token Refresh & Logout

**Goal**: Implement token refresh for seamless sessions and logout functionality.

**Independent Test Criteria**:
- User can refresh access token using valid refresh token
- Refresh returns new access token AND new refresh token (token rotation)
- Old refresh token is invalidated after refresh
- User can log out and refresh token is deleted
- Expired or invalid refresh tokens return 401

**Request/Response DTOs**:

- [ ] T058 [P] [US3] Create RefreshTokenRequest DTO in src/main/java/com/lunfit/authservice/dto/request/RefreshTokenRequest.java with refreshToken field
- [ ] T059 [P] [US3] Create RefreshTokenResponse DTO in src/main/java/com/lunfit/authservice/dto/response/RefreshTokenResponse.java with accessToken, refreshToken, tokenType, expiresIn
- [ ] T060 [P] [US3] Create LogoutResponse DTO in src/main/java/com/lunfit/authservice/dto/response/LogoutResponse.java with message field

**Service Layer**:

- [ ] T061 [US3] Add refreshAccessToken and logout methods to AuthService interface
- [ ] T062 [US3] Implement refreshAccessToken method in AuthServiceImpl:
  - Find AuthCredential by refreshToken, throw InvalidCredentialsException if not found
  - Check refreshTokenExpiry > now, throw TokenExpiredException if expired
  - Verify user status is ACTIVE
  - Generate new JWT access token (1 hour)
  - Generate new refresh token (UUID), delete old refresh token, save new one with 30-day expiry
  - Return RefreshTokenResponse
- [ ] T063 [US3] Implement logout method in AuthServiceImpl:
  - Extract userId from JWT token (passed from controller)
  - Find user, update auth_credentials to set refresh_token = null and refresh_token_expiry = null
  - Return LogoutResponse with success message

**Controller Layer**:

- [ ] T064 [US3] Implement POST /api/v1/auth/refresh endpoint in AuthController with @Valid RefreshTokenRequest, call authService.refreshAccessToken, return 200 OK or 401 Unauthorized if invalid/expired
- [ ] T065 [US3] Implement POST /api/v1/auth/logout endpoint in AuthController (requires @AuthenticationPrincipal or extract user from JWT), call authService.logout, return 200 OK with LogoutResponse

**Integration & Testing**:

- [ ] T066 [US3] Manual test token refresh: Login → wait a few seconds → POST /refresh with refreshToken → verify new access token and new refresh token returned, old refresh token invalid
- [ ] T067 [US3] Manual test logout: Login → POST /logout with Bearer token → verify refresh token deleted from database → attempt to refresh with old token → verify 401 error

**Completion Criteria (US3)**:
✅ Access tokens can be refreshed with valid refresh token
✅ Token rotation works (new refresh token on each refresh)
✅ Old refresh tokens are invalidated after refresh
✅ Logout successfully invalidates refresh token
✅ Expired/invalid refresh tokens return 401

---

## Dependencies & Execution Order

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL STORIES
    ↓
    ├─→ Phase 3 (US1: Registration) ← MVP, can be implemented first
    │   ↓
    ├─→ Phase 4 (US2: Login) ← depends on US1 for user accounts
    │   ↓
    └─→ Phase 5 (US3: Token Refresh/Logout) ← depends on US2 for tokens
```

**Critical Path**: Setup → Foundational → US1 → US2 → US3

**Independent Stories**:
- US1 can be developed and tested independently (just needs Phase 2 complete)
- US2 requires US1 for verified users to exist
- US3 requires US2 for tokens to refresh

### Parallel Execution Opportunities

**Within Phase 2 (Foundational)**:
- T017-T019 (Entities) can be done in parallel
- T020-T022 (Repositories) can be done in parallel after entities
- T023-T027 (Security configs) can be done in parallel
- T030-T031 (Services) can be done in parallel
- T032-T036 (DTOs) can be done in parallel

**Within Phase 3 (US1)**:
- T032-T036 (all DTOs) can be done in parallel
- After service layer complete: T040-T042 (all endpoints) can be done in parallel
- T044-T047 (manual tests) can be done in parallel

**Within Phase 4 (US2)**:
- T048-T050 (all DTOs) can be done in parallel
- After T052 complete: T053 can be done

**Within Phase 5 (US3)**:
- T058-T060 (all DTOs) can be done in parallel
- After T062-T063 complete: T064-T065 can be done in parallel

---

## Implementation Strategy

### MVP Delivery (Recommended)

**Phase 1 → Phase 2 → Phase 3 (US1 only)**

This gives you:
- ✅ User registration
- ✅ Email verification
- ✅ Complete authentication infrastructure
- ✅ Testable, deployable increment

After MVP validation, add:
- **Increment 2**: Phase 4 (US2 - Login)
- **Increment 3**: Phase 5 (US3 - Refresh/Logout)

### Full Feature Delivery

Complete all phases sequentially: Phase 1 → 2 → 3 → 4 → 5

---

## Task Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|------------|------------|----------------|
| Phase 1 | Setup | 13 | 3 (T010-T013) |
| Phase 2 | Foundational | 18 | 12 (T017-T022, T030-T031) |
| Phase 3 | US1 (Registration) | 16 | 5 (T032-T036) |
| Phase 4 | US2 (Login) | 10 | 3 (T048-T050) |
| Phase 5 | US3 (Refresh/Logout) | 10 | 3 (T058-T060) |
| **Total** | | **67** | **26** |

---

## Task Format Validation

✅ All tasks follow format: `- [ ] T### [P] [US#] Description with file path`
✅ All user story tasks labeled with [US1], [US2], or [US3]
✅ All parallelizable tasks marked with [P]
✅ All file paths specified where applicable
✅ Sequential task numbering T001-T067

---

## Next Steps

1. Review and approve this task breakdown
2. Choose implementation strategy (MVP vs Full Feature)
3. Begin with Phase 1 (Project Setup)
4. After each phase, verify completion criteria before proceeding
5. Run manual tests as specified to validate each user story

**Recommended Start**: Execute Phase 1 tasks T001-T013 to initialize the project.
