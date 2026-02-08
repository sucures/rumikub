-- Step Security.4: Client-Signed Transactions
ALTER TABLE user_security
ADD COLUMN IF NOT EXISTS public_key TEXT;
