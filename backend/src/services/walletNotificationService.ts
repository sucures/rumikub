/**
 * Wallet notification service (Step 35.3).
 * Integrates Rumi Wallet with the existing notification system.
 * Uses triggerSystemMessage; never modifies it. Fail-open: never throws.
 */
import { triggerSystemMessage } from './notificationTriggers.js';

const LOG_PREFIX = '[walletNotification]';

function logInfo(msg: string) {
  console.info(`${LOG_PREFIX} ${msg}`);
}

function logWarn(msg: string) {
  console.warn(`${LOG_PREFIX} ${msg}`);
}

function logError(msg: string, err?: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`${LOG_PREFIX} ${msg}`, detail ? `error=${detail}` : '');
}

/** Notify user after spend. */
export function notifySpend(
  userId: string,
  amount: number,
  transactionId: string
): void {
  if (!userId || transactionId == null) {
    logWarn(`skipped type=spend reason=missing userId or transactionId`);
    return;
  }
  try {
    const title = 'Payment processed';
    const body = `You spent ${amount} tokens`;
    triggerSystemMessage(userId, title, body).catch((err) => {
      logError(`failed type=spend userId=${userId} transactionId=${transactionId}`, err);
    });
    logInfo(`sent type=spend userId=${userId} transactionId=${transactionId}`);
  } catch (err: any) {
    logError(`failed type=spend userId=${userId} transactionId=${transactionId}`, err);
  }
}

/** Notify sender after transfer out. */
export function notifyTransferOut(
  userId: string,
  amount: number,
  toUserId: string,
  transactionId: string
): void {
  if (!userId || transactionId == null) {
    logWarn(`skipped type=transferOut reason=missing userId or transactionId`);
    return;
  }
  try {
    const title = 'Tokens sent';
    const body = `You sent ${amount} tokens to ${toUserId}`;
    triggerSystemMessage(userId, title, body).catch((err) => {
      logError(`failed type=transferOut userId=${userId} transactionId=${transactionId}`, err);
    });
    logInfo(`sent type=transferOut userId=${userId} transactionId=${transactionId}`);
  } catch (err: any) {
    logError(`failed type=transferOut userId=${userId} transactionId=${transactionId}`, err);
  }
}

/** Notify recipient after transfer in. */
export function notifyTransferIn(
  userId: string,
  amount: number,
  fromUserId: string,
  transactionId: string
): void {
  if (!userId || transactionId == null) {
    logWarn(`skipped type=transferIn reason=missing userId or transactionId`);
    return;
  }
  try {
    const title = 'Tokens received';
    const body = `You received ${amount} tokens from ${fromUserId}`;
    triggerSystemMessage(userId, title, body).catch((err) => {
      logError(`failed type=transferIn userId=${userId} transactionId=${transactionId}`, err);
    });
    logInfo(`sent type=transferIn userId=${userId} transactionId=${transactionId}`);
  } catch (err: any) {
    logError(`failed type=transferIn userId=${userId} transactionId=${transactionId}`, err);
  }
}

/** Notify user after reward (addTokens with metadata.type === 'reward'). */
export function notifyReward(
  userId: string,
  amount: number,
  _metadata: Record<string, unknown>,
  transactionId: string
): void {
  if (!userId || transactionId == null) {
    logWarn(`skipped type=reward reason=missing userId or transactionId`);
    return;
  }
  try {
    const title = 'Reward earned';
    const body = `You earned ${amount} tokens`;
    triggerSystemMessage(userId, title, body).catch((err) => {
      logError(`failed type=reward userId=${userId} transactionId=${transactionId}`, err);
    });
    logInfo(`sent type=reward userId=${userId} transactionId=${transactionId}`);
  } catch (err: any) {
    logError(`failed type=reward userId=${userId} transactionId=${transactionId}`, err);
  }
}

/** Notify user after simulated payment. */
export function notifySimulatedPayment(
  userId: string,
  amount: number,
  merchantName: string,
  transactionId: string
): void {
  if (!userId || transactionId == null) {
    logWarn(`skipped type=simulatedPayment reason=missing userId or transactionId`);
    return;
  }
  try {
    const title = 'Payment simulated';
    const body = `You spent ${amount} tokens at ${merchantName}`;
    triggerSystemMessage(userId, title, body).catch((err) => {
      logError(`failed type=simulatedPayment userId=${userId} transactionId=${transactionId}`, err);
    });
    logInfo(`sent type=simulatedPayment userId=${userId} transactionId=${transactionId}`);
  } catch (err: any) {
    logError(`failed type=simulatedPayment userId=${userId} transactionId=${transactionId}`, err);
  }
}
