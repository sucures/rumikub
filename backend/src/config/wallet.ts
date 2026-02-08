/**
 * Rumi Wallet config (Step 34).
 * Centralizes max amount and rate limit for wallet endpoints.
 */

const defaultMaxAmount = 1_000_000;
const defaultRateLimitMaxPerMinute = 30;

function parsePositiveInt(
  value: string | undefined,
  defaultVal: number
): number {
  if (value === undefined || value === '') return defaultVal;
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? defaultVal : n;
}

/** Max allowed amount per single spend/transfer/simulate-payment (inclusive). */
export const walletMaxAmount =
  parsePositiveInt(process.env.WALLET_MAX_AMOUNT, defaultMaxAmount);

/** Max wallet write operations per user per minute (for rate limit middleware). */
export const walletRateLimitMaxPerMinute =
  parsePositiveInt(process.env.WALLET_RATE_LIMIT_MAX_PER_MINUTE, defaultRateLimitMaxPerMinute);
