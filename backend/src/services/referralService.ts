// Referral service (Step 20) — codes, invite links, rewards
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, referralRewards, referralClicks } from '../db/schema.js';
import type { NewReferralRewardRow } from '../db/schema.js';
import { tokenService } from './tokenService.js';
import { addTokens } from './walletService.js';
import { triggerReferralReward } from './notificationTriggers.js';

const INVITER_COINS = 100;
const INVITER_GEMS = 5;
const NEW_USER_COINS = 50;

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  referralsCount: number;
  rewards: { referredUserId: string; rewardCoins: number; rewardGems: number; createdAt: Date }[];
}

export class ReferralService {
  async ensureReferralCode(userId: string): Promise<string> {
    const rows = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('User not found');
    if (row.referralCode) return row.referralCode;

    let code: string;
    let attempts = 0;
    do {
      code = generateReferralCode();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
      if (existing.length === 0) break;
      attempts++;
    } while (attempts < 20);
    if (attempts >= 20) throw new Error('Failed to generate unique referral code');

    await db.update(users).set({ referralCode: code, updatedAt: new Date() }).where(eq(users.id, userId));
    return code;
  }

  async getReferralCodeByCode(referralCode: string): Promise<string | null> {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, referralCode.toUpperCase().trim())).limit(1);
    return rows[0]?.id ?? null;
  }

  async assignReferral(newUserId: string, inviterReferralCode: string): Promise<void> {
    const inviterId = await this.getReferralCodeByCode(inviterReferralCode);
    if (!inviterId) return;
    if (inviterId === newUserId) return;

    const newUserRows = await db.select({ referredBy: users.referredBy }).from(users).where(eq(users.id, newUserId)).limit(1);
    if (newUserRows[0]?.referredBy) return;

    await db
      .update(users)
      .set({ referredBy: inviterReferralCode.toUpperCase().trim(), updatedAt: new Date() })
      .where(eq(users.id, newUserId));

    await db
      .update(users)
      .set({
        referralsCount: (await this.getReferralsCount(inviterId)) + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, inviterId));

    await this.giveRewards(inviterId, newUserId);
  }

  private async getReferralsCount(inviterId: string): Promise<number> {
    const rows = await db.select({ referralsCount: users.referralsCount }).from(users).where(eq(users.id, inviterId)).limit(1);
    return rows[0]?.referralsCount ?? 0;
  }

  async giveRewards(inviterId: string, newUserId: string): Promise<void> {
    await tokenService.addCoins(inviterId, INVITER_COINS, 'Referral reward');
    await tokenService.addGems(inviterId, INVITER_GEMS, 'Referral reward');
    await tokenService.addCoins(newUserId, NEW_USER_COINS, 'Welcome bonus');

    const rewardId = genId('ref');
    await addTokens(inviterId, INVITER_COINS + INVITER_GEMS, { referralId: rewardId }).catch(() => {});
    await addTokens(newUserId, NEW_USER_COINS, { referralId: rewardId }).catch(() => {});
    const rewardRow: NewReferralRewardRow = {
      id: rewardId,
      userId: inviterId,
      referredUserId: newUserId,
      rewardCoins: INVITER_COINS,
      rewardGems: INVITER_GEMS,
    };
    await db.insert(referralRewards).values(rewardRow);

    triggerReferralReward(inviterId, rewardId, INVITER_COINS, INVITER_GEMS).catch(() => {});
  }

  async getReferralStats(userId: string, baseUrl: string): Promise<ReferralStats> {
    const code = await this.ensureReferralCode(userId);
    const rows = await db.select({ referralsCount: users.referralsCount }).from(users).where(eq(users.id, userId)).limit(1);
    const count = rows[0]?.referralsCount ?? 0;

    const rewardRows = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, userId))
      .orderBy(desc(referralRewards.createdAt))
      .limit(50);

    const link = `${baseUrl.replace(/\/$/, '')}/invite/${code}`;
    return {
      referralCode: code,
      referralLink: link,
      referralsCount: count,
      rewards: rewardRows.map((r) => ({
        referredUserId: r.referredUserId,
        rewardCoins: r.rewardCoins,
        rewardGems: r.rewardGems,
        createdAt: r.createdAt,
      })),
    };
  }

  async getLeaderboard(limit = 10): Promise<{ userId: string; username: string; referralsCount: number }[]> {
    const rows = await db
      .select({ userId: users.id, username: users.username, referralsCount: users.referralsCount })
      .from(users)
      .limit(500);
    const filtered = rows.filter((r) => r.referralsCount > 0);
    filtered.sort((a, b) => b.referralsCount - a.referralsCount);
    return filtered.slice(0, limit).map((r) => ({
      userId: r.userId,
      username: r.username,
      referralsCount: r.referralsCount,
    }));
  }

  async recordClick(referralCode: string, ip?: string, userAgent?: string): Promise<void> {
    const id = genId('click');
    await db.insert(referralClicks).values({
      id,
      referralCode: referralCode.toUpperCase().trim(),
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });
  }
}

export const referralService = new ReferralService();
