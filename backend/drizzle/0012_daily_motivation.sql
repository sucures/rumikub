-- Step 31: Daily motivation system
CREATE TABLE IF NOT EXISTS daily_motivation (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  date DATE,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_motivation_date ON daily_motivation(date) WHERE date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_motivation_used ON daily_motivation(used) WHERE used = false;

CREATE TABLE IF NOT EXISTS user_motivation (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default phrases
INSERT INTO daily_motivation (id, text, used) VALUES
  ('dm_seed_1', 'Every game is a chance to improve. Play with intention.', false),
  ('dm_seed_2', 'Strategy wins games. Patience wins championships.', false),
  ('dm_seed_3', 'Your next move could change everything. Think ahead.', false),
  ('dm_seed_4', 'Focus on the tiles in front of you. The rest will follow.', false),
  ('dm_seed_5', 'Great players adapt. Adapt your strategy today.', false)
ON CONFLICT (id) DO NOTHING;
