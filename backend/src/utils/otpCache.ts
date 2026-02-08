/**
 * OTP cache for email/SMS OTP (Step Security.2).
 * Redis-backed with 2-minute TTL.
 */
import { createClient, type RedisClientType } from 'redis';
import { redisUrl, walletCacheEnabled } from '../config/cache.js';
import { otpTtl } from '../config/security.js';

const OTP_PREFIX = '2fa:otp:';

let client: RedisClientType | null = null;
let clientInitPromise: Promise<void> | null = null;

async function getClient(): Promise<RedisClientType | null> {
  if (!walletCacheEnabled) return null;
  if (client?.isOpen) return client;
  if (clientInitPromise) {
    await clientInitPromise;
    return client;
  }
  clientInitPromise = (async () => {
    try {
      client = createClient({ url: redisUrl });
      client.on('error', (err) => {
        console.warn('[otp-cache] Redis error:', err.message);
      });
      await client.connect();
    } catch (err: any) {
      console.error('[otp-cache] Redis connection failed:', (err as Error).message);
      client = null;
    }
  })();
  await clientInitPromise;
  return client;
}

const ttl = otpTtl;

/** Store OTP code. TTL from config (default 2 min). */
export async function setOtp(key: string, code: string): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.setEx(OTP_PREFIX + key, ttl, code);
  } catch (err: any) {
    console.warn('[otp-cache] set OTP error:', (err as Error).message);
  }
}

/** Get and delete OTP code. Returns null on miss or error. */
export async function consumeOtp(key: string): Promise<string | null> {
  const c = await getClient();
  if (!c) return null;
  try {
    const value = await c.get(OTP_PREFIX + key);
    if (value == null) return null;
    await c.del(OTP_PREFIX + key);
    return value;
  } catch (err: any) {
    console.warn('[otp-cache] consume OTP error:', (err as Error).message);
    return null;
  }
}
