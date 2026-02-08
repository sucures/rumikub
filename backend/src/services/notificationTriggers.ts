// Event-based notification triggers — unified system for in-app + push
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, tournaments, referralRewards } from '../db/schema.js';
import {
  sendInAppNotification,
  sendPushNotification,
  resolveDeepLink,
} from './notificationDispatcher.js';

async function dispatchNotification(
  userId: string,
  type: 'friend_request' | 'tournament_start' | 'match_ready' | 'club_invite' | 'referral_reward' | 'system',
  title: string,
  message: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const { id } = await sendInAppNotification(userId, { type, title, message, metadata });
    const { screen, url } = resolveDeepLink(type, metadata);
    await sendPushNotification(userId, {
      title,
      body: message,
      data: { screen, url, notificationId: id },
    });
  } catch (err: any) {
    console.warn('[notification] Trigger failed:', err);
  }
}

export async function triggerFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
  const rows = await db.select({ username: users.username }).from(users).where(eq(users.id, fromUserId)).limit(1);
  const senderUsername = rows[0]?.username ?? 'Someone';
  await dispatchNotification(toUserId, 'friend_request', 'New Friend Request', `${senderUsername} sent you a friend request`, {
    senderId: fromUserId,
    senderUsername,
  });
}

export async function triggerTournamentStarting(tournamentId: string, userId: string): Promise<void> {
  const rows = await db.select({ name: tournaments.name }).from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  const name = rows[0]?.name ?? 'Tournament';
  await dispatchNotification(userId, 'tournament_start', 'Tournament Started', `Your tournament "${name}" has started`, {
    tournamentId,
  });
}

export async function triggerMatchReady(matchId: string, userId: string, tournamentId: string, roundNumber: number): Promise<void> {
  await dispatchNotification(userId, 'match_ready', 'Your Match is Ready', `Round ${roundNumber} is starting`, {
    matchId,
    tournamentId,
    roundNumber,
  });
}

export async function triggerReferralReward(userId: string, rewardId: string, rewardCoins: number, rewardGems: number): Promise<void> {
  await dispatchNotification(userId, 'referral_reward', 'Referral Bonus', `You earned ${rewardCoins} coins and ${rewardGems} gems from a referral`, {
    rewardId,
    rewardCoins,
    rewardGems,
  });
}

export async function triggerSystemMessage(userId: string, title: string, message: string): Promise<void> {
  await dispatchNotification(userId, 'system', title, message, {});
}
