// Notification dispatcher — orchestrates in-app + push notifications
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { pushTokens } from '../db/schema.js';
import { notificationService } from './notificationService.js';
import { sendExpoPush, isValidExpoPushToken } from '../utils/expoPush.js';
import { markTokenInvalid } from './schedulerHelpers.js';
import type { NotificationType } from '../db/schema.js';

const DEEP_LINK_SCHEME = 'rumimind';

export interface InAppPayload {
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: { screen?: string; url?: string; notificationId?: string; [key: string]: unknown };
}

export function resolveDeepLink(
  type: NotificationType,
  metadata: Record<string, unknown>
): { screen: string; url: string } {
  switch (type) {
    case 'friend_request': {
      const username = (metadata.senderUsername as string) ?? '';
      const encoded = encodeURIComponent(username);
      return {
        screen: 'profile/public',
        url: `${DEEP_LINK_SCHEME}://profile/public?username=${encoded}`,
      };
    }
    case 'tournament_start': {
      const tid = (metadata.tournamentId as string) ?? '';
      return {
        screen: 'tournaments/lobby',
        url: `${DEEP_LINK_SCHEME}://tournaments/lobby?id=${encodeURIComponent(tid)}`,
      };
    }
    case 'match_ready': {
      const mid = (metadata.matchId as string) ?? '';
      const tid = (metadata.tournamentId as string) ?? '';
      const params = mid ? `matchId=${encodeURIComponent(mid)}` : `id=${encodeURIComponent(tid)}`;
      return {
        screen: mid ? 'tournaments/match' : 'tournaments/lobby',
        url: mid
          ? `${DEEP_LINK_SCHEME}://tournaments/match?matchId=${encodeURIComponent(mid)}`
          : `${DEEP_LINK_SCHEME}://tournaments/lobby?id=${encodeURIComponent(tid)}`,
      };
    }
    case 'club_invite': {
      const cid = (metadata.clubId as string) ?? '';
      return {
        screen: 'clubs/view',
        url: `${DEEP_LINK_SCHEME}://clubs/view?id=${encodeURIComponent(cid)}`,
      };
    }
    case 'referral_reward':
      return { screen: 'invite', url: `${DEEP_LINK_SCHEME}://invite` };
    case 'system':
    default:
      return { screen: 'profile/me', url: `${DEEP_LINK_SCHEME}://profile/me` };
  }
}

export async function sendInAppNotification(
  userId: string,
  payload: InAppPayload
): Promise<{ id: string }> {
  const dto = await notificationService.createNotification(
    userId,
    payload.type,
    payload.title,
    payload.message,
    payload.metadata
  );
  return { id: dto.id };
}

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  const rows = await db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  const validRows = rows.filter((r) => r.invalidAt == null && isValidExpoPushToken(r.token));
  if (validRows.length === 0) return;

  const data = payload.data ?? {};
  for (const row of validRows) {
    try {
      await sendExpoPush(row.token, payload.title, payload.body, { ...data });
      console.log('[push] Sent to user', userId);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      if (msg === 'DeviceNotRegistered') {
        await markTokenInvalid(row.id).catch((e) => console.warn('[push] markTokenInvalid failed:', e));
      }
      console.warn('[push] Failed to send to user', userId, msg);
    }
  }
}
