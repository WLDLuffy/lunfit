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
