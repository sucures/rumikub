/**
 * Recovery ticket cleanup job (Step Security.10).
 * Runs every hour: mark expired, delete old tickets.
 */
import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { recoveryTickets } from '../db/schema.js';

const LOG_PREFIX = '[recoveryCleanup]';

function logInfo(msg: string) {
  console.info(`${LOG_PREFIX} ${msg}`);
}

function logError(msg: string, err?: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`${LOG_PREFIX} ${msg}`, detail ? `error=${detail}` : '');
}

export async function runRecoveryCleanup(): Promise<void> {
  try {
    const now = new Date();

    // Mark expired PENDING tickets as EXPIRED
    const expiredResult = await db
      .update(recoveryTickets)
      .set({ status: 'EXPIRED' })
      .where(
        and(
          eq(recoveryTickets.status, 'PENDING'),
          lt(recoveryTickets.expiresAt, now)
        )
      )
      .returning({ id: recoveryTickets.id });
    const expiredCount = expiredResult.length;

    // Delete tickets older than 30 days
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deleteResult = await db
      .delete(recoveryTickets)
      .where(lt(recoveryTickets.createdAt, cutoff))
      .returning({ id: recoveryTickets.id });
    const deletedCount = deleteResult.length;

    if (expiredCount > 0 || deletedCount > 0) {
      logInfo(`cleanup: marked ${expiredCount} expired, deleted ${deletedCount} old tickets`);
    }
  } catch (err: any) {
    logError('cleanup failed', err);
  }
}
