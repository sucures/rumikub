import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { WalletResponse } from '../api/wallet';

interface WalletState {
  coins: number;
  gems: number;
  transactions: WalletResponse['transactions'];
  isLoading: boolean;
  error: string | null;
  fetchWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  coins: 0,
  gems: 0,
  transactions: [],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ success: boolean; wallet: WalletResponse }>(
        '/api/wallet'
      );
      if (data.success && data.wallet) {
        set({
          coins: data.wallet.coins,
          gems: data.wallet.gems,
          transactions: data.wallet.transactions,
        });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch wallet' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
