// Token service (Step 18) — coins, gems, transactions
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, transactions } from '../db/schema.js';
import type { NewTransactionRow } from '../db/schema.js';

export type TransactionType = 'earn' | 'spend' | 'admin' | 'purchase' | 'reward';
export type Currency = 'coins' | 'gems';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface Balance {
  coins: number;
  gems: number;
}

export interface TransactionDto {
  id: string;
  type: TransactionType;
  currency: Currency;
  amount: number;
  description: string;
  createdAt: Date;
}

export class TokenService {
  async getBalance(userId: string): Promise<Balance> {
    const rows = await db.select({ coins: users.coins, gems: users.gems }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) return { coins: 0, gems: 0 };
    return { coins: row.coins, gems: row.gems };
  }

  private async recordTransaction(
    userId: string,
    type: TransactionType,
    currency: Currency,
    amount: number,
    description: string
  ): Promise<void> {
    const row: NewTransactionRow = {
      id: genId('tx'),
      userId,
      type,
      currency,
      amount,
      description: description.slice(0, 500),
    };
    await db.insert(transactions).values(row);
  }

  async addCoins(userId: string, amount: number, description: string): Promise<Balance> {
    if (amount <= 0) return this.getBalance(userId);
    const rows = await db.select({ coins: users.coins }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('User not found');
    const newCoins = row.coins + amount;
    await db.update(users).set({ coins: newCoins, updatedAt: new Date() }).where(eq(users.id, userId));
    await this.recordTransaction(userId, 'earn', 'coins', amount, description);
    return this.getBalance(userId);
  }

  async addGems(userId: string, amount: number, description: string): Promise<Balance> {
    if (amount <= 0) return this.getBalance(userId);
    const rows = await db.select({ gems: users.gems }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('User not found');
    const newGems = row.gems + amount;
    await db.update(users).set({ gems: newGems, updatedAt: new Date() }).where(eq(users.id, userId));
    await this.recordTransaction(userId, 'earn', 'gems', amount, description);
    return this.getBalance(userId);
  }

  async spendCoins(userId: string, amount: number, description: string): Promise<Balance> {
    if (amount <= 0) return this.getBalance(userId);
    const rows = await db.select({ coins: users.coins }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('User not found');
    if (row.coins < amount) throw new Error('Insufficient coins');
    const newCoins = row.coins - amount;
    await db.update(users).set({ coins: newCoins, updatedAt: new Date() }).where(eq(users.id, userId));
    await this.recordTransaction(userId, 'spend', 'coins', -amount, description);
    return this.getBalance(userId);
  }

  async spendGems(userId: string, amount: number, description: string): Promise<Balance> {
    if (amount <= 0) return this.getBalance(userId);
    const rows = await db.select({ gems: users.gems }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('User not found');
    if (row.gems < amount) throw new Error('Insufficient gems');
    const newGems = row.gems - amount;
    await db.update(users).set({ gems: newGems, updatedAt: new Date() }).where(eq(users.id, userId));
    await this.recordTransaction(userId, 'spend', 'gems', -amount, description);
    return this.getBalance(userId);
  }

  async adminAdd(userId: string, currency: Currency, amount: number, description: string): Promise<Balance> {
    if (amount > 0) {
      if (currency === 'coins') return this.addCoins(userId, amount, `Admin: ${description}`);
      return this.addGems(userId, amount, `Admin: ${description}`);
    }
    if (amount < 0) {
      const abs = Math.abs(amount);
      if (currency === 'coins') return this.spendCoins(userId, abs, `Admin: ${description}`);
      return this.spendGems(userId, abs, `Admin: ${description}`);
    }
    return this.getBalance(userId);
  }

  async getTransactions(userId: string, limit = 50): Promise<TransactionDto[]> {
    const rows = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      type: r.type as TransactionType,
      currency: r.currency as Currency,
      amount: r.amount,
      description: r.description,
      createdAt: r.createdAt,
    }));
  }
}

export const tokenService = new TokenService();
