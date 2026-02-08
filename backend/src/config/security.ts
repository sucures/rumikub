/**
 * Security config for 2FA (Step Security.2).
 */

const defaultOtpTtl = 120; // 2 minutes

function parsePositiveInt(value: string | undefined, defaultVal: number): number {
  if (value === undefined || value === '') return defaultVal;
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? defaultVal : n;
}

/** 32-byte hex key for AES-256-GCM encryption of TOTP secrets. Must be set in production. */
export const securityEncryptionKey =
  process.env.SECURITY_ENCRYPTION_KEY ?? '';

/** TTL in seconds for email/SMS OTP stored in Redis. */
export const otpTtl = parsePositiveInt(
  process.env.OTP_TTL,
  defaultOtpTtl
);

/** Max age of client signature timestamp in ms (Step Security.4). Default 60s. Set SIGNATURE_MAX_AGE_MS. */
const defaultSignatureMaxAgeMs = 60_000;
export const signatureMaxAgeMs = parsePositiveInt(
  process.env.SIGNATURE_MAX_AGE_MS,
  defaultSignatureMaxAgeMs
);

/** Domain for canonical messages (Step Security.10). */
export const securityDomain = process.env.SECURITY_DOMAIN ?? 'RUMI_WALLET_V1';

/** Chain/environment for canonical messages (Step Security.10). */
export const securityChainId =
  process.env.SECURITY_CHAIN_ID ?? (process.env.NODE_ENV === 'production' ? 'prod' : 'dev');

/** Secret for HMAC on recovery approval tokens (Step Security.10). Must be set in production. */
export const recoveryTokenSecret = process.env.RECOVERY_TOKEN_SECRET ?? '';

/** Recovery ticket TTL in seconds (default 15 min). */
export const recoveryTicketTtl = parsePositiveInt(
  process.env.RECOVERY_TICKET_TTL_SEC,
  900
);

/** Max recovery tickets per user per 24h (Step Security.10). */
export const recoveryMaxTicketsPer24h = parsePositiveInt(
  process.env.RECOVERY_MAX_TICKETS_PER_24H,
  3
);

// Step Security.10 Phase 2: Risk engine
export const riskThreshold2FARequired = parsePositiveInt(
  process.env.RISK_THRESHOLD_2FA_REQUIRED,
  3
);
export const riskNewDeviceDays = parsePositiveInt(
  process.env.RISK_NEW_DEVICE_DAYS,
  7
);
export const riskRecoveryFirstNOps = parsePositiveInt(
  process.env.RISK_RECOVERY_FIRST_N_OPS,
  5
);
export const riskHighAmountThreshold = parsePositiveInt(
  process.env.RISK_HIGH_AMOUNT_THRESHOLD,
  10_000
);
