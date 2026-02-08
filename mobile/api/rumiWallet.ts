import { apiClient } from './client';

export interface RumiWalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

type WalletErrorCode =
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_TRANSFER'
  | 'INVALID_AMOUNT'
  | 'WALLET_NOT_FOUND'
  | 'SYSTEM_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR';

/** Map API error code to user-friendly message (Step 34). */
export function mapWalletErrorMessage(err: unknown): string {
  const e = err as Error & { apiResponse?: { code?: string; error?: string }; status?: number };
  const code = e.apiResponse?.code as WalletErrorCode | undefined;
  const status = e.status;
  if (code === 'INSUFFICIENT_FUNDS') return 'Insufficient balance.';
  if (code === 'INVALID_AMOUNT') return e.apiResponse?.error ?? 'Invalid amount.';
  if (code === 'INVALID_TRANSFER') return e.apiResponse?.error ?? 'Invalid transfer.';
  if (code === 'WALLET_NOT_FOUND') return 'Wallet not found.';
  if (code === 'RATE_LIMIT_EXCEEDED' || status === 429) return 'Too many requests. Please try again in a minute.';
  if (code === 'VALIDATION_ERROR') return e.apiResponse?.error ?? 'Invalid input.';
  if (code === 'SYSTEM_ERROR' || (status && status >= 500)) return 'Something went wrong. Please try again.';
  return e.message ?? 'Request failed.';
}

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 800;

async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Retry once on 429 or 5xx. */
async function withRetry<T>(
  fn: () => Promise<T>,
  isRetryable: (err: unknown) => boolean
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (MAX_RETRIES > 0 && isRetryable(err)) {
      await delay(RETRY_DELAY_MS);
      return await fn();
    }
    throw err;
  }
}

function isRetryable(err: unknown): boolean {
  const e = err as Error & { status?: number };
  const status = e.status;
  return status === 429 || (status != null && status >= 500);
}

export async function getRumiWalletBalance(): Promise<number> {
  const fn = async () => {
    const { data } = await apiClient.get<{ success: boolean; balance: number }>('/api/rumi-wallet/balance');
    if (!data.success || data.balance == null) throw new Error('Failed to get balance');
    return data.balance;
  };
  return withRetry(fn, isRetryable);
}

export async function getRumiWalletTransactions(
  limit?: number,
  offset?: number
): Promise<RumiWalletTransaction[]> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const qs = params.toString();
  const fn = async () => {
    const { data } = await apiClient.get<{ success: boolean; transactions: RumiWalletTransaction[] }>(
      `/api/rumi-wallet/transactions${qs ? `?${qs}` : ''}`
    );
    if (!data.success || !data.transactions) throw new Error('Failed to get transactions');
    return data.transactions;
  };
  return withRetry(fn, isRetryable);
}

export interface SpendResult {
  balance: number;
  transactionId: string;
}

export async function spendRumiTokens(
  amount: number,
  metadata?: Record<string, unknown>
): Promise<SpendResult> {
  const fn = async () => {
    const { data } = await apiClient.post<{ success: boolean; balance: number; transactionId: string }>(
      '/api/rumi-wallet/spend',
      { amount, metadata: metadata ?? {} }
    );
    if (!data.success) throw new Error('Failed to spend');
    return { balance: data.balance, transactionId: data.transactionId ?? '' };
  };
  try {
    return await withRetry(fn, isRetryable);
  } catch (err) {
    throw new Error(mapWalletErrorMessage(err));
  }
}

export interface TransferResult {
  balance: number;
  toBalance: number;
  transactionId: string;
}

export async function transferRumiTokens(
  toUserId: string,
  amount: number,
  metadata?: Record<string, unknown>
): Promise<TransferResult> {
  const fn = async () => {
    const { data } = await apiClient.post<{
      success: boolean;
      balance: number;
      toBalance: number;
      transactionId: string;
    }>('/api/rumi-wallet/transfer', { toUserId, amount, metadata: metadata ?? {} });
    if (!data.success) throw new Error('Failed to transfer');
    return {
      balance: data.balance,
      toBalance: data.toBalance,
      transactionId: data.transactionId ?? '',
    };
  };
  try {
    return await withRetry(fn, isRetryable);
  } catch (err) {
    throw new Error(mapWalletErrorMessage(err));
  }
}

export interface SimulatePaymentResult {
  success: boolean;
  balance: number;
  merchantName: string;
  transactionId: string;
}

export async function simulateCardPayment(
  amount: number,
  merchantName: string
): Promise<SimulatePaymentResult> {
  const fn = async () => {
    const { data } = await apiClient.post<{
      success: boolean;
      balance: number;
      merchantName: string;
      transactionId: string;
    }>('/api/rumi-wallet/simulate-payment', { amount, merchantName });
    if (!data.success) throw new Error('Failed to simulate payment');
    return {
      success: data.success,
      balance: data.balance,
      merchantName: data.merchantName,
      transactionId: data.transactionId ?? '',
    };
  };
  try {
    return await withRetry(fn, isRetryable);
  } catch (err) {
    throw new Error(mapWalletErrorMessage(err));
  }
}
