// Rumi Wallet service (Step 32 / Step 34 / Step 35.2)
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { walletAccounts, walletTransactions, users } from '../db/schema.js';
import type { WalletTransactionType } from '../db/schema.js';
import { WalletError } from '../errors/WalletError.js';
import { walletMaxAmount } from '../config/wallet.js';
import {
  getCachedBalance,
  setCachedBalance,
  invalidateBalance,
  getCachedTransactions,
  setCachedTransactions,
  invalidateTransactions,
} from '../utils/cache.js';
import {
  notifySpend,
  notifyTransferOut,
  notifyTransferIn,
  notifyReward,
} from './walletNotificationService.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Normalize metadata to a plain object for storage (Step 34). */
function normalizeMetadata(metadata?: Record<string, unknown> | null): Record<string, unknown> {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return { ...metadata };
}

function logWalletOp(op: string, userId: string, detail?: string) {
  if (process.env.NODE_ENV === 'production') {
    console.info(`[wallet] ${op} userId=${userId}${detail ? ` ${detail}` : ''}`);
  }
}

export interface WalletTransactionDto {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export async function ensureWalletExists(userId: string): Promise<void> {
  await db
    .insert(walletAccounts)
    .values({ userId, balance: 0, updatedAt: new Date() })
    .onConflictDoNothing({ target: walletAccounts.userId });
}

export async function getWalletBalance(userId: string): Promise<number> {
  const cached = await getCachedBalance(userId);
  if (cached !== null) return cached;
  await ensureWalletExists(userId);
  const rows = await db
    .select({ balance: walletAccounts.balance })
    .from(walletAccounts)
    .where(eq(walletAccounts.userId, userId))
    .limit(1);
  const balance = rows[0]?.balance ?? 0;
  await setCachedBalance(userId, balance);
  return balance;
}

export async function getWalletTransactions(
  userId: string,
  limit = 50,
  offset = 0
): Promise<WalletTransactionDto[]> {
  if (offset === 0) {
    const cached = await getCachedTransactions(userId);
    if (cached !== null) return cached.slice(0, limit) as WalletTransactionDto[];
  }
  const rows = await db
    .select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      balanceAfter: walletTransactions.balanceAfter,
      metadata: walletTransactions.metadata,
      createdAt: walletTransactions.createdAt,
    })
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit)
    .offset(offset);
  const result = rows.map((r) => ({
    id: r.id,
    type: r.type as WalletTransactionType,
    amount: r.amount,
    balanceAfter: r.balanceAfter,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    createdAt: r.createdAt,
  })) as WalletTransactionDto[];
  if (offset === 0) await setCachedTransactions(userId, result);
  return result;
}

export async function addTokens(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<number> {
  if (amount <= 0) return getWalletBalance(userId);
  const meta = normalizeMetadata(metadata);
  const txResult = await db.transaction(async (tx) => {
    await tx
      .insert(walletAccounts)
      .values({ userId, balance: 0, updatedAt: new Date() })
      .onConflictDoNothing({ target: walletAccounts.userId });
    const rows = await tx
      .select({ balance: walletAccounts.balance })
      .from(walletAccounts)
      .where(eq(walletAccounts.userId, userId))
      .limit(1);
    const row = rows[0];
    if (!row) throw WalletError.walletNotFound('User not found');
    const newBalance = row.balance + amount;
    const txId = genId('wt');
    await tx
      .update(walletAccounts)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(walletAccounts.userId, userId));
    await tx.insert(walletTransactions).values({
      id: txId,
      userId,
      type: 'reward',
      amount,
      balanceAfter: newBalance,
      metadata: meta,
    });
    return { newBalance, transactionId: txId };
  });
  await invalidateBalance(userId);
  await invalidateTransactions(userId);
  if (meta?.type === 'reward') {
    notifyReward(userId, amount, meta, txResult.transactionId);
  }
  return txResult.newBalance;
}

export interface SpendResult {
  balance: number;
  transactionId: string;
}

