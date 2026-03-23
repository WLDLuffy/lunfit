# Agent Context: LunFit Auth Service

**Project**: LunFit Exercise Tracking Application - Authentication Service
**Repository**: auth-service
**Last Updated**: 2026-01-01

## Project Overview

The LunFit auth-service is a dedicated authentication microservice for the LunFit exercise tracking platform. It provides email-based authentication with email verification, JWT token management, and session control.

## Technology Stack

### Backend Framework
- **Java**: 17 LTS (or 21 LTS)
- **Spring Boot**: 3.2.x (latest stable)
- **Spring Security**: 6.2.x
- **Spring Data JPA**: For database access
- **Spring Mail**: For email sending
- **Build Tool**: Gradle 8.5+ (preferred) or Maven

### Database
- **PostgreSQL**: 16.x
- **Flyway**: Database migrations and version control
- **HikariCP**: Connection pooling (Spring Boot default)

### Security & Authentication
- **BCrypt**: Password hashing (cost factor 12)
- **JWT (JJWT 0.12.5)**: Access tokens with HS256 signing
- **Refresh Tokens**: UUID-based, database-backed
- **Verification Tokens**: Cryptographically secure random tokens

### Email
- **Spring Mail**: SMTP integration
- **Thymeleaf**: Email template engine
- **Async Execution**: Non-blocking email sending

### Development Tools
- **Docker Compose**: Local PostgreSQL setup
- **MailHog**: Local email testing (optional)
- **Postman/curl**: API testing

## Architecture Patterns

### Authentication Flow
1. **Registration** → User created in PENDING state → Verification email sent async
2. **Email Verification** → Token validated → User activated (ACTIVE state)
3. **Login** → Credentials verified → Access token (JWT, 1hr) + Refresh token (30 days) returned
4. **Token Refresh** → Old refresh token validated → New access + refresh tokens issued (token rotation)
5. **Logout** → Refresh token invalidated

### Security Patterns
- **Single Active Session**: New device login invalidates previous refresh token
- **Password Security**: BCrypt hashing, min 8 chars with complexity requirements
- **Token Expiration**: Access tokens 1 hour, refresh tokens 30 days
- **Email Verification Required**: Users must verify email before login
- **Rate Limiting**: Max 5 verification email resends per 24 hours

### Database Design
- **users**: User profiles and verification status
- **auth_credentials**: Passwords (hashed) and refresh tokens (separate for security)
- **verification_tokens**: Email verification tokens (1-hour expiration)

### Async Operations
- Email sending is asynchronous to avoid blocking registration
- ThreadPoolTaskExecutor configured for email tasks
- Scheduled cleanup job for unverified accounts (daily at 2 AM)

## Key Features

### Implemented (Current Scope)
- ✅ Email/password registration
- ✅ Email verification with expiring links (1 hour)
- ✅ Email verification resend (rate limited)
- ✅ Login with JWT access + refresh tokens
- ✅ Token refresh with rotation
- ✅ Logout (refresh token invalidation)
- ✅ Single active session per user
- ✅ Unverified account cleanup (30 days)

### Future Enhancements
- ⏳ Password reset/recovery
- ⏳ Social login (Google, Apple SSO)
- ⏳ Two-factor authentication (2FA)
- ⏳ Account deletion
- ⏳ Role-based access control (RBAC)

## Project Structure

```
auth-service/
├── src/main/java/com/lunfit/authservice/
│   ├── config/          # Security, JWT, Async, Email configs
│   ├── controller/      # REST endpoints (/api/v1/auth/*)
│   ├── dto/            # Request/Response DTOs
│   ├── entity/         # JPA entities (User, AuthCredential, VerificationToken)
│   ├── repository/     # JPA repositories
│   ├── service/        # Business logic (AuthService, EmailService, TokenService)
│   ├── security/       # JWT filter, token provider
│   ├── exception/      # Custom exceptions and global handler
│   └── scheduled/      # Cleanup jobs
├── src/main/resources/
│   ├── application.yml
│   ├── db/migration/   # Flyway SQL migrations
│   └── templates/      # Email templates (Thymeleaf)
└── src/test/           # Unit and integration tests
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout (requires Bearer token)

### Email Verification
- `GET /api/v1/auth/verify?token={token}` - Verify email
- `POST /api/v1/auth/verify/resend` - Resend verification email

## Configuration

### Environment Variables (Required)
```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/authservice
DATABASE_USERNAME=authservice_user
DATABASE_PASSWORD=<secret>

