# Data Model: Email-Based Authentication

**Feature**: Email-Based Authentication
**Created**: 2026-01-01
**Database**: PostgreSQL 16.x

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email (UNIQUE)  │
│ status          │
│ email_verified  │
│ created_at      │
│ verified_at     │
│ last_login_at   │
│ resend_count    │
│ last_resend_at  │
└────────┬────────┘
         │ 1
         │
         │ 1
┌────────┴────────────────┐
│   auth_credentials      │
│─────────────────────────│
│ id (PK)                 │
│ user_id (FK, UNIQUE)    │
│ password_hash           │
│ refresh_token           │
│ refresh_token_expiry    │
│ device_info             │
│ updated_at              │
└─────────────────────────┘

         │ 1
         │
         │ *
┌────────┴────────────────┐
│  verification_tokens    │
│─────────────────────────│
│ id (PK)                 │
│ user_id (FK)            │
│ token (UNIQUE)          │
│ token_type              │
│ status                  │
│ created_at              │
│ expires_at              │
│ used_at                 │
└─────────────────────────┘
```

## Table Definitions

### 1. users

Stores core user information and account status.

```sql
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(254) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at         TIMESTAMP,
    last_login_at       TIMESTAMP,
    resend_count        INTEGER NOT NULL DEFAULT 0,
    last_resend_at      TIMESTAMP,

    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'))
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_status_created ON users(status, created_at); -- For cleanup queries
```

**Fields**:
- `id`: Auto-incrementing primary key
- `email`: User's email address (unique, lowercase normalized)
- `status`: Account status (PENDING → ACTIVE after verification)
- `email_verified`: Boolean flag for verification status
- `created_at`: Account creation timestamp
- `verified_at`: Email verification timestamp
- `last_login_at`: Last successful login timestamp
- `resend_count`: Count of verification email resends (reset after verification)
- `last_resend_at`: Timestamp of last verification email resend

**Validation Rules**:
- Email must be valid format (regex check)
- Status must be one of: PENDING, ACTIVE, SUSPENDED, DELETED
- Email stored in lowercase for case-insensitive comparison
- resend_count used for rate limiting (max 5 per 24 hours)

**State Transitions**:
```
PENDING → ACTIVE (on email verification)
ACTIVE → SUSPENDED (admin action - future)
ACTIVE → DELETED (user deletion - future)
PENDING → DELETED (cleanup job after 30 days)
```

---

### 2. auth_credentials

Stores sensitive authentication data separately from user profile.

```sql
CREATE TABLE auth_credentials (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    refresh_token           VARCHAR(255),
    refresh_token_expiry    TIMESTAMP,
    device_info             VARCHAR(500),
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_auth_user_id ON auth_credentials(user_id);
CREATE INDEX idx_auth_refresh_token ON auth_credentials(refresh_token) WHERE refresh_token IS NOT NULL;
```

**Fields**:
- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table (one-to-one relationship)
- `password_hash`: BCrypt hashed password (cost factor 12)
- `refresh_token`: Current active refresh token (UUID, nullable)
- `refresh_token_expiry`: Refresh token expiration timestamp
- `device_info`: Device/browser information for session tracking (user agent string)
- `updated_at`: Last update timestamp (auto-updated on password or token change)

**Security Considerations**:
- Password never stored in plain text
- Refresh token nullable (null when user logged out)
- ON DELETE CASCADE ensures credentials deleted with user
- refresh_token index uses partial index (WHERE clause) for efficiency

**Single Session Enforcement**:
- Only one refresh_token per user
- New login overwrites existing refresh_token
- Previous device session invalidated automatically

---

### 3. verification_tokens

Stores email verification tokens with expiration.

```sql
CREATE TABLE verification_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    token_type      VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    status          VARCHAR(20) NOT NULL DEFAULT 'VALID',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_token_type CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
    CONSTRAINT chk_status CHECK (status IN ('VALID', 'EXPIRED', 'USED'))
);

