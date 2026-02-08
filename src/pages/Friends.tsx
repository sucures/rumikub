import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';
import { useUserStore } from '../store/userStore';
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '../api/friends';
import type { PendingRequest, SentRequest } from '../api/friends';
import Button from '../components/ui/Button';

type Tab = 'friends' | 'pending' | 'sent';

function FriendAvatar({ friend }: { friend?: { avatar?: string | null; avatarUrl?: string | null; username?: string } }) {
  const url = friend?.avatarUrl ?? friend?.avatar;
  if (url) {
    return (
      <img src={url} alt="" className="w-10 h-10 rounded-full object-cover" />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm text-gray-300">
      {(friend?.username ?? '?')[0].toUpperCase()}
    </div>
  );
}

export default function FriendsPage() {
  const { token } = useUserStore();
  const { friends, pendingRequests, fetchFriends } = useProfileStore();
  const [sent, setSent] = useState<SentRequest[]>([]);
  const [tab, setTab] = useState<Tab>('friends');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchFriends();
      getFriendRequests().then((r) => setSent(r.sent));
    }
  }, [token, fetchFriends]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const handleAccept = async (requestId: string) => {
    setLoading(true);
    try {
      await acceptFriendRequest(requestId);
      await fetchFriends();
      const r = await getFriendRequests();
      setSent(r.sent);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoading(true);
    try {
      await rejectFriendRequest(requestId);
      await fetchFriends();
      const r = await getFriendRequests();
      setSent(r.sent);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (friendId: string) => {
    setLoading(true);
    try {
      await removeFriend(friendId);
      await fetchFriends();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/profile/me"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Profile
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Friends
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Manage your friends and friend requests.
      </p>

      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'friends'
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Pending ({pendingRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'sent'
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {tab === 'friends' && (
        <div className="card divide-y divide-gray-700/50">
          {friends.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No friends yet. Find players in games or tournaments and add them.
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <Link
                  to={`/profile/${encodeURIComponent(f.friend?.username ?? '')}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <FriendAvatar friend={f.friend} />
                  <span className="font-medium text-white truncate">
                    {f.friend?.username ?? 'Unknown'}
                  </span>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemove(f.friendId)}
                  disabled={loading}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'pending' && (
        <div className="card divide-y divide-gray-700/50">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No pending requests.
            </div>
          ) : (
            pendingRequests.map((r: PendingRequest) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <Link
                  to={`/profile/${encodeURIComponent(r.requesterUsername ?? '')}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {r.requesterAvatar ? (
                    <img
                      src={r.requesterAvatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm text-gray-300">
                      {(r.requesterUsername ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-white truncate">
                    {r.requesterUsername ?? 'Unknown'}
                  </span>
                </Link>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(r.id)}
                    disabled={loading}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReject(r.id)}
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'sent' && (
        <div className="card divide-y divide-gray-700/50">
          {sent.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No sent requests.
            </div>
          ) : (
            sent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <Link
                  to={`/profile/${encodeURIComponent(r.targetUsername ?? '')}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm text-gray-300">
                    {(r.targetUsername ?? '?')[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-white truncate">
                    {r.targetUsername ?? 'Unknown'}
                  </span>
                </Link>
                <span className="text-xs text-gray-500">Pending</span>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
