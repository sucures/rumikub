/**
 * HMAC-based recovery approval tokens (Step Security.10).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { recoveryTokenSecret } from '../config/security.js';

const RANDOM_BYTES = 32;
const MAC_BYTES = 16;
const TOTAL_BYTES = RANDOM_BYTES + MAC_BYTES;

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function fromBase64url(s: string): Buffer | null {
  try {
    return Buffer.from(s, 'base64url');
  } catch {
    return null;
  }
}

/**
 * Generate an HMAC-signed recovery token.
 * token = base64url(random_32 || HMAC(secret, random_32)[0:16])
 * Returns { token, randomHex } - store randomHex in DB as approval_token.
 */
export function generateRecoveryToken(): { token: string; randomHex: string } {
  const secret = recoveryTokenSecret || 'dev-recovery-token-secret-do-not-use-in-prod';
  const random = randomBytes(RANDOM_BYTES);
  const mac = createHmac('sha256', secret).update(random).digest().subarray(0, MAC_BYTES);
  const combined = Buffer.concat([random, mac]);
  const token = base64url(combined);
  const randomHex = random.toString('hex');
  return { token, randomHex };
}

/**
 * Validate token and return the stored random hex for DB lookup.
 * If invalid, returns null (do NOT hit DB).
 */
export function validateRecoveryToken(token: string): string | null {
  const secret = recoveryTokenSecret || 'dev-recovery-token-secret-do-not-use-in-prod';
  const buf = fromBase64url(token);
  if (!buf || buf.length !== TOTAL_BYTES) return null;
  const random = buf.subarray(0, RANDOM_BYTES);
  const mac = buf.subarray(RANDOM_BYTES);
  const expectedMac = createHmac('sha256', secret).update(random).digest().subarray(0, MAC_BYTES);
  if (!timingSafeEqual(mac, expectedMac)) return null;
  return random.toString('hex');
}
