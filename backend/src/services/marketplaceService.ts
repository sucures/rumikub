// Marketplace service (Step 24) — cosmetics, inventory, loadout
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cosmeticItems, userInventory, userLoadout } from '../db/schema.js';
import type { NewUserInventoryRow, NewUserLoadoutRow } from '../db/schema.js';
import { tokenService } from './tokenService.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export type CosmeticType = 'skin' | 'board' | 'tiles' | 'effect';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CosmeticItemDto {
  id: string;
  name: string;
  type: string;
  rarity: string;
  priceCoins: number;
  priceGems: number;
  metadata: Record<string, unknown>;
  isLimited: boolean;
  availableFrom: Date | null;
  availableTo: Date | null;
  createdAt: Date;
}

export interface InventoryItemDto {
  id: string;
  itemId: string;
  acquiredAt: Date;
  item?: CosmeticItemDto;
}

export interface LoadoutDto {
  skinId: string | null;
  boardId: string | null;
  tilesId: string | null;
  effectId: string | null;
}

function rowToItem(row: typeof cosmeticItems.$inferSelect): CosmeticItemDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    rarity: row.rarity,
    priceCoins: row.priceCoins,
    priceGems: row.priceGems,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    isLimited: row.isLimited,
    availableFrom: row.availableFrom,
    availableTo: row.availableTo,
    createdAt: row.createdAt,
  };
}

function isAvailable(row: typeof cosmeticItems.$inferSelect): boolean {
  const now = new Date();
  if (row.availableFrom && row.availableFrom > now) return false;
  if (row.availableTo && row.availableTo < now) return false;
  return true;
}

export class MarketplaceService {
  async listItems(filters?: {
    type?: CosmeticType;
    rarity?: CosmeticRarity;
    featured?: boolean;
  }): Promise<CosmeticItemDto[]> {
    const conditions = [];
    const now = new Date();

    if (filters?.type) {
      conditions.push(eq(cosmeticItems.type, filters.type));
    }
    if (filters?.rarity) {
      conditions.push(eq(cosmeticItems.rarity, filters.rarity));
    }
    if (filters?.featured) {
      conditions.push(eq(cosmeticItems.isLimited, true));
    }

    const rows = await db
      .select()
      .from(cosmeticItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cosmeticItems.createdAt);

    return rows.filter(isAvailable).map(rowToItem);
  }

  async getItem(itemId: string): Promise<CosmeticItemDto | null> {
    const rows = await db
      .select()
      .from(cosmeticItems)
      .where(eq(cosmeticItems.id, itemId))
      .limit(1);
    const row = rows[0];
    if (!row || !isAvailable(row)) return null;
    return rowToItem(row);
  }

  async purchaseItem(userId: string, itemId: string): Promise<InventoryItemDto> {
    const item = await this.getItem(itemId);
    if (!item) throw new Error('Item not found or not available');

    const existing = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
      .limit(1);
    if (existing.length > 0) throw new Error('Already owned');

    const priceCoins = item.priceCoins;
    const priceGems = item.priceGems;

    if (priceCoins > 0 && priceGems > 0) {
      throw new Error('Item must have either coins or gems price');
    }
    if (priceCoins === 0 && priceGems === 0) {
      throw new Error('Item has no price');
    }

    if (priceCoins > 0) {
      await tokenService.spendCoins(userId, priceCoins, `Marketplace: ${item.name}`);
    }
    if (priceGems > 0) {
      await tokenService.spendGems(userId, priceGems, `Marketplace: ${item.name}`);
    }

    const invRow: NewUserInventoryRow = {
      id: genId('inv'),
      userId,
      itemId,
    };
    await db.insert(userInventory).values(invRow);

    return {
      id: invRow.id,
      itemId,
      acquiredAt: new Date(),
      item,
    };
  }

  async getInventory(userId: string): Promise<InventoryItemDto[]> {
    const rows = await db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, userId))
      .orderBy(userInventory.acquiredAt);

    const result: InventoryItemDto[] = [];
    for (const r of rows) {
      const itemRows = await db
        .select()
        .from(cosmeticItems)
        .where(eq(cosmeticItems.id, r.itemId))
        .limit(1);
      result.push({
        id: r.id,
        itemId: r.itemId,
        acquiredAt: r.acquiredAt,
        item: itemRows[0] ? rowToItem(itemRows[0]) : undefined,
      });
    }
    return result;
  }

  async setLoadout(userId: string, loadout: Partial<LoadoutDto>): Promise<LoadoutDto> {
    const existing = await db
      .select()
      .from(userLoadout)
      .where(eq(userLoadout.userId, userId))
      .limit(1);

    const skinId = loadout.skinId ?? null;
    const boardId = loadout.boardId ?? null;
    const tilesId = loadout.tilesId ?? null;
    const effectId = loadout.effectId ?? null;

    if (skinId) await this.assertUserOwns(userId, skinId);
    if (boardId) await this.assertUserOwns(userId, boardId);
    if (tilesId) await this.assertUserOwns(userId, tilesId);
    if (effectId) await this.assertUserOwns(userId, effectId);

    if (existing.length > 0) {
      await db
        .update(userLoadout)
        .set({
          skinId,
          boardId,
          tilesId,
          effectId,
          updatedAt: new Date(),
        })
        .where(eq(userLoadout.userId, userId));
    } else {
      const row: NewUserLoadoutRow = {
        id: genId('loadout'),
        userId,
        skinId,
        boardId,
        tilesId,
        effectId,
      };
      await db.insert(userLoadout).values(row);
    }

    return { skinId, boardId, tilesId, effectId };
  }

  async getLoadoutWithItems(userId: string): Promise<LoadoutDto & { items: Record<string, CosmeticItemDto | null> }> {
    const loadout = await this.getLoadout(userId);
    const ids = [loadout.skinId, loadout.boardId, loadout.tilesId, loadout.effectId].filter(
      Boolean
    ) as string[];
    const items: Record<string, CosmeticItemDto | null> = {};
    for (const id of ids) {
      const item = await this.getItem(id);
      items[id] = item ?? null;
    }
    return { ...loadout, items };
  }

  async getLoadout(userId: string): Promise<LoadoutDto> {
    const rows = await db
      .select()
      .from(userLoadout)
      .where(eq(userLoadout.userId, userId))
      .limit(1);
    const loadoutRow = rows[0];
    return {
      skinId: loadoutRow?.skinId ?? null,
      boardId: loadoutRow?.boardId ?? null,
      tilesId: loadoutRow?.tilesId ?? null,
      effectId: loadoutRow?.effectId ?? null,
    };
  }

  private async assertUserOwns(userId: string, itemId: string): Promise<void> {
    const rows = await db
      .select()
      .from(userInventory)
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)))
      .limit(1);
    if (rows.length === 0) throw new Error('You do not own this item');
  }
}

export const marketplaceService = new MarketplaceService();
