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
