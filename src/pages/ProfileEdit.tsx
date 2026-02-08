import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../store/profileStore';
import { useUserStore } from '../store/userStore';
import { updateProfile } from '../api/profile';
import Button from '../components/ui/Button';

export default function ProfileEditPage() {
  const { token } = useUserStore();
  const { profile, fetchProfile } = useProfileStore();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setCountry(profile.country ?? '');
      setAvatarUrl(profile.avatarUrl ?? profile.avatar ?? '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateProfile({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      await fetchProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/profile/me"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Profile
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Edit profile
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Update your username, avatar, bio, and country.
      </p>

      {error && (
        <div className="card p-4 mb-6 border-red-500/50 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="card p-4 mb-6 border-green-500/50 bg-green-900/20 text-green-300 text-sm">
          Profile saved!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="Your username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="https://..."
          />
          {avatarUrl && (
            <div className="mt-2">
              <img
                src={avatarUrl}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border border-gray-600"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            placeholder="Tell us about yourself"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            placeholder="e.g. United States"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <Link to="/profile/me">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </main>
  );
}
