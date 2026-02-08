import { apiClient } from './client';

export interface StoreItem {
  id: string;
  name: string;
  type: 'coins_pack' | 'gems_pack' | 'skin' | 'ticket';
  priceGems: number | null;
  priceCoins: number | null;
  metadata: Record<string, unknown> | null;
}

export async function listStoreItems(): Promise<StoreItem[]> {
  const { data } = await apiClient.get<{ success: boolean; items: StoreItem[] }>('/api/store');
  if (!data.success) throw new Error('Failed to list store');
  return data.items ?? [];
}

export async function purchaseItem(
  itemId: string,
  amount = 1
): Promise<{ success: boolean; balance: { coins: number; gems: number } }> {
  const { data } = await apiClient.post<{
    success: boolean;
    balance: { coins: number; gems: number };
    error?: string;
  }>(`/api/store/purchase/${itemId}`, { amount });
  if (!data.success) throw new Error((data as { error?: string }).error ?? 'Failed to purchase');
  return { success: true, balance: data.balance! };
}
