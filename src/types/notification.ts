/** Notification type enum for categorizing in-app and push notifications */
export enum NotificationType {
  friend_request = 'friend_request',
  tournament_start = 'tournament_start',
  match_ready = 'match_ready',
  club_invite = 'club_invite',
  referral_reward = 'referral_reward',
  system = 'system',
}

/** Single notification item */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

/** Response shape for list notifications API */
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}
