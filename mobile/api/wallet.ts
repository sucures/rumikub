import { apiClient } from './client';

export interface WalletResponse {
  coins: number;
  gems: number;
  transactions: {
    id: string;
    type: string;
    currency: string;
    amount: number;
    description: string;
    createdAt: string;
  }[];
}

export async function getWallet(): Promise<WalletResponse> {
  const { data } = await apiClient.get<{ success: boolean; wallet: WalletResponse }>('/api/wallet');
  if (!data.success || !data.wallet) throw new Error('Failed to fetch wallet');
  return data.wallet;
}
