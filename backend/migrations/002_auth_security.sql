CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    session_token_hash TEXT
        UNIQUE
        NOT NULL,

    ip_address INET,

    user_agent TEXT,

    expires_at TIMESTAMPTZ
        NOT NULL,

    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    last_used_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_user_sessions_user
ON user_sessions(user_id);


CREATE INDEX idx_user_sessions_expiry
ON user_sessions(expires_at);
