# Quickstart Guide: LunFit Authentication Service

**Feature**: Email-Based Authentication
**Created**: 2026-01-01
**Tech Stack**: Java Spring Boot 3.2.x + PostgreSQL 16.x

## Prerequisites

- Java 17 or 21 (LTS)
- Docker and Docker Compose
- Maven or Gradle (Gradle recommended)
- IDE (IntelliJ IDEA, VS Code, Eclipse)
- Postman or curl for API testing

## Local Development Setup

### 1. Clone and Navigate to Project

```bash
cd auth-service
```

### 2. Start PostgreSQL Database

Using Docker Compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: authservice-db
    environment:
      POSTGRES_DB: authservice
      POSTGRES_USER: authservice_user
      POSTGRES_PASSWORD: authservice_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U authservice_user -d authservice"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Start the database:

```bash
docker-compose up -d
```

Verify database is running:

```bash
docker-compose ps
# Should show postgres container running and healthy
```

### 3. Configure Application

Create `src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://localhost:5432/authservice
    username: authservice_user
    password: authservice_pass
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate  # Flyway handles schema
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  mail:
    host: ${MAIL_HOST:smtp.gmail.com}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
    from: ${MAIL_FROM:noreply@lunfit.com}

  task:
    execution:
      pool:
        core-size: 2
        max-size: 5
        queue-capacity: 100
    scheduling:
      pool:
        size: 2

logging:
  level:
    com.lunfit.authservice: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG

server:
  port: 8080

# JWT Configuration
jwt:
  secret: ${JWT_SECRET:YourSuperSecretKeyThatShouldBeAtLeast256BitsLongForHS256AlgorithmSecurity}
  access-token-expiry: 3600000  # 1 hour in milliseconds
  refresh-token-expiry: 2592000000  # 30 days in milliseconds

# Application Configuration
app:
  base-url: ${BASE_URL:http://localhost:8080}
  verification-token-expiry: 3600  # 1 hour in seconds
  max-resend-attempts: 5
  resend-window-hours: 24
  unverified-account-cleanup-days: 30
```

Create `src/main/resources/application-dev.yml` for development overrides:

```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    com.lunfit.authservice: DEBUG
```

### 4. Environment Variables

For local development, create `.env` file (add to .gitignore):

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/authservice
DATABASE_USERNAME=authservice_user
DATABASE_PASSWORD=authservice_pass

# JWT
JWT_SECRET=YourSuperSecretKeyThatShouldBeAtLeast256BitsLongForHS256AlgorithmSecurity

# Email (Gmail example)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_FROM=noreply@lunfit.com

# Application
BASE_URL=http://localhost:8080
```

**Note for Gmail**:
- Enable 2FA on your Google account
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use the app password as MAIL_PASSWORD

### 5. Build the Application

Using Gradle:

```bash
./gradlew clean build
```

Using Maven:

```bash
./mvnw clean package
```

### 6. Run Database Migrations

Flyway migrations run automatically on application startup. To run manually:

```bash
./gradlew flywayMigrate  # Gradle
./mvnw flyway:migrate     # Maven
```

### 7. Run the Application

Using Gradle:

```bash
./gradlew bootRun
```

Using Maven:

```bash
./mvnw spring-boot:run
```

Or run from IDE:
- Open `AuthServiceApplication.java`
- Right-click → Run 'AuthServiceApplication'

Application should start on `http://localhost:8080`

Check health:

```bash
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}
```

## Testing the API

### 1. Register a New User

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response (201 Created):

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "test@example.com",
  "verificationEmailSent": true
}
```

### 2. Check Email for Verification Link

In development, check application logs for the verification link:

```
Verification link: http://localhost:8080/api/v1/auth/verify?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Or query the database:

```sql
SELECT token FROM verification_tokens WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

### 3. Verify Email

```bash
curl -X GET "http://localhost:8080/api/v1/auth/verify?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

Expected response (200 OK):

```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "test@example.com"
}
```

### 4. Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 1,
    "email": "test@example.com",
    "emailVerified": true,
    "status": "ACTIVE",
    "createdAt": "2026-01-01T10:00:00Z",
    "lastLoginAt": "2026-01-01T12:00:00Z"
  }
}
```

### 5. Access Protected Endpoint (Example)

```bash
curl -X GET http://localhost:8080/api/v1/protected/resource \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 6. Refresh Access Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