# JWT
JWT_SECRET=<256-bit-secret>
JWT_ACCESS_TOKEN_EXPIRY=3600000  # 1 hour
JWT_REFRESH_TOKEN_EXPIRY=2592000000  # 30 days

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<email>
MAIL_PASSWORD=<app-password>
MAIL_FROM=noreply@lunfit.com

# Application
BASE_URL=https://lunfit.com  # For verification links
```

## Development Workflow

### Local Setup
1. Start PostgreSQL: `docker-compose up -d`
2. Set environment variables in `.env` file
3. Run application: `./gradlew bootRun`
4. Test endpoints with Postman/curl

### Database Migrations
- Flyway automatically runs migrations on startup
- Manual: `./gradlew flywayMigrate`
- Rollback: `./gradlew flywayClean` (dev only!)

### Testing
- Unit tests: `./gradlew test`
- Integration tests: `./gradlew integrationTest`

## Key Implementation Details

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### JWT Claims
- `sub`: User ID
- `email`: User email
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

### Email Verification
- Tokens expire after 1 hour
- Old tokens deleted when new one generated
- Max 5 resend attempts per 24 hours
- Unverified accounts deleted after 30 days

### Session Management
- One active refresh token per user
- New login invalidates previous token
- Refresh token rotation on each refresh

## Common Tasks

### Add a new endpoint
1. Define DTO in `dto/` package
2. Add method to service class
3. Create controller endpoint
4. Add to OpenAPI spec (`specs/001-email-auth/contracts/openapi.yaml`)
5. Write tests

### Update database schema
1. Create new Flyway migration: `V{N}__{description}.sql`
2. Update JPA entity
3. Run migration: `./gradlew flywayMigrate`
4. Update data-model documentation

### Change token expiration
1. Update `application.yml`: `jwt.access-token-expiry` or `jwt.refresh-token-expiry`
2. Restart application

## Security Considerations

### DO
- ✅ Hash all passwords with BCrypt
- ✅ Validate all user input (Jakarta Validation)
- ✅ Use parameterized queries (JPA handles this)
- ✅ Externalize secrets (environment variables)
- ✅ Log security events (login failures, token issues)
- ✅ Use HTTPS in production
- ✅ Implement CORS for frontend integration

### DON'T
- ❌ Store passwords in plain text
- ❌ Log sensitive data (passwords, tokens)
- ❌ Hard-code secrets in source code
- ❌ Skip input validation
- ❌ Expose detailed error messages to clients
- ❌ Allow unlimited login attempts (consider rate limiting)

## Troubleshooting

### Email not sending
- Check MAIL_USERNAME and MAIL_PASSWORD
- For Gmail: use App Password, not main password
- Check logs for SMTP errors
- Use MailHog for local testing

### Database connection failed
- Verify PostgreSQL is running: `docker-compose ps`
- Check credentials match in application.yml
- Ensure port 5432 is available

### JWT token invalid
- Check JWT_SECRET is set (min 256 bits)
- Verify token hasn't expired
- Use refresh token to get new access token

## Documentation References

- **Specification**: `specs/001-email-auth/spec.md`
- **Implementation Plan**: `specs/001-email-auth/plan.md`
- **Data Model**: `specs/001-email-auth/data-model.md`
- **API Contracts**: `specs/001-email-auth/contracts/openapi.yaml`
- **Quickstart Guide**: `specs/001-email-auth/quickstart.md`
- **Research Decisions**: `specs/001-email-auth/research.md`

## Integration Points

### For Other Services
This auth service provides authentication for other LunFit services:
- Services validate JWT access tokens
- Services can introspect tokens to get user ID and email
- Services should handle 401 Unauthorized responses gracefully

### Frontend Integration
- Frontend stores access token (memory) and refresh token (httpOnly cookie recommended)
- Frontend includes `Authorization: Bearer {accessToken}` header
- Frontend refreshes token before expiration
- Frontend handles verification flow (email link redirect)

## Performance Targets

- Registration API: < 200ms (before async email)
- Login API: < 500ms (including BCrypt)
- Token Refresh: < 100ms
- Email Verification: < 100ms
- Supports 100+ concurrent requests

## Next Steps (Implementation)

After planning phase, proceed to implementation:
1. Generate Spring Boot project structure
2. Implement entities and repositories
3. Implement services (AuthService, EmailService, TokenService)
4. Implement security configuration and JWT filter
5. Implement controllers
6. Write Flyway migrations
7. Create email templates
8. Write tests
9. Set up Docker Compose for local dev
10. Document deployment process

---

**Note**: This context is specific to the auth-service. For other LunFit services, refer to their respective agent context files.
