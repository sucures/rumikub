// Notification service (Step 26) — in-app + push notifications
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { notifications, pushTokens } from '../db/schema.js';
import type { NewNotificationRow, NewPushTokenRow } from '../db/schema.js';
import type { NotificationType } from '../db/schema.js';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): Promise<NotificationDto> {
    const id = genId('notif');
    const row: NewNotificationRow = {
      id,
      userId,
      type,
      title,
      message,
      metadata: metadata ?? {},
    };
    await db.insert(notifications).values(row);

    return {
      id,
      userId,
      type,
      title,
      message,
      metadata: metadata ?? {},
      isRead: false,
      createdAt: new Date(),
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);
    const row = rows[0];
    if (!row || row.userId !== userId) return false;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
    return true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async listNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number }
  ): Promise<{ notifications: NotificationDto[]; unreadCount: number }> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 100);

    const filtered = options?.unreadOnly ? rows.filter((r) => !r.isRead) : rows;
    const page = filtered.slice(offset, offset + limit);

    const unreadCount = rows.filter((r) => !r.isRead).length;

    return {
      notifications: page.map((r) => ({
        id: r.id,
        userId: r.userId,
        type: r.type as NotificationType,
        title: r.title,
        message: r.message,
        metadata: (r.metadata ?? {}) as Record<string, unknown>,
        isRead: r.isRead,
        createdAt: r.createdAt,
      })),
      unreadCount,
    };
  }

  async registerPushToken(userId: string, token: string, deviceInfo: Record<string, unknown> = {}): Promise<void> {
    const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token)).limit(1);
    const id = genId('push');
    if (existing.length > 0) {
      await db
        .update(pushTokens)
        .set({ userId, deviceInfo: deviceInfo ?? {}, createdAt: new Date() })
        .where(eq(pushTokens.token, token));
      return;
    }
    const row: NewPushTokenRow = {
      id,
      userId,
      token,
      deviceInfo: deviceInfo ?? {},
    };
    await db.insert(pushTokens).values(row);
  }

  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    _metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const tokens = await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
    if (tokens.length === 0) return;

    // Expo / FCM push: use expo-server-sdk or firebase-admin when available
    // For now we just store; real push delivery would go here
    // Example: await Expo.sendPushNotificationsAsync(tokens.map(t => ({ to: t.token, title, body: message })));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const rows = await db.select().from(notifications).where(eq(notifications.userId, userId));
    return rows.filter((r) => !r.isRead).length;
  }
}

export const notificationService = new NotificationService();