-- Indexes for performance
CREATE UNIQUE INDEX idx_verification_token ON verification_tokens(token);
CREATE INDEX idx_verification_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_expires ON verification_tokens(expires_at); -- For cleanup
CREATE INDEX idx_verification_status_expires ON verification_tokens(status, expires_at); -- For cleanup queries
```

**Fields**:
- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table (one-to-many relationship)
- `token`: Cryptographically secure random token (URL-safe)
- `token_type`: Type of token (EMAIL_VERIFICATION for MVP, PASSWORD_RESET for future)
- `status`: Token status (VALID, EXPIRED, USED)
- `created_at`: Token generation timestamp
- `expires_at`: Token expiration timestamp (created_at + 1 hour)
- `used_at`: Timestamp when token was used (null if unused)

**Token Lifecycle**:
1. Created on registration or resend request (status: VALID)
2. Expires after 1 hour (status: EXPIRED via cleanup job or validation check)
3. Used on successful verification (status: USED, used_at set)
4. Old tokens deleted when new token generated for same user

**Cleanup Strategy**:
- Expired tokens (expires_at < NOW()) deleted after 7 days
- Used tokens deleted after 7 days
- On new token generation, delete previous VALID tokens for same user

---

## JPA Entity Mappings

### User Entity

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.PENDING;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "resend_count", nullable = false)
    private Integer resendCount = 0;

    @Column(name = "last_resend_at")
    private LocalDateTime lastResendAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private AuthCredential authCredential;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VerificationToken> verificationTokens;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and setters
}

public enum UserStatus {
    PENDING, ACTIVE, SUSPENDED, DELETED
}
```

### AuthCredential Entity

```java
@Entity
@Table(name = "auth_credentials")
public class AuthCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "refresh_token_expiry")
    private LocalDateTime refreshTokenExpiry;

    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and setters
}
```

### VerificationToken Entity

```java
@Entity
@Table(name = "verification_tokens")
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 50)
    private TokenType tokenType = TokenType.EMAIL_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TokenStatus status = TokenStatus.VALID;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = createdAt.plusHours(1);
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    // Getters and setters
}

public enum TokenType {
    EMAIL_VERIFICATION, PASSWORD_RESET
}

public enum TokenStatus {
    VALID, EXPIRED, USED
}
```

---

## Flyway Migration Scripts

### V1__create_users_table.sql

```sql
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(254) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    email_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at         TIMESTAMP,
    last_login_at       TIMESTAMP,
    resend_count        INTEGER NOT NULL DEFAULT 0,
    last_resend_at      TIMESTAMP,

    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_status_created ON users(status, created_at);

COMMENT ON TABLE users IS 'Core user accounts and profile information';
COMMENT ON COLUMN users.email IS 'User email address (unique, lowercase normalized)';
COMMENT ON COLUMN users.status IS 'Account status: PENDING (unverified), ACTIVE (verified), SUSPENDED, DELETED';
COMMENT ON COLUMN users.resend_count IS 'Count of verification email resends (for rate limiting)';
```

### V2__create_auth_credentials_table.sql

```sql
CREATE TABLE auth_credentials (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,
    refresh_token           VARCHAR(255),
    refresh_token_expiry    TIMESTAMP,
    device_info             VARCHAR(500),
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_auth_user_id ON auth_credentials(user_id);
CREATE INDEX idx_auth_refresh_token ON auth_credentials(refresh_token) WHERE refresh_token IS NOT NULL;

COMMENT ON TABLE auth_credentials IS 'Sensitive authentication data (passwords, tokens)';
COMMENT ON COLUMN auth_credentials.password_hash IS 'BCrypt hashed password (cost factor 12)';
COMMENT ON COLUMN auth_credentials.refresh_token IS 'Current active refresh token (UUID)';
COMMENT ON COLUMN auth_credentials.device_info IS 'Device/browser info for session tracking';
```

### V3__create_verification_tokens_table.sql

