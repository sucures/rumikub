import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { markNotificationAsRead, getNotificationLink } from '../api/notifications';
import type { Notification } from '../types/notification';

const POLL_INTERVAL_MS = 30 * 1000;

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export function NotificationBell() {
  const navigate = useNavigate();
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const poll = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    markNotificationAsRead(n.id).catch(() => {});
    setOpen(false);
    const link = getNotificationLink(n);
    if (link) navigate(link);
  };

  const last5 = notifications.slice(0, 5);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-gray-700/50 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        title="Notifications"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <span className="text-xl" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white">Notifications</h3>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {last5.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              last5.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 last:border-b-0 ${
                    !n.isRead ? 'bg-amber-900/10' : ''
                  }`}
                >
                  <div className="font-medium text-white text-sm">{n.title}</div>
                  <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.message}</div>
                  <div className="text-gray-500 text-[10px] mt-1">{formatTime(n.createdAt)}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