Expected response (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### 7. Logout

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Expected response (200 OK):

```json
{
  "message": "Logout successful"
}
```

### 8. Resend Verification Email

```bash
curl -X POST http://localhost:8080/api/v1/auth/verify/resend \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

Expected response (200 OK):

```json
{
  "message": "Verification email sent successfully. Please check your inbox.",
  "email": "test@example.com"
}
```

## Database Access

Connect to PostgreSQL:

```bash
docker exec -it authservice-db psql -U authservice_user -d authservice
```

Useful queries:

```sql
-- View all users
SELECT id, email, status, email_verified, created_at FROM users;

-- View verification tokens
SELECT user_id, token, status, expires_at FROM verification_tokens;

-- View active sessions (refresh tokens)
SELECT u.email, ac.refresh_token, ac.refresh_token_expiry
FROM auth_credentials ac
JOIN users u ON ac.user_id = u.id
WHERE ac.refresh_token IS NOT NULL;

-- Check unverified accounts
SELECT email, created_at,
  EXTRACT(DAY FROM NOW() - created_at) as days_since_registration
FROM users
WHERE status = 'PENDING'
ORDER BY created_at DESC;
```

## Running Tests

Unit tests:

```bash
./gradlew test  # Gradle
./mvnw test     # Maven
```

Integration tests:

```bash
./gradlew integrationTest  # Gradle
./mvnw verify              # Maven
```

## Common Issues and Solutions

### Issue: Email not sending

**Solution**:
1. Check MAIL_USERNAME and MAIL_PASSWORD environment variables
2. For Gmail, ensure you're using an App Password, not your main password
3. Check application logs for SMTP errors
4. Try using MailHog for local testing (see below)

### Issue: Database connection failed

**Solution**:
1. Verify PostgreSQL is running: `docker-compose ps`
2. Check credentials in application.yml match docker-compose.yml
3. Ensure port 5432 is not in use by another service

### Issue: JWT token invalid

**Solution**:
1. Ensure JWT_SECRET is set and at least 256 bits (32 characters)
2. Check token hasn't expired (1 hour for access token)
3. Use refresh token to get new access token

### Issue: Flyway migration failed

**Solution**:
1. Check migration scripts in `src/main/resources/db/migration/`
2. Drop and recreate database: `docker-compose down -v && docker-compose up -d`
3. Run: `./gradlew flywayClean flywayMigrate`

## Using MailHog for Local Email Testing

Instead of real SMTP, use MailHog to catch emails locally:

```yaml
# Add to docker-compose.yml
mailhog:
  image: mailhog/mailhog:latest
  container_name: mailhog
  ports:
    - "1025:1025"  # SMTP
    - "8025:8025"  # Web UI
```

Update application.yml:

```yaml
spring:
  mail:
    host: localhost
    port: 1025
    username: ""
    password: ""
```

Access MailHog web UI: http://localhost:8025

## Project Structure

```
auth-service/
├── src/
│   ├── main/
│   │   ├── java/com/lunfit/authservice/
│   │   │   ├── AuthServiceApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── AsyncConfig.java
│   │   │   │   └── JwtConfig.java
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java
│   │   │   ├── dto/
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── entity/
│   │   │   │   ├── User.java
│   │   │   │   ├── AuthCredential.java
│   │   │   │   └── VerificationToken.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── AuthCredentialRepository.java
│   │   │   │   └── VerificationTokenRepository.java
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── EmailService.java
│   │   │   │   ├── JwtService.java
│   │   │   │   └── TokenService.java
│   │   │   ├── security/
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── JwtTokenProvider.java
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── Custom exceptions...
│   │   │   └── scheduled/
│   │   │       └── AccountCleanupScheduler.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── db/migration/
│   │       │   ├── V1__create_users_table.sql
│   │       │   ├── V2__create_auth_credentials_table.sql
│   │       │   └── V3__create_verification_tokens_table.sql
│   │       └── templates/
│   │           └── verification-email.html
│   └── test/
│       └── java/com/lunfit/authservice/
│           ├── controller/
│           ├── service/
│           └── repository/
├── build.gradle  (or pom.xml)
├── docker-compose.yml
├── .env
└── README.md
```

## Next Steps

1. ✅ Set up local environment
2. ✅ Test authentication flow
3. Implement additional features:
   - Password reset (future enhancement)
   - Account deletion (future enhancement)
   - Admin endpoints (future enhancement)
4. Add frontend integration (React, Vue, Angular)
5. Deploy to production (Docker, Kubernetes, Cloud)

## Additional Resources

- Spring Boot Documentation: https://docs.spring.io/spring-boot/docs/current/reference/html/
- Spring Security: https://docs.spring.io/spring-security/reference/
- PostgreSQL: https://www.postgresql.org/docs/
- JWT.io: https://jwt.io/
- OpenAPI Specification: See `contracts/openapi.yaml`

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review specification: `specs/001-email-auth/spec.md`
- Review plan: `specs/001-email-auth/plan.md`
- Review data model: `specs/001-email-auth/data-model.md`
