// Friends service (Step 21) — friend requests, mutual friends
import { eq, and, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, friends } from '../db/schema.js';
import type { NewFriendRow } from '../db/schema.js';
import { triggerFriendRequest } from './notificationTriggers.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface FriendInfo {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  createdAt: Date;
  friend?: { id: string; username: string; avatar: string | null; avatarUrl: string | null };
}

export interface PendingRequest {
  id: string;
  requesterId: string;
  requesterUsername: string;
  requesterAvatar: string | null;
  createdAt: Date;
}

export class FriendsService {
  async sendFriendRequest(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) throw new Error('Cannot add yourself');
    const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!target[0]) throw new Error('User not found');

    const existing = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, targetId)),
          and(eq(friends.userId, targetId), eq(friends.friendId, userId))
        )
      );
    if (existing.length > 0) {
      const s = existing[0].status;
      if (s === 'accepted') throw new Error('Already friends');
      if (s === 'blocked') throw new Error('Cannot send request');
      if (existing[0].userId === userId) throw new Error('Request already sent');
      throw new Error('They have already sent you a request');
    }

    const row: NewFriendRow = {
      id: genId('friend'),
      userId,
      friendId: targetId,
      status: 'pending',
    };
    await db.insert(friends).values(row);

    triggerFriendRequest(userId, targetId).catch(() => {});
  }

  async acceptFriendRequest(userId: string, requestId: string): Promise<void> {
    const rows = await db.select().from(friends).where(eq(friends.id, requestId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('Request not found');
    if (row.friendId !== userId) throw new Error('Not your request to accept');
    if (row.status !== 'pending') throw new Error('Request already handled');

    await db.update(friends).set({ status: 'accepted' }).where(eq(friends.id, requestId));

    const reverseRow: NewFriendRow = {
      id: genId('friend'),
      userId: row.friendId,
      friendId: row.userId,
      status: 'accepted',
    };
    await db.insert(friends).values(reverseRow);
  }

  async rejectFriendRequest(userId: string, requestId: string): Promise<void> {
    const rows = await db.select().from(friends).where(eq(friends.id, requestId)).limit(1);
    const row = rows[0];
    if (!row) throw new Error('Request not found');
    if (row.friendId !== userId) throw new Error('Not your request to reject');
    await db.delete(friends).where(eq(friends.id, requestId));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friends)
      .where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId))
        )
      );
  }

  async listFriends(userId: string): Promise<FriendInfo[]> {
    const rows = await db
      .select()
      .from(friends)
      .where(and(eq(friends.userId, userId), eq(friends.status, 'accepted')));
    const result: FriendInfo[] = [];
    for (const r of rows) {
      const u = await db.select({ id: users.id, username: users.username, avatar: users.avatar, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, r.friendId)).limit(1);
      result.push({
        id: r.id,
        userId: r.userId,
        friendId: r.friendId,
        status: r.status,
        createdAt: r.createdAt,
        friend: u[0] ? { id: u[0].id, username: u[0].username, avatar: u[0].avatar, avatarUrl: (u[0] as { avatarUrl?: string | null }).avatarUrl ?? null } : undefined,
      });
    }
    return result;
  }

  async listPendingRequests(userId: string): Promise<PendingRequest[]> {
    const rows = await db
      .select()
      .from(friends)
      .where(and(eq(friends.friendId, userId), eq(friends.status, 'pending')));
    const result: PendingRequest[] = [];
    for (const r of rows) {
      const u = await db.select({ username: users.username, avatar: users.avatar }).from(users).where(eq(users.id, r.userId)).limit(1);
      result.push({
        id: r.id,
        requesterId: r.userId,
        requesterUsername: u[0]?.username ?? 'Unknown',
        requesterAvatar: u[0]?.avatar ?? null,
        createdAt: r.createdAt,
      });
    }
    return result;
  }

  async listSentRequests(userId: string): Promise<{ id: string; targetId: string; targetUsername: string; createdAt: Date }[]> {
    const rows = await db
      .select()
      .from(friends)
      .where(and(eq(friends.userId, userId), eq(friends.status, 'pending')));
    const result: { id: string; targetId: string; targetUsername: string; createdAt: Date }[] = [];
    for (const r of rows) {
      const u = await db.select({ username: users.username }).from(users).where(eq(users.id, r.friendId)).limit(1);
      result.push({
        id: r.id,
        targetId: r.friendId,
        targetUsername: u[0]?.username ?? 'Unknown',
        createdAt: r.createdAt,
      });
    }
    return result;
  }

  async areFriends(userId: string, targetId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.status, 'accepted'),
          or(
            and(eq(friends.userId, userId), eq(friends.friendId, targetId)),
            and(eq(friends.userId, targetId), eq(friends.friendId, userId))
          )
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async hasPendingRequest(userId: string, targetId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, targetId), eq(friends.status, 'pending')),
          and(eq(friends.userId, targetId), eq(friends.friendId, userId), eq(friends.status, 'pending'))
        )
      )
      .limit(1);
    return rows.length > 0;
  }
}

export const friendsService = new FriendsService();
