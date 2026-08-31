BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    public_user_id VARCHAR(32) NOT NULL UNIQUE,

    full_name VARCHAR(80) NOT NULL,

    email VARCHAR(160) NOT NULL UNIQUE,

    phone VARCHAR(20) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'support')),

    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            account_status IN (
                'active',
                'pending',
                'suspended',
                'blocked',
                'closed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_phone
ON users(phone);

CREATE INDEX IF NOT EXISTS idx_users_public_user_id
ON users(public_user_id);


-- =========================================================
-- USER SECURITY
-- =========================================================

CREATE TABLE IF NOT EXISTS user_security (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    email_verified_at TIMESTAMPTZ,

    phone_verified_at TIMESTAMPTZ,

    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0
        CHECK (failed_login_attempts >= 0),

    locked_until TIMESTAMPTZ,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_user_security_user
ON user_security(user_id);


-- =========================================================
-- WALLETS
-- =========================================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    currency VARCHAR(3) NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'frozen',
                'closed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wallet_user_currency
        UNIQUE (user_id, currency)
);


CREATE INDEX IF NOT EXISTS idx_wallets_user
ON wallets(user_id);


-- =========================================================
-- WALLET BALANCES
-- =========================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    wallet_id UUID NOT NULL UNIQUE
        REFERENCES wallets(id)
        ON DELETE CASCADE,

    available_balance NUMERIC(20,2) NOT NULL DEFAULT 0
        CHECK (available_balance >= 0),

    pending_balance NUMERIC(20,2) NOT NULL DEFAULT 0
        CHECK (pending_balance >= 0),

    currency VARCHAR(3) NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet
ON wallet_balances(wallet_id);


-- =========================================================
-- LEDGER ACCOUNTS
-- =========================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    wallet_id UUID NOT NULL
        REFERENCES wallets(id)
        ON DELETE CASCADE,

    currency VARCHAR(3) NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'frozen',
                'closed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ledger_wallet_currency
        UNIQUE (wallet_id, currency)
);


CREATE INDEX IF NOT EXISTS idx_ledger_accounts_wallet
ON ledger_accounts(wallet_id);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_user_id UUID
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,

    entity_id UUID,

    ip_address INET,

    user_agent TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
ON audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
ON audit_logs(created_at DESC);


-- =========================================================
-- EMAIL VERIFICATION TOKENS
-- =========================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT UNIQUE NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_email_verification_user
ON email_verification_tokens(user_id);


COMMIT;
