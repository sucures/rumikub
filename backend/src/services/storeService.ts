// Store service (Step 18) — items, purchases, apply effects
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { storeItems, purchases, users } from '../db/schema.js';
import type { NewStoreItemRow, NewPurchaseRow } from '../db/schema.js';
import { tokenService } from './tokenService.js';

export type StoreItemType = 'coins_pack' | 'gems_pack' | 'skin' | 'ticket';

export interface StoreItemDto {
  id: string;
  name: string;
  type: StoreItemType;
  priceGems: number | null;
  priceCoins: number | null;
  metadata: Record<string, unknown> | null;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const INITIAL_ITEMS: Omit<NewStoreItemRow, 'id'>[] = [
  { name: 'Coins Pack (100)', type: 'coins_pack', priceGems: 10, priceCoins: null, metadata: { coins: 100 } },
  { name: 'Coins Pack (500)', type: 'coins_pack', priceGems: 40, priceCoins: null, metadata: { coins: 500 } },
  { name: 'Coins Pack (2000)', type: 'coins_pack', priceGems: 120, priceCoins: null, metadata: { coins: 2000 } },
  { name: 'Tournament Ticket', type: 'ticket', priceGems: 15, priceCoins: 150, metadata: { entryFeeWaived: 1 } },
  { name: 'Basic Skin', type: 'skin', priceGems: null, priceCoins: 500, metadata: { skinId: 'basic' } },
  { name: 'Premium Skin', type: 'skin', priceGems: 50, priceCoins: null, metadata: { skinId: 'premium' } },
];

export class StoreService {
  private initialized = false;

  private async ensureInitialItems(): Promise<void> {
    if (this.initialized) return;
    const count = await db.select({ id: storeItems.id }).from(storeItems).limit(1);
    if (count.length === 0) {
      for (const item of INITIAL_ITEMS) {
        const id = genId('item');
        await db.insert(storeItems).values({ ...item, id });
      }
    }
    this.initialized = true;
  }

  async listStoreItems(): Promise<StoreItemDto[]> {
    await this.ensureInitialItems();
    const rows = await db.select().from(storeItems);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as StoreItemType,
      priceGems: r.priceGems,
      priceCoins: r.priceCoins,
      metadata: (r.metadata as Record<string, unknown>) ?? null,
    }));
  }

  async purchaseItem(userId: string, itemId: string, amount = 1): Promise<{ success: boolean; item: StoreItemDto; balance: { coins: number; gems: number } }> {
    await this.ensureInitialItems();
    const itemRows = await db.select().from(storeItems).where(eq(storeItems.id, itemId)).limit(1);
    const item = itemRows[0];
    if (!item) throw new Error('Item not found');

    const priceCoins = item.priceCoins ?? 0;
    const priceGems = item.priceGems ?? 0;
    const totalCoins = priceCoins * amount;
    const totalGems = priceGems * amount;

    if (priceCoins > 0 && priceGems > 0) {
      throw new Error('Item has both coin and gem price');
    }
    if (priceCoins === 0 && priceGems === 0) {
      throw new Error('Item has no price');
    }

    if (totalCoins > 0) {
      await tokenService.spendCoins(userId, totalCoins, `Purchase: ${item.name} x${amount}`);
    } else {
      await tokenService.spendGems(userId, totalGems, `Purchase: ${item.name} x${amount}`);
    }

    const purchaseId = genId('purchase');
    const purchaseRow: NewPurchaseRow = { id: purchaseId, userId, itemId, amount };
    await db.insert(purchases).values(purchaseRow);

    await this.applyItemEffect(userId, {
      id: item.id,
      name: item.name,
      type: item.type as StoreItemType,
      priceGems: item.priceGems,
      priceCoins: item.priceCoins,
      metadata: (item.metadata as Record<string, unknown>) ?? null,
    }, amount);

    const balance = await tokenService.getBalance(userId);
    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        type: item.type as StoreItemType,
        priceGems: item.priceGems,
        priceCoins: item.priceCoins,
        metadata: (item.metadata as Record<string, unknown>) ?? null,
      },
      balance,
    };
  }

  async applyItemEffect(userId: string, item: StoreItemDto, amount: number): Promise<void> {
    const meta = item.metadata ?? {};
    const coins = (meta.coins as number) ?? 0;
    if (coins > 0) {
      await tokenService.addCoins(userId, coins * amount, `Store: ${item.name} x${amount}`);
    }
    // skins, tickets: stored in user inventory/preferences (future); for now we just record the purchase
  }
}

export const storeService = new StoreService();
