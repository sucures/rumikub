/**
 * Wallet cache utility (Step 35.2).
 * Redis-backed caching for balance and transactions with fail-open behavior.
 */
import { createClient, type RedisClientType } from 'redis';
import {
  redisUrl,
  walletBalanceTtl,
  walletTransactionsTtl,
  walletCacheEnabled,
} from '../config/cache.js';

const BALANCE_KEY_PREFIX = 'wallet:balance:';
const TX_KEY_PREFIX = 'wallet:tx:';

export interface CachedTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

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
        console.warn('[cache] Redis client error:', err.message);
      });
      await client.connect();
    } catch (err) {
      console.error('[cache] Redis connection failed:', (err as Error).message);
      client = null;
    }
  })();
  await clientInitPromise;
  return client;
}

function logDebug(msg: string) {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG?.includes('cache')) {
    console.debug(`[cache] ${msg}`);
  }
}

function logInfo(msg: string) {
  console.info(`[cache] ${msg}`);
}

/** Get cached balance or null on miss/error. */
export async function getCachedBalance(userId: string): Promise<number | null> {
  const c = await getClient();
  if (!c) return null;
  try {
    const raw = await c.get(BALANCE_KEY_PREFIX + userId);
    if (raw == null) {
      logDebug(`balance miss userId=${userId}`);
      return null;
    }
    const val = parseInt(raw, 10);
    logDebug(`balance hit userId=${userId}`);
    return Number.isNaN(val) ? null : val;
  } catch (err) {
    console.warn('[cache] Redis get balance error:', (err as Error).message);
    return null;
  }
}

/** Set cached balance with TTL. (Redis failures logged at warn.) */
export async function setCachedBalance(userId: string, balance: number): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.setEx(BALANCE_KEY_PREFIX + userId, walletBalanceTtl, String(balance));
  } catch (err) {
    console.warn('[cache] Redis set balance error:', (err as Error).message);
  }
}

/** Invalidate cached balance. (Invalidations logged at info.) */
export async function invalidateBalance(userId: string): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.del(BALANCE_KEY_PREFIX + userId);
    logInfo(`invalidate balance userId=${userId}`);
  } catch (err) {
    console.warn('[cache] Redis invalidate balance error:', (err as Error).message);
  }
}

/** Get cached transactions or null on miss/error. */
export async function getCachedTransactions(
  userId: string
): Promise<Array<{ id: string; type: string; amount: number; balanceAfter: number; metadata: Record<string, unknown>; createdAt: Date }> | null> {
  const c = await getClient();
  if (!c) return null;
  try {
    const raw = await c.get(TX_KEY_PREFIX + userId);
    if (raw == null) {
      logDebug(`transactions miss userId=${userId}`);
      return null;
    }
    const arr = JSON.parse(raw) as CachedTransaction[];
    logDebug(`transactions hit userId=${userId}`);
    return arr.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch (err) {
    console.warn('[cache] Redis get transactions error:', (err as Error).message);
    return null;
  }
}

/** Set cached transactions with TTL. */
export async function setCachedTransactions(
  userId: string,
  transactions: Array<{ id: string; type: string; amount: number; balanceAfter: number; metadata: Record<string, unknown>; createdAt: Date }>
): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    const serialized = JSON.stringify(
      transactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))
    );
    await c.setEx(TX_KEY_PREFIX + userId, walletTransactionsTtl, serialized);
  } catch (err) {
    console.warn('[cache] Redis set transactions error:', (err as Error).message);
  }
}

/** Invalidate cached transactions. */
export async function invalidateTransactions(userId: string): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await c.del(TX_KEY_PREFIX + userId);
    logInfo(`invalidate transactions userId=${userId}`);
  } catch (err) {
    console.warn('[cache] Redis invalidate transactions error:', (err as Error).message);
  }
}
