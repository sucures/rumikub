/**
 * Cache config for Rumi Wallet (Step 35.2).
 */

const defaultRedisUrl = 'redis://localhost:6379';
const defaultBalanceTtl = 15;
const defaultTransactionsTtl = 15;

function parsePositiveInt(value: string | undefined, defaultVal: number): number {
  if (value === undefined || value === '') return defaultVal;
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? defaultVal : n;
}

/** Redis connection URL. */
export const redisUrl = process.env.REDIS_URL ?? defaultRedisUrl;

/** TTL in seconds for cached wallet balance. */
export const walletBalanceTtl = parsePositiveInt(
  process.env.WALLET_BALANCE_TTL,
  defaultBalanceTtl
);

/** TTL in seconds for cached wallet transactions (first page). */
export const walletTransactionsTtl = parsePositiveInt(
  process.env.WALLET_TRANSACTIONS_TTL,
  defaultTransactionsTtl
);

/** Whether wallet caching is enabled (default true; set WALLET_CACHE_ENABLED=false to disable). */
export const walletCacheEnabled =
  process.env.WALLET_CACHE_ENABLED !== 'false' && process.env.WALLET_CACHE_ENABLED !== '0';
