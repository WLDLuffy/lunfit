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
