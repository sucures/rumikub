-- Step 35.2: Composite index for wallet_transactions (user_id, created_at DESC)
-- Optimizes getWalletTransactions pagination queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_created
  ON wallet_transactions (user_id, created_at DESC);
