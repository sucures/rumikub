import { useUserStore } from '../store/userStore';
import type { Notification, NotificationListResponse } from '../types/notification';
import { NotificationType } from '../types/notification';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getAuthHeaders(): Record<string, string> {
  const token = useUserStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string })?.error ?? res.statusText ?? 'Request failed'
    );
  }
  if (data && typeof (data as { success?: boolean }).success === 'boolean' && !(data as { success: boolean }).success) {
    throw new Error((data as { error?: string })?.error ?? 'Request failed');
  }
  return data as T;
}

export async function listNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (options?.unreadOnly) params.set('unreadOnly', 'true');
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.offset != null) params.set('offset', String(options.offset));
  const q = params.toString();

  const res = await fetch(`${baseUrl}/api/notifications${q ? `?${q}` : ''}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data = await handleResponse<{
    success: boolean;
    notifications: Notification[];
    unreadCount: number;
  }>(res);

  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
  };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/api/notifications/read/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  await handleResponse<{ success: boolean }>(res);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  await handleResponse<{ success: boolean }>(res);
}

export async function registerPushToken(
  token: string,
  deviceInfo?: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/push/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ token, deviceInfo: deviceInfo ?? {} }),
  });

  await handleResponse<{ success: boolean }>(res);
}

export function getNotificationIcon(type: NotificationType | string): string {
  switch (type) {
    case NotificationType.friend_request:
      return '👋';
    case NotificationType.tournament_start:
      return '🏆';
    case NotificationType.match_ready:
      return '🎮';
    case NotificationType.club_invite:
      return '👥';
    case NotificationType.referral_reward:
      return '🎁';
    case NotificationType.system:
      return '📢';
    default:
      return '🔔';
  }
}

export function getNotificationLink(n: Notification): string | null {
  const m = n.metadata as Record<string, unknown>;
  switch (n.type) {
    case NotificationType.friend_request:
      return '/friends';
    case NotificationType.tournament_start:
    case NotificationType.match_ready:
      return typeof m?.tournamentId === 'string' ? `/tournaments/${m.tournamentId}` : '/tournaments';
    case NotificationType.club_invite:
      return typeof m?.clubId === 'string' ? `/clubs/${m.clubId}` : '/clubs';
    case NotificationType.referral_reward:
      return '/invite';
    default:
      return null;
  }
}
