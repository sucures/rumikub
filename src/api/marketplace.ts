// Marketplace API (Step 24)
import { apiClient } from './client';

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'skin' | 'board' | 'tiles' | 'effect';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  priceCoins: number;
  priceGems: number;
  metadata: Record<string, unknown>;
  isLimited: boolean;
  availableFrom: string | null;
  availableTo: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  acquiredAt: string;
  item?: CosmeticItem;
}

export interface Loadout {
  skinId: string | null;
  boardId: string | null;
  tilesId: string | null;
  effectId: string | null;
}

export async function listMarketplaceItems(filters?: {
  type?: CosmeticItem['type'];
  rarity?: CosmeticItem['rarity'];
  featured?: boolean;
}): Promise<CosmeticItem[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.rarity) params.set('rarity', filters.rarity);
  if (filters?.featured) params.set('featured', 'true');
  const qs = params.toString();
  const url = `/api/marketplace${qs ? `?${qs}` : ''}`;
  const { data } = await apiClient.get<{ success: boolean; items: CosmeticItem[] }>(url);
  if (!data.success) throw new Error('Failed to list items');
  return data.items ?? [];
}

export async function getMarketplaceItem(itemId: string): Promise<CosmeticItem> {
  const { data } = await apiClient.get<{ success: boolean; item: CosmeticItem }>(
    `/api/marketplace/${itemId}`
  );
  if (!data.success || !data.item) throw new Error('Item not found');
  return data.item;
}

export async function purchaseMarketplaceItem(itemId: string): Promise<InventoryItem> {
  const { data } = await apiClient.post<{ success: boolean; inventoryItem: InventoryItem }>(
    `/api/marketplace/purchase/${itemId}`
  );
  if (!data.success || !data.inventoryItem) throw new Error('Purchase failed');
  return data.inventoryItem;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get<{ success: boolean; inventory: InventoryItem[] }>(
    '/api/inventory'
  );
  if (!data.success) throw new Error('Failed to get inventory');
  return data.inventory ?? [];
}

export interface LoadoutWithItems extends Loadout {
  items?: Record<string, CosmeticItem | null>;
}

export async function getLoadout(withItems = false): Promise<LoadoutWithItems> {
  const url = withItems ? '/api/inventory/loadout?withItems=true' : '/api/inventory/loadout';
  const { data } = await apiClient.get<{ success: boolean; loadout: LoadoutWithItems }>(url);
  if (!data.success) throw new Error('Failed to get loadout');
  return data.loadout ?? { skinId: null, boardId: null, tilesId: null, effectId: null };
}

export async function setLoadout(loadout: Loadout): Promise<Loadout> {
  const { data } = await apiClient.post<{ success: boolean; loadout: Loadout }>(
    '/api/inventory/loadout',
    loadout
  );
  if (!data.success || !data.loadout) throw new Error('Failed to set loadout');
  return data.loadout;
}
