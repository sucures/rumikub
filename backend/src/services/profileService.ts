// Profile service (Step 21) — profiles, stats
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';

export interface PublicProfile {
  id: string;
  username: string;
  avatar: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  level: number;
  premium: boolean;
  referralCode: string | null;
  referralsCount: number;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    totalScore: number;
    tournamentsWon: number;
  };
  createdAt: Date;
}

export interface ProfileUpdate {
  username?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
}

export class ProfileService {
  async getProfile(userId: string): Promise<PublicProfile | null> {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.rowToProfile(row);
  }

  async getPublicProfile(username: string): Promise<PublicProfile | null> {
    const rows = await db.select().from(users).where(eq(users.username, username.trim())).limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.rowToProfile(row);
  }

  async updateProfile(userId: string, data: ProfileUpdate): Promise<PublicProfile | null> {
    if (data.username !== undefined) {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, data.username.trim())).limit(1);
      if (existing.length > 0 && existing[0].id !== userId) {
        throw new Error('Username already in use');
      }
    }
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (data.username !== undefined) updates.username = data.username.trim();
    if (data.avatar !== undefined) updates.avatar = data.avatar;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.country !== undefined) updates.country = data.country;
    await db.update(users).set(updates as any).where(eq(users.id, userId));
    return this.getProfile(userId);
  }

  async incrementGameStats(userId: string, won: boolean): Promise<void> {
    const rows = await db.select({ stats: users.stats }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) return;
    const stats = (row.stats ?? {}) as Record<string, number>;
    stats.gamesPlayed = (stats.gamesPlayed ?? 0) + 1;
    stats.gamesWon = (stats.gamesWon ?? 0) + (won ? 1 : 0);
    stats.gamesLost = (stats.gamesLost ?? 0) + (won ? 0 : 1);
    await db.update(users).set({ stats: stats as any, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async incrementTournamentStats(userId: string, won: boolean): Promise<void> {
    const rows = await db.select({ stats: users.stats }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) return;
    const stats = (row.stats ?? {}) as Record<string, number>;
    stats.tournamentsWon = (stats.tournamentsWon ?? 0) + (won ? 1 : 0);
    await db.update(users).set({ stats: stats as any, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  private rowToProfile(row: typeof users.$inferSelect): PublicProfile {
    const stats = (row.stats ?? {}) as Record<string, number>;
    return {
      id: row.id,
      username: row.username,
      avatar: row.avatar,
      avatarUrl: (row as { avatarUrl?: string | null }).avatarUrl ?? null,
      bio: row.bio,
      country: (row as { country?: string | null }).country ?? null,
      level: row.level,
      premium: row.premium,
      referralCode: row.referralCode ?? null,
      referralsCount: (row as { referralsCount?: number }).referralsCount ?? 0,
      stats: {
        gamesPlayed: stats.gamesPlayed ?? 0,
        gamesWon: stats.gamesWon ?? 0,
        gamesLost: stats.gamesLost ?? 0,
        totalScore: stats.totalScore ?? 0,
        tournamentsWon: stats.tournamentsWon ?? 0,
      },
      createdAt: row.createdAt,
    };
  }
}

export const profileService = new ProfileService();
