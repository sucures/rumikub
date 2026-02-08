// Wallet store (Step 18) — coins, gems, transactions
import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Transaction {
  id: string;
  type: string;
  currency: 'coins' | 'gems';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletState {
  coins: number;
  gems: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchWallet: () => Promise<void>;
  spendCoins: (amount: number, description: string) => Promise<{ success: boolean; error?: string }>;
  spendGems: (amount: number, description: string) => Promise<{ success: boolean; error?: string }>;
  purchaseItem: (itemId: string, amount?: number) => Promise<{ success: boolean; error?: string }>;
  setBalance: (coins: number, gems: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  coins: 0,
  gems: 0,
  transactions: [],
  isLoading: false,
  error: null,
  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{
        success: boolean;
        wallet: { coins: number; gems: number; transactions: Transaction[] };
      }>('/api/wallet');
      if (data.success && data.wallet) {
        const tx = data.wallet.transactions ?? [];
        set({
          coins: data.wallet.coins,
          gems: data.wallet.gems,
          transactions: tx.map((t) => ({
            ...t,
            createdAt: typeof t.createdAt === 'string' ? t.createdAt : (t as { createdAt?: Date }).createdAt?.toISOString?.() ?? '',
          })),
        });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch wallet' });
    } finally {
      set({ isLoading: false });
    }
  },
  spendCoins: async (amount, description) => {
    try {
      const { data } = await apiClient.post<{ success: boolean; balance?: { coins: number; gems: number } }>(
        '/api/wallet/spend',
        { currency: 'coins', amount, description }
      );
      if (data.success && data.balance) {
        set({ coins: data.balance.coins, gems: data.balance.gems });
        return { success: true };
      }
      return { success: false, error: 'Failed to spend' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to spend' };
    }
  },
  spendGems: async (amount, description) => {
    try {
      const { data } = await apiClient.post<{ success: boolean; balance?: { coins: number; gems: number } }>(
        '/api/wallet/spend',
        { currency: 'gems', amount, description }
      );
      if (data.success && data.balance) {
        set({ coins: data.balance.coins, gems: data.balance.gems });
        return { success: true };
      }
      return { success: false, error: 'Failed to spend' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to spend' };
    }
  },
  purchaseItem: async (itemId, amount = 1) => {
    try {
      const { data } = await apiClient.post<{
        success: boolean;
        balance?: { coins: number; gems: number };
        error?: string;
      }>(`/api/store/purchase/${itemId}`, { amount });
      if (data.success && data.balance) {
        set({ coins: data.balance.coins, gems: data.balance.gems });
        return { success: true };
      }
      return { success: false, error: data.error ?? 'Failed to purchase' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to purchase' };
    }
  },
  setBalance: (coins, gems) => set({ coins, gems }),
}));
