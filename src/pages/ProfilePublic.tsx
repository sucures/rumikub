import React, { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getPublicProfile } from '../api/profile';
import { sendFriendRequest } from '../api/friends';
import { apiClient } from '../api/client';
import Button from '../components/ui/Button';
import type { PublicProfile } from '../api/profile';

function Avatar({ profile }: { profile: PublicProfile }) {
  const url = profile.avatarUrl ?? profile.avatar;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
      />
    );
  }
  return (
    <div className="w-24 h-24 rounded-full bg-amber-500/30 border-2 border-amber-500/50 flex items-center justify-center text-3xl">
      {(profile.username || '?')[0].toUpperCase()}
    </div>
  );
}

export default function ProfilePublicPage() {
  const { username } = useParams<{ username: string }>();
  const { token, userId } = useUserStore();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friends' | 'pending' | 'sent'>('none');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    getPublicProfile(username)
      .then((p) => {
        setProfile(p);
        if (token && userId && p.id !== userId) {
          // Check friend status - we need to call API or use friends store
          checkFriendStatus(p.id);
        } else if (p.id === userId) {
          setFriendStatus('none');
        }
      })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false));
  }, [username, token, userId]);

  async function checkFriendStatus(targetId: string) {
    if (!token || !userId) return;
    try {
      const { data } = await apiClient.get<{ success: boolean; friends: { friendId: string }[] }>('/api/friends');
      if (data.success && data.friends) {
        const isFriend = data.friends.some((f: { friendId: string }) => f.friendId === targetId);
        if (isFriend) {
          setFriendStatus('friends');
          return;
        }
      }
      const { data: reqData } = await apiClient.get<{ success: boolean; pending: { requesterId: string }[]; sent: { targetId: string }[] }>('/api/friends/requests');
      if (reqData.success) {
        const pending = reqData.pending?.some((r: { requesterId: string }) => r.requesterId === targetId);
        const sent = reqData.sent?.some((s: { targetId: string }) => s.targetId === targetId);
        if (pending) setFriendStatus('pending');
        else if (sent) setFriendStatus('sent');
        else setFriendStatus('none');
      }
    } catch {
      setFriendStatus('none');
    }
  }

  const handleAddFriend = async () => {
    if (!profile || !token || profile.id === userId) return;
    setSending(true);
    try {
      await sendFriendRequest(profile.id);
      setFriendStatus('sent');
    } catch {
      setError('Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (!username) return <Navigate to="/profile/me" replace />;
  if (!token) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        <Link to="/profile/me" className="text-gray-400 hover:text-white">← Profile</Link>
        <div className="card p-8 mt-8 text-center text-gray-400">{error ?? 'User not found'}</div>
      </main>
    );
  }

  const isOwnProfile = profile.id === userId;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to={isOwnProfile ? '/profile/me' : '/'}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> {isOwnProfile ? 'My profile' : 'Back'}
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        <Avatar profile={profile} />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
            {!isOwnProfile && (
              friendStatus === 'none' ? (
                <Button onClick={handleAddFriend} disabled={sending} size="sm">
                  {sending ? 'Sending...' : 'Add friend'}
                </Button>
              ) : friendStatus === 'friends' ? (
                <span className="px-3 py-1 rounded-full text-xs bg-green-900/50 text-green-400">
                  Friends
                </span>
              ) : friendStatus === 'pending' ? (
                <span className="px-3 py-1 rounded-full text-xs bg-amber-900/50 text-amber-400">
                  Pending
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-400">
                  Request sent
                </span>
              )
            )}
          </div>
          {profile.country && (
            <p className="text-sm text-gray-400 mb-2">{profile.country}</p>
          )}
          {profile.bio && (
            <p className="text-gray-300 text-sm">{profile.bio}</p>
          )}
          {isOwnProfile && (
            <Link
              to="/profile/edit"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all"
            >
              Edit profile
            </Link>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-2xl font-bold text-amber-400">{profile.stats.gamesPlayed}</span>
            <span className="block text-xs text-gray-500">Games played</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-green-400">{profile.stats.gamesWon}</span>
            <span className="block text-xs text-gray-500">Wins</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-amber-400">{profile.stats.totalScore}</span>
            <span className="block text-xs text-gray-500">Total score</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-cyan-400">{profile.stats.tournamentsWon}</span>
            <span className="block text-xs text-gray-500">Tournaments won</span>
          </div>
        </div>
      </div>
    </main>
  );
}
