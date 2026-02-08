// Loadout store (Step 24)
import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Loadout, InventoryItem } from '../api/marketplace';

interface LoadoutState {
  loadout: Loadout;
  inventory: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchLoadout: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  setLoadout: (loadout: Loadout) => Promise<void>;
}

const defaultLoadout: Loadout = {
  skinId: null,
  boardId: null,
  tilesId: null,
  effectId: null,
};

export const useLoadoutStore = create<LoadoutState>((set, get) => ({
  loadout: defaultLoadout,
  inventory: [],
  isLoading: false,
  error: null,

  fetchLoadout: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ success: boolean; loadout: Loadout }>(
        '/api/inventory/loadout'
      );
      if (data.success && data.loadout) {
        set({ loadout: data.loadout });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch loadout' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ success: boolean; inventory: InventoryItem[] }>(
        '/api/inventory'
      );
      if (data.success && data.inventory) {
        set({ inventory: data.inventory });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch inventory' });
    } finally {
      set({ isLoading: false });
    }
  },

  setLoadout: async (loadout) => {
    set({ error: null });
    try {
      const { data } = await apiClient.post<{ success: boolean; loadout: Loadout }>(
        '/api/inventory/loadout',
        loadout
      );
      if (data.success && data.loadout) {
        set({ loadout: data.loadout });
      }
    } catch (err) {
      throw err;
    }
  },
}));
