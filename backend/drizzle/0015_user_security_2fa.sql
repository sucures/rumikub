-- Step Security.2: Multi-Method 2FA
CREATE TABLE IF NOT EXISTS user_security (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_methods TEXT[] NOT NULL DEFAULT '{}',
  totp_secret TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_security_two_factor_enabled
  ON user_security (two_factor_enabled) WHERE two_factor_enabled = true;
