# LunFit Authentication Service

Email-based authentication service for the LunFit exercise tracking application.

## Features

- User registration with email verification
- Email/password login
- JWT-based access tokens (1 hour expiration)
- Refresh token mechanism for seamless sessions
- Single active session per user
- Automatic cleanup of unverified accounts

## Tech Stack

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17
- **Database**: PostgreSQL 16.x
- **Security**: Spring Security 6.2.x, BCrypt, JWT
- **Email**: Spring Mail + Thymeleaf
- **Build**: Maven

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the quick start script to automatically set up everything:

```bash
./quickstart.sh
```

This script will:
- Check prerequisites
- Create `.env` file configured for local development
- Start Docker containers (PostgreSQL + MailHog)
- Build the application
- Show you the next steps

Then start the application:
```bash
./mvnw spring-boot:run
```

### Option 2: Manual Setup

**Prerequisites:**
- Java 17 or higher
- Maven 3.6+
- Docker and Docker Compose

**Steps:**

1. Clone the repository
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL and MailHog:
   ```bash
   docker-compose up -d
   ```

4. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```

The application will start on `http://localhost:8080`

### Testing with MailHog

MailHog provides a local SMTP server for testing emails:
- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

All verification emails will be caught by MailHog during development.

## API Endpoints

### Authentication

✅ **Implemented:**
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/verify?token={token}` - Email verification
- `POST /api/v1/auth/verify/resend` - Resend verification email
- `POST /api/v1/auth/login` - User login

🚧 **Coming Soon:**
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

For detailed testing instructions with example curl commands, see **[TESTING.md](TESTING.md)**

## Documentation

For detailed documentation, see:
- **[Testing Guide](TESTING.md)** - Complete testing instructions with examples
- [Specification](../specs/001-email-auth/spec.md)
- [Implementation Plan](../specs/001-email-auth/plan.md)
- [Data Model](../specs/001-email-auth/data-model.md)
- [API Contracts](../specs/001-email-auth/contracts/openapi.yaml)
- [Quickstart Guide](../specs/001-email-auth/quickstart.md)
- [Development Guide](CLAUDE.md)

## Development

### Build

```bash
./mvnw clean package
```

### Run Tests

```bash
./mvnw test
```

### Database Migrations

Flyway migrations run automatically on application startup. Migrations are located in `src/main/resources/db/migration/`.

## Environment Variables

See `.env.example` for all required environment variables.

## License

Proprietary - LunFit Platform
