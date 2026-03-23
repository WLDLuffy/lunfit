# Implementation Plan: Email-Based Authentication

**Feature**: Email-Based Authentication
**Branch**: 001-email-auth
**Created**: 2026-01-01
**Status**: Planning

## Technical Context

### Technology Stack

**Backend Framework**:
- Java Spring Boot 3.2.x (latest stable as of January 2025)
- Spring Security 6.2.x for authentication/authorization
- Spring Data JPA for database access
- Spring Web for REST API
- Spring Mail for email sending

**Database**:
- PostgreSQL 16.x (latest stable)
- Flyway for database migrations

**Security**:
- BCrypt for password hashing
- JWT (JSON Web Tokens) for access tokens
- Secure random tokens for refresh tokens and email verification
- HTTPS for all communications (deployment concern)

**Email Service**:
- Spring Mail with SMTP configuration
- Support for SendGrid, Amazon SES, or standard SMTP servers
- Asynchronous email sending to avoid blocking registration flow

**Build & Dependencies**:
- Maven or Gradle (recommend Gradle for modern Spring Boot)
- Java 17 or 21 LTS

### Architecture Decisions

**Authentication Flow**:
1. Registration creates user in PENDING state
2. Verification email sent asynchronously
3. User clicks link → token validated → account activated (ACTIVE state)
4. Login returns access token (1 hour) + refresh token (long-lived)
5. Access token renewal via refresh token endpoint
6. New device login invalidates previous refresh token

**Database Schema Design**:
- **users table**: Core user information and verification status
- **auth_credentials table**: Hashed passwords and refresh tokens (separate for security)
- **verification_tokens table**: Email verification tokens with expiration
- Indexes on email (unique), verification tokens, refresh tokens

**API Design**:
- RESTful endpoints following Spring Boot conventions
- `/api/v1/auth/*` namespace for all authentication endpoints
- Standard HTTP status codes and error responses
- Request/response DTOs for input validation and output formatting

**Token Strategy**:
- Access tokens: JWT with 1-hour expiration, signed with HS256
- Refresh tokens: Random UUID stored in database, invalidated on logout or new device login
- Verification tokens: Cryptographically secure random tokens, 1-hour expiration

**Email Templates**:
- HTML email templates for verification emails
- Thymeleaf for email templating
- Configurable base URL for verification links

### Technical Constraints

- Must support concurrent user registrations and logins (100+ simultaneous)
- Database connection pooling required (HikariCP - default in Spring Boot)
- Email sending must be async to avoid blocking
- All passwords must be hashed with BCrypt (cost factor 10-12)
- Session invalidation must be immediate when user logs in on new device
- Unverified account cleanup via scheduled job (Spring @Scheduled)

### Open Questions / Research Needed

None - all technical decisions have been made based on user input and Spring Boot best practices.

## Constitution Check

**Note**: No project constitution file exists yet. This section will be populated when `.specify/memory/constitution.md` is created.

### Pre-Implementation Gates

- [x] Specification complete and approved
- [x] Email verification flow clarified and documented
- [x] Technology stack chosen (Java Spring Boot + PostgreSQL)
- [x] Database schema designed (users, auth_credentials, verification_tokens)
- [ ] Research best practices completed (pending Phase 0)
- [ ] Data model finalized (pending Phase 1)
- [ ] API contracts defined (pending Phase 1)

### Post-Implementation Validation

Will be completed after Phase 1 design artifacts are generated.

## Phase 0: Research & Technology Decisions

### Research Topics

1. **Spring Security 6.x JWT Implementation**
   - Best practices for JWT generation and validation
   - Refresh token rotation strategies
   - Token storage and invalidation patterns

2. **BCrypt Password Hashing**
   - Optimal cost factor for security vs performance
   - Salt generation and storage

3. **PostgreSQL Schema Design for Auth Systems**
   - Indexing strategies for email lookups and token validation
   - Partitioning strategies for token tables (if needed at scale)
   - Cascade delete vs soft delete for user accounts

