import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';
import { useUserStore } from '../store/userStore';
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

function ReferralLink({ profile }: { profile: PublicProfile }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile.referralCode) return;
    const origin = window.location.origin;
    setLink(`${origin}/invite/${profile.referralCode}`);
  }, [profile.referralCode]);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!link) return null;
  return (
    <div className="card p-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">Referral link</label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={link}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-white text-sm truncate"
        />
        <Button onClick={handleCopy} size="sm">
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <Link to="/invite" className="text-xs text-amber-400 hover:text-amber-300 mt-2 inline-block">
        Full invite page →
      </Link>
    </div>
  );
}

export default function ProfilePage() {
  const { token } = useUserStore();
  const { profile, friends, isLoading, error, fetchProfile, fetchFriends } = useProfileStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchFriends();
    }
  }, [token, fetchProfile, fetchFriends]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      {error && (
        <div className="card p-4 mb-6 border-red-500/50 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
      ) : profile ? (
        <>
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <Avatar profile={profile} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{profile.username}</h1>
              {profile.country && (
                <p className="text-sm text-gray-400 mb-2">{profile.country}</p>
              )}
              {profile.bio && (
                <p className="text-gray-300 text-sm">{profile.bio}</p>
              )}
              <Link
                to="/profile/edit"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all"
              >
                Edit profile
              </Link>
            </div>
          </div>

          <div className="card p-6 mb-6">
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

          {profile.referralCode && <ReferralLink profile={profile} />}

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Friends</h3>
            <Link to="/friends" className="text-sm text-amber-400 hover:text-amber-300">
              Manage friends →
            </Link>
          </div>
          <div className="card divide-y divide-gray-700/50 mt-2">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No friends yet.</div>
            ) : (
              friends.slice(0, 5).map((f) => (
                <Link
                  key={f.id}
                  to={`/profile/${encodeURIComponent(f.friend?.username ?? '')}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-700/30 transition-colors"
                >
                  {f.friend?.avatarUrl || f.friend?.avatar ? (
                    <img
                      src={f.friend.avatarUrl ?? f.friend.avatar ?? ''}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-sm">
                      {(f.friend?.username ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-white font-medium">{f.friend?.username ?? 'Unknown'}</span>
                </Link>
              ))
            )}
          </div>
          {friends.length > 5 && (
            <Link
              to="/friends"
              className="block mt-2 text-center text-sm text-amber-400 hover:text-amber-300"
            >
              View all {friends.length} friends
            </Link>
          )}
        </>
      ) : (
        <div className="card p-8 text-center text-gray-400">Failed to load profile.</div>
      )}
    </main>
  );
}
