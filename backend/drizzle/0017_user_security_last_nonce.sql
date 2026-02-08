-- Step Security.5: Anti-Replay Protection & Nonce Tracking
ALTER TABLE user_security
ADD COLUMN IF NOT EXISTS last_nonce TEXT;