4. **Spring Boot Email Verification Patterns**
   - Async email sending with @Async
   - Email template management with Thymeleaf
   - Retry and error handling for email delivery failures

5. **Session Invalidation Strategies**
   - Single active session enforcement
   - Refresh token blacklisting vs database deletion

6. **Scheduled Jobs for Account Cleanup**
   - Spring @Scheduled configuration
   - Database cleanup query optimization
   - Handling edge cases (user verifying while cleanup runs)

**Output**: `research.md` with decisions, rationales, and alternatives

## Phase 1: Design Artifacts

### Data Model

**Output**: `data-model.md` with:
- Complete database schema (tables, columns, types, constraints)
- Entity relationships and foreign keys
- Indexes for performance
- Sample Flyway migration scripts

**Key Entities**:
1. `users` - User accounts with verification status
2. `auth_credentials` - Passwords and refresh tokens
3. `verification_tokens` - Email verification tokens

### API Contracts

**Output**: `contracts/openapi.yaml` with:
- All authentication endpoints
- Request/response schemas
- Error response formats
- Security schemes (Bearer token)

**Endpoints**:
- POST `/api/v1/auth/register` - User registration
- GET `/api/v1/auth/verify?token=xxx` - Email verification
- POST `/api/v1/auth/verify/resend` - Resend verification email
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/refresh` - Refresh access token
- POST `/api/v1/auth/logout` - User logout

### Quickstart Guide

**Output**: `quickstart.md` with:
- Local development setup instructions
- Database setup (PostgreSQL via Docker)
- Application configuration (application.yml)
- How to run the application
- How to test authentication endpoints
- Environment variables needed

## Implementation Notes

### Project Structure

```
auth-service/
├── src/
│   ├── main/
│   │   ├── java/com/lunfit/authservice/
│   │   │   ├── config/          # Security, Email, Async configs
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/             # Request/Response DTOs
│   │   │   ├── entity/          # JPA entities
│   │   │   ├── repository/      # JPA repositories
│   │   │   ├── service/         # Business logic
│   │   │   ├── security/        # JWT, token services
│   │   │   ├── exception/       # Custom exceptions
│   │   │   └── scheduled/       # Cleanup jobs
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── db/migration/    # Flyway migrations
│   │       └── templates/       # Email templates
│   └── test/
├── build.gradle
└── README.md
```

### Security Considerations

- Passwords never stored in plain text (BCrypt hashing)
- Verification tokens are cryptographically secure random
- JWT secrets must be externalized (environment variables)
- CORS configuration for frontend integration
- Rate limiting on registration and login endpoints (consider Spring Boot rate limiter or custom filter)
- SQL injection prevention via JPA parameter binding
- Input validation on all endpoints (Jakarta Validation)

### Performance Considerations

- Database connection pooling (HikariCP default settings)
- Async email sending to avoid blocking
- Index on users.email for fast lookups
- Index on verification_tokens.token for fast validation
- Scheduled cleanup job runs off-peak (configurable)
- Consider caching for frequently accessed user data (optional for MVP)

### Error Handling

- Global exception handler (@ControllerAdvice)
- Consistent error response format (RFC 7807 Problem Details)
- Specific error codes for client handling
- Logging for debugging and monitoring

### Testing Strategy

- Unit tests for services and security components
- Integration tests for repository layer
- API tests for controllers (MockMvc or RestAssured)
- Security tests for authentication flows
- Email sending tests (mock SMTP server)

## Next Steps

After this planning phase:
1. Generate `research.md` (Phase 0)
2. Generate `data-model.md` (Phase 1)
3. Generate `contracts/openapi.yaml` (Phase 1)
4. Generate `quickstart.md` (Phase 1)
5. Update `.claude/agent-context.md` with technology decisions
6. Proceed to `/speckit.tasks` to break down implementation tasks
