import { AxiosError } from 'axios';
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

/** Map API error to user-friendly message (Step 34). */
export function mapWalletErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: string; code?: string }>;
  const data = axiosErr.response?.data;
  const code = data?.code as WalletErrorCode | undefined;
  const status = axiosErr.response?.status;
  if (code === 'INSUFFICIENT_FUNDS') return 'Insufficient balance.';
  if (code === 'INVALID_AMOUNT') return data?.error ?? 'Invalid amount.';
  if (code === 'INVALID_TRANSFER') return data?.error ?? 'Invalid transfer.';
  if (code === 'WALLET_NOT_FOUND') return 'Wallet not found.';
  if (code === 'RATE_LIMIT_EXCEEDED' || status === 429) return 'Too many requests. Please try again in a minute.';
  if (code === 'VALIDATION_ERROR') return data?.error ?? 'Invalid input.';
  if (code === 'SYSTEM_ERROR' || (status != null && status >= 500)) return 'Something went wrong. Please try again.';
  return (err instanceof Error ? err.message : 'Request failed') ?? 'Request failed.';
}

export async function getRumiWalletBalance(): Promise<number> {
  const { data } = await apiClient.get<{ success: boolean; balance: number }>(
    '/api/rumi-wallet/balance'
  );
  if (!data.success || data.balance == null) throw new Error('Failed to get balance');
  return data.balance;
}

export async function getRumiWalletTransactions(
  limit?: number,
  offset?: number
): Promise<RumiWalletTransaction[]> {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const qs = params.toString();
  const { data } = await apiClient.get<{
    success: boolean;
    transactions: RumiWalletTransaction[];
  }>(`/api/rumi-wallet/transactions${qs ? `?${qs}` : ''}`);
  if (!data.success || !data.transactions) throw new Error('Failed to get transactions');
  return data.transactions;
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
  const { data } = await apiClient.post<{
    success: boolean;
    balance: number;
    toBalance: number;
    transactionId: string;
  }>('/api/rumi-wallet/transfer', {
    toUserId,
    amount,
    metadata: metadata ?? {},
  });
  if (!data.success) throw new Error('Failed to transfer');
  return {
    balance: data.balance,
    toBalance: data.toBalance,
    transactionId: data.transactionId ?? '',
  };
}
