-- Step Security.10 Phase 2: risk engine - has_backed_up_seed
ALTER TABLE user_security ADD COLUMN IF NOT EXISTS seed_backed_up BOOLEAN NOT NULL DEFAULT false;