```sql
CREATE TABLE verification_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    token_type      VARCHAR(50) NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    status          VARCHAR(20) NOT NULL DEFAULT 'VALID',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP NOT NULL,
    used_at         TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_token_type CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
    CONSTRAINT chk_status CHECK (status IN ('VALID', 'EXPIRED', 'USED'))
);

CREATE UNIQUE INDEX idx_verification_token ON verification_tokens(token);
CREATE INDEX idx_verification_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_expires ON verification_tokens(expires_at);
CREATE INDEX idx_verification_status_expires ON verification_tokens(status, expires_at);

COMMENT ON TABLE verification_tokens IS 'Email verification and password reset tokens';
COMMENT ON COLUMN verification_tokens.token IS 'Cryptographically secure random token (URL-safe)';
COMMENT ON COLUMN verification_tokens.expires_at IS 'Token expiration (created_at + 1 hour)';
```

---

## Data Validation Rules

### User Registration
- Email: Valid format (RFC 5322), max 254 characters, unique, normalized to lowercase
- Password: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
- Initial status: PENDING
- Initial email_verified: false
- resend_count: 0

### Email Verification
- Token: Must be VALID status
- Token: Must not be expired (expires_at > NOW())
- Token: Belongs to PENDING user
- On success:
  - User status: PENDING → ACTIVE
  - User email_verified: false → true
  - User verified_at: set to current timestamp
  - Token status: VALID → USED
  - Token used_at: set to current timestamp
  - User resend_count: reset to 0

### Login
- User must exist
- User status must be ACTIVE (not PENDING, SUSPENDED, or DELETED)
- Password must match hash
- On success:
  - User last_login_at: updated to current timestamp
  - Old refresh_token: deleted/overwritten
  - New refresh_token: generated and stored
  - refresh_token_expiry: set to 30 days from now

### Refresh Token
- Token must exist in database
- Token must not be expired (refresh_token_expiry > NOW())
- User status must be ACTIVE
- On success:
  - New access token generated
  - New refresh token generated
  - Old refresh token deleted/overwritten

### Resend Verification Email
- User status: PENDING
- resend_count: < 5
- If last_resend_at exists: must be > 24 hours ago OR resend_count reset if > 24 hours
- On success:
  - resend_count: incremented
  - last_resend_at: updated to current timestamp
  - Old VALID tokens for user: deleted
  - New verification token: created

---

## Sample Data

```sql
-- Sample user (for testing)
INSERT INTO users (email, status, email_verified, created_at)
VALUES ('test@example.com', 'ACTIVE', true, CURRENT_TIMESTAMP);

-- Sample credentials (BCrypt hash of "TestPassword123!")
INSERT INTO auth_credentials (user_id, password_hash, updated_at)
VALUES (1, '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzQzxj7EOi', CURRENT_TIMESTAMP);
```

---

## Database Sizing Estimates

**Initial Scale (First Year)**:
- Users: 10,000 - 100,000
- Active sessions: 1,000 - 10,000 concurrent
- Verification tokens: Mostly transient (deleted after use/expiry)

**Storage Estimates**:
- Users table: ~1KB per row → 100MB for 100k users
- Auth credentials: ~500 bytes per row → 50MB for 100k users
- Verification tokens: ~300 bytes per row → Minimal (transient data)
- Total: < 200MB for 100k users (well within PostgreSQL capacity)

**Growth Strategy**:
- PostgreSQL handles millions of rows efficiently
- Consider partitioning verification_tokens if volume exceeds 1M rows
- Index maintenance via VACUUM ANALYZE (automatic in PostgreSQL)

---

## Conclusion

The data model is designed for:
- **Security**: Separation of credentials, hashed passwords, secure tokens
- **Performance**: Strategic indexing for common queries
- **Scalability**: Clean schema supports horizontal scaling
- **Maintainability**: Clear relationships, constraints, and documentation

**Status**: Data model complete ✅
**Next**: Generate API contracts (OpenAPI specification)
