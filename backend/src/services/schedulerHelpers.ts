// Scheduler helpers — queries for cron jobs
import { eq, and, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  tournaments,
  tournamentEntries,
  tournamentMatches,
  referralRewards,
  scheduledAnnouncements,
  pushTokens,
  users,
} from '../db/schema.js';

export interface UpcomingTournamentParticipant {
  tournamentId: string;
  userId: string;
}

export interface ReadyMatch {
  matchId: string;
  tournamentId: string;
  roundNumber: number;
  playerIds: string[];
}

export interface NewReferralReward {
  rewardId: string;
  userId: string;
  rewardCoins: number;
  rewardGems: number;
}

export interface ScheduledAnnouncement {
  id: string;
  title: string;
  message: string;
}

/** Find tournaments starting within the next 10 minutes and their registered participants */
export async function findUpcomingTournaments(): Promise<UpcomingTournamentParticipant[]> {
  const now = new Date();
  const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
  const rows = await db
    .select({
      tournamentId: tournaments.id,
      userId: tournamentEntries.userId,
    })
    .from(tournaments)
    .innerJoin(tournamentEntries, eq(tournamentEntries.tournamentId, tournaments.id))
    .where(
      and(
        eq(tournaments.status, 'open'),
        isNotNull(tournaments.scheduledStartAt),
        gte(tournaments.scheduledStartAt!, now),
        lte(tournaments.scheduledStartAt!, tenMinutesLater)
      )
    );
  return rows;
}

/** Find matches that have both players assigned and have not yet been notified */
export async function findReadyMatches(): Promise<ReadyMatch[]> {
  const rows = await db
    .select({
      matchId: tournamentMatches.id,
      tournamentId: tournamentMatches.tournamentId,
      roundNumber: tournamentMatches.roundNumber,
      player1Id: tournamentMatches.player1Id,
      player2Id: tournamentMatches.player2Id,
    })
    .from(tournamentMatches)
    .where(
      and(
        eq(tournamentMatches.status, 'pending'),
        isNotNull(tournamentMatches.player1Id),
        isNotNull(tournamentMatches.player2Id),
        isNull(tournamentMatches.matchReadyNotifiedAt)
      )
    );
  return rows.map((r) => ({
    matchId: r.matchId,
    tournamentId: r.tournamentId,
    roundNumber: r.roundNumber,
    playerIds: [r.player1Id!, r.player2Id!],
  }));
}

/** Find referral rewards that have not yet been notified */
export async function findNewReferralRewards(): Promise<NewReferralReward[]> {
  const rows = await db
    .select({
      id: referralRewards.id,
      userId: referralRewards.userId,
      rewardCoins: referralRewards.rewardCoins,
      rewardGems: referralRewards.rewardGems,
    })
    .from(referralRewards)
    .where(isNull(referralRewards.rewardNotifiedAt));
  return rows.map((r) => ({
    rewardId: r.id,
    userId: r.userId,
    rewardCoins: r.rewardCoins,
    rewardGems: r.rewardGems,
  }));
}

/** Find scheduled announcements due to be sent (scheduled_for <= now, sent_at is null) */
export async function findScheduledAnnouncements(): Promise<ScheduledAnnouncement[]> {
  const now = new Date();
  const rows = await db
    .select({
      id: scheduledAnnouncements.id,
      title: scheduledAnnouncements.title,
      message: scheduledAnnouncements.message,
    })
    .from(scheduledAnnouncements)
    .where(
      and(
        lte(scheduledAnnouncements.scheduledFor, now),
        isNull(scheduledAnnouncements.sentAt)
      )
    );
  return rows;
}

/** Delete push tokens flagged as invalid (DeviceNotRegistered). Returns count deleted. */
export async function cleanupInvalidTokens(): Promise<number> {
  const toDelete = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(isNotNull(pushTokens.invalidAt));
  let count = 0;
  for (const row of toDelete) {
    await db.delete(pushTokens).where(eq(pushTokens.id, row.id));
    count++;
  }
  return count;
}

/** Mark a match as having been notified */
export async function markMatchReadyNotified(matchId: string): Promise<void> {
  await db
    .update(tournamentMatches)
    .set({ matchReadyNotifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(tournamentMatches.id, matchId));
}

/** Mark a referral reward as having been notified */
export async function markRewardNotified(rewardId: string): Promise<void> {
  await db
    .update(referralRewards)
    .set({ rewardNotifiedAt: new Date() })
    .where(eq(referralRewards.id, rewardId));
}

/** Mark a scheduled announcement as sent */
export async function markAnnouncementSent(id: string): Promise<void> {
  await db
    .update(scheduledAnnouncements)
    .set({ sentAt: new Date() })
    .where(eq(scheduledAnnouncements.id, id));
}

/** Mark a push token as invalid (DeviceNotRegistered). Called by notification dispatcher. */
export async function markTokenInvalid(tokenId: string): Promise<void> {
  await db
    .update(pushTokens)
    .set({ invalidAt: new Date() })
    .where(eq(pushTokens.id, tokenId));
}

/** Get all user IDs for broadcast (system announcements) */
export async function getAllUserIds(): Promise<string[]> {
  const rows = await db.select({ id: users.id }).from(users);
  return rows.map((r) => r.id);
}