export async function spendTokens(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<SpendResult> {
  if (amount <= 0) throw WalletError.invalidAmount('Amount must be greater than 0');
  if (amount > walletMaxAmount) throw WalletError.invalidAmount(`Amount cannot exceed ${walletMaxAmount}`);
  const meta = normalizeMetadata(metadata);
  const result = await db.transaction(async (tx) => {
    await tx
      .insert(walletAccounts)
      .values({ userId, balance: 0, updatedAt: new Date() })
      .onConflictDoNothing({ target: walletAccounts.userId });
    const rows = await tx
      .select({ balance: walletAccounts.balance })
      .from(walletAccounts)
      .where(eq(walletAccounts.userId, userId))
      .limit(1);
    const row = rows[0];
    if (!row) throw WalletError.walletNotFound('Wallet not found');
    if (row.balance < amount) throw WalletError.insufficientFunds('Insufficient balance');
    const newBalance = row.balance - amount;
    const transactionId = genId('wt');
    await tx
      .update(walletAccounts)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(walletAccounts.userId, userId));
    await tx.insert(walletTransactions).values({
      id: transactionId,
      userId,
      type: 'spend',
      amount: -amount,
      balanceAfter: newBalance,
      metadata: meta,
    });
    return { balance: newBalance, transactionId };
  });
  logWalletOp('spend', userId, `amount=${amount} transactionId=${result.transactionId}`);
  await invalidateBalance(userId);
  await invalidateTransactions(userId);
  if (meta?.source !== 'card_simulation') {
    notifySpend(userId, amount, result.transactionId);
  }
  return result;
}

export interface TransferResult {
  fromBalance: number;
  toBalance: number;
  transactionId: string;
}

export async function transferTokens(
  fromUserId: string,
  toUserId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<TransferResult> {
  if (amount <= 0) throw WalletError.invalidAmount('Amount must be greater than 0');
  if (amount > walletMaxAmount) throw WalletError.invalidAmount(`Amount cannot exceed ${walletMaxAmount}`);
  if (fromUserId === toUserId) throw WalletError.invalidTransfer('Cannot transfer to yourself');
  const toExists = await db.select({ id: users.id }).from(users).where(eq(users.id, toUserId)).limit(1);
  if (toExists.length === 0) throw WalletError.invalidTransfer('Recipient not found');
  const meta = normalizeMetadata(metadata);

  const result = await db.transaction(async (tx) => {
    await tx
      .insert(walletAccounts)
      .values([
        { userId: fromUserId, balance: 0, updatedAt: new Date() },
        { userId: toUserId, balance: 0, updatedAt: new Date() },
      ])
      .onConflictDoNothing({ target: walletAccounts.userId });
    const fromRows = await tx
      .select({ balance: walletAccounts.balance })
      .from(walletAccounts)
      .where(eq(walletAccounts.userId, fromUserId))
      .limit(1);
    const toRows = await tx
      .select({ balance: walletAccounts.balance })
      .from(walletAccounts)
      .where(eq(walletAccounts.userId, toUserId))
      .limit(1);
    const fromBalance = fromRows[0]?.balance ?? 0;
    const toBalance = toRows[0]?.balance ?? 0;
    if (fromBalance < amount) throw WalletError.insufficientFunds('Insufficient balance');
    const newFromBalance = fromBalance - amount;
    const newToBalance = toBalance + amount;
    const outTxId = genId('wt');
    const inTxId = genId('wt');
    await tx
      .update(walletAccounts)
      .set({ balance: newFromBalance, updatedAt: new Date() })
      .where(eq(walletAccounts.userId, fromUserId));
    await tx
      .update(walletAccounts)
      .set({ balance: newToBalance, updatedAt: new Date() })
      .where(eq(walletAccounts.userId, toUserId));
    await tx.insert(walletTransactions).values([
      {
        id: outTxId,
        userId: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        balanceAfter: newFromBalance,
        metadata: { ...meta, toUserId },
      },
      {
        id: inTxId,
        userId: toUserId,
        type: 'transfer_in',
        amount,
        balanceAfter: newToBalance,
        metadata: { ...meta, fromUserId },
      },
    ]);
    return { fromBalance: newFromBalance, toBalance: newToBalance, transactionId: outTxId };
  });
  logWalletOp('transfer', fromUserId, `to=${toUserId} amount=${amount} transactionId=${result.transactionId}`);
  await invalidateBalance(fromUserId);
  await invalidateTransactions(fromUserId);
  await invalidateBalance(toUserId);
  await invalidateTransactions(toUserId);
  notifyTransferOut(fromUserId, amount, toUserId, result.transactionId);
  notifyTransferIn(toUserId, amount, fromUserId, result.transactionId);
  return result;
}
