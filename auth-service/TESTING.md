# Authentication Service Testing Guide

This guide will help you test the complete authentication flow.

## Prerequisites

- Java 17 or higher
- Docker and Docker Compose
- curl or Postman

## Step 1: Environment Setup

1. **Create .env file** (copy from .env.example):
```bash
cp .env.example .env
```

2. **Edit .env file** with these values:
```properties
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/authservice
DATABASE_USERNAME=authservice_user
DATABASE_PASSWORD=authservice_pass

# JWT Configuration (use a strong secret in production)
JWT_SECRET=your-super-secret-jwt-key-at-least-256-bits-long-change-this-in-production

# Mail Configuration (MailHog for local testing)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS=false
MAIL_FROM=noreply@lunfit.com

# Application Configuration
APP_BASE_URL=http://localhost:8080
```

## Step 2: Start Infrastructure

1. **Start PostgreSQL and MailHog**:
```bash
docker-compose up -d
```

2. **Verify containers are running**:
```bash
docker-compose ps
```

You should see:
- postgres (port 5432)
- mailhog (ports 1025 for SMTP, 8025 for web UI)

3. **Access MailHog web UI**:
Open http://localhost:8025 in your browser to view test emails

## Step 3: Start the Application

```bash
./mvnw spring-boot:run
```

Wait for the log message:
```
Started AuthServiceApplication in X.XXX seconds
```

## Step 4: Test the Complete Flow

### Test 1: Register a New User

**Request**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response** (201 Created):
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "test@example.com",
  "verificationEmailSent": true
}
```

**Verify**:
- Open http://localhost:8025
- You should see a verification email
- Copy the verification token from the URL (the part after `?token=`)

### Test 2: Verify Email

**Request** (replace `{token}` with the actual token from the email):
```bash
curl -X GET "http://localhost:8080/api/v1/auth/verify?token={YOUR_TOKEN_HERE}"
```

**Expected Response** (200 OK):
```json
{
  "message": "Email verified successfully! You can now log in to your account.",
  "email": "test@example.com"
}
```

### Test 3: Login

**Request**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Save the accessToken** - you'll use it for authenticated requests.

### Test 4: Resend Verification Email

**Request** (for unverified accounts):
```bash
curl -X POST http://localhost:8080/api/v1/auth/verify/resend \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response** (200 OK):
```json
{
  "message": "Verification email resent. Please check your inbox.",
  "email": "test@example.com"
}
```

## Step 5: Test Error Scenarios

### Error 1: Duplicate Email Registration

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response** (409 Conflict):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "An account with this email already exists",
  "path": "/api/v1/auth/register"
}
```

### Error 2: Invalid Password Format

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new@example.com",
    "password": "weak"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/auth/register",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

### Error 3: Login Before Email Verification

Register a new user but try to login before verifying:

```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "Test123!@#"
  }'

# Try to login immediately (should fail)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "unverified@example.com",
    "password": "Test123!@#"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Please verify your email before logging in",
  "path": "/api/v1/auth/login"
}
```

### Error 4: Invalid Credentials

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123!@#"
  }'
```

**Expected Response** (401 Unauthorized):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "path": "/api/v1/auth/login"
}
```

### Error 5: Expired Verification Token

Wait for 1 hour after registration, then try to verify (or test with a modified token expiry):

```bash
curl -X GET "http://localhost:8080/api/v1/auth/verify?token=expired_token_here"
```

**Expected Response** (400 Bad Request):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Verification link has expired. Please request a new one.",
  "path": "/api/v1/auth/verify"
}
```

### Error 6: Rate Limit Exceeded

Try resending verification email more than 5 times in 24 hours:

```bash
# Register a new user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ratelimit@example.com",
    "password": "Test123!@#"
  }'

# Resend 6 times quickly
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/v1/auth/verify/resend \
    -H "Content-Type: application/json" \
    -d '{
      "email": "ratelimit@example.com"
    }'
  echo ""
done
```

**Expected Response on 6th attempt** (429 Too Many Requests):
```json
{
  "timestamp": "2026-01-01T14:00:00",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Maximum resend attempts (5) exceeded. Please try again after 24 hours.",
  "path": "/api/v1/auth/verify/resend"
}
```

## Step 6: Database Verification

You can verify the data in PostgreSQL:

```bash
# Connect to the database
docker exec -it auth-service-postgres-1 psql -U authservice_user -d authservice

# View users
SELECT id, email, status, email_verified, created_at, verified_at FROM users;

# View auth credentials (passwords are hashed)
SELECT id, user_id, password_hash, refresh_token FROM auth_credentials;

# View verification tokens
SELECT id, user_id, token, status, created_at, expires_at FROM verification_tokens;

# Exit
\q
```

## Step 7: Test Scheduled Job

The cleanup scheduler runs daily at 2 AM. To test it manually:

1. Create a user 31+ days ago (you'll need to manually modify the database)
2. Or wait until 2 AM and check the logs:
   ```
   INFO: Starting cleanup of unverified accounts older than 30 days
   INFO: Cleanup completed. Deleted X unverified accounts
   ```

## Postman Collection (Optional)

You can import these requests into Postman for easier testing:

1. Create a new collection called "LunFit Auth Service"
2. Add environment variables:
   - `base_url`: http://localhost:8080
   - `verification_token`: (set manually from email)
   - `access_token`: (set from login response)

3. Add requests:
   - Register: `POST {{base_url}}/api/v1/auth/register`
   - Verify: `GET {{base_url}}/api/v1/auth/verify?token={{verification_token}}`
   - Login: `POST {{base_url}}/api/v1/auth/login`
   - Resend: `POST {{base_url}}/api/v1/auth/verify/resend`

## Troubleshooting

### Issue: Application won't start

**Error**: `Could not connect to database`
- **Solution**: Make sure PostgreSQL is running: `docker-compose ps`

**Error**: `Port 8080 already in use`
- **Solution**: Stop other services using port 8080 or change the port in application.yml

### Issue: Emails not appearing in MailHog

**Check**:
1. MailHog is running: `docker-compose ps`
2. Application logs show "Verification email sent to: ..."
3. MailHog UI is accessible at http://localhost:8025

### Issue: JWT secret error

**Error**: `JWT secret key too short`
- **Solution**: Make sure JWT_SECRET in .env is at least 256 bits (32 characters)

### Issue: Flyway migration failed

**Solution**: Drop and recreate the database:
```bash
docker-compose down -v
docker-compose up -d
./mvnw spring-boot:run
```

## Clean Up

To stop all services and remove data:

```bash
# Stop application (Ctrl+C if running in terminal)

# Stop and remove containers + volumes
docker-compose down -v
```

## Next Steps

After testing, you can:
1. Implement token refresh endpoint (Phase 5)
2. Add logout functionality
3. Create protected endpoints that require authentication
4. Add integration tests
5. Deploy to production environment

---

**Happy Testing!** 🚀
