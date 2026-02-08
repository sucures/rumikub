import { create } from 'zustand';
import type { Notification } from '../types/notification';
import {
  listNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
} from '../api/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (options?: { unreadOnly?: boolean }) => Promise<void>;
  setNotifications: (notifications: Notification[], unreadCount: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),

  fetchNotifications: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const res = await listNotifications(options);
      set({ notifications: res.notifications, unreadCount: res.unreadCount });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch notifications' });
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: (id) => {
    set((s) => {
      const n = s.notifications.find((x) => x.id === id);
      if (!n || n.isRead) return s;
      return {
        notifications: s.notifications.map((x) =>
          x.id === id ? { ...x, isRead: true } : x
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      };
    });
    apiMarkAsRead(id).catch(() => {});
  },

  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((x) => ({ ...x, isRead: true })),
      unreadCount: 0,
    }));
    apiMarkAllAsRead().catch(() => {});
  },

  clearError: () => set({ error: null }),
}));
