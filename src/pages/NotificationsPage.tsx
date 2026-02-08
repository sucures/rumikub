import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationLink,
} from '../api/notifications';
import type { Notification } from '../types/notification';
import Button from '../components/ui/Button';

type Filter = 'all' | 'unread' | 'read';

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered =
    filter === 'read'
      ? notifications.filter((n) => n.isRead)
      : filter === 'unread'
        ? notifications.filter((n) => !n.isRead)
        : notifications;

  const handleMarkAsRead = (n: Notification) => {
    markAsRead(n.id);
    markNotificationAsRead(n.id).catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    markAllNotificationsAsRead().catch(() => {});
  };

  const emptyMessage =
    filter === 'all'
      ? 'No notifications yet.'
      : filter === 'unread'
        ? 'No unread notifications.'
        : 'No read notifications.';

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-amber-600 text-white'
                : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-700/60'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500 rounded-xl bg-gray-800/40 border border-gray-700/60">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const link = getNotificationLink(n);
            return (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-xl border transition-colors ${
                  n.isRead
                    ? 'bg-gray-800/40 border-gray-700/60'
                    : 'bg-amber-900/10 border-amber-800/40'
                }`}
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <span className="text-xl shrink-0" aria-hidden>
                    {getNotificationIcon(n.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-white">{n.title}</div>
                    <div className="text-gray-400 text-sm mt-0.5">{n.message}</div>
                    <div className="text-gray-500 text-xs mt-2">{formatTime(n.createdAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!n.isRead && (
                    <Button variant="secondary" size="sm" onClick={() => handleMarkAsRead(n)}>
                      Mark read
                    </Button>
                  )}
                  {link && (
                    <Link to={link}>
                      <Button variant="primary" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
