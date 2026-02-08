-- Step 30: Scheduler schema additions
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ;
ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS match_ready_notified_at TIMESTAMPTZ;
ALTER TABLE referral_rewards ADD COLUMN IF NOT EXISTS reward_notified_at TIMESTAMPTZ;
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS invalid_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS scheduled_announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_scheduled_for ON scheduled_announcements(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_sent_at ON scheduled_announcements(sent_at);
CREATE INDEX IF NOT EXISTS idx_push_tokens_invalid_at ON push_tokens(invalid_at) WHERE invalid_at IS NOT NULL;
