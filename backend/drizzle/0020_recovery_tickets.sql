-- Step Security.9 + Security.10: recovery_tickets for assisted recovery
CREATE TABLE IF NOT EXISTS recovery_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING',
  method TEXT NOT NULL DEFAULT 'ASSISTED',
  metadata JSONB,
  approval_token TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_recovery_tickets_approval_token ON recovery_tickets(approval_token);
CREATE INDEX IF NOT EXISTS idx_recovery_tickets_user_created ON recovery_tickets(user_id, created_at);
