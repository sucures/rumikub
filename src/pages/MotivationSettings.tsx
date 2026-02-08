import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getTodayMotivation, setUserMotivation } from '../api/motivation';
import Button from '../components/ui/Button';

export default function MotivationSettingsPage() {
  const { token, premium } = useUserStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setInitialLoading(false);
      return;
    }
    getTodayMotivation()
      .then(({ text: t }) => setText(t))
      .catch(() => setText(''))
      .finally(() => setInitialLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter a motivational phrase');
      return;
    }
    setLoading(true);
    try {
      await setUserMotivation(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!premium) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-gray-400">
          Custom motivational phrases are available for premium users.{' '}
          <Link to="/" className="text-amber-400 hover:text-amber-300">Back to home</Link>
        </p>
      </main>
    );
  }

  if (initialLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link to="/" className="text-sm text-amber-400 hover:text-amber-300 mb-6 inline-block">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-white mb-2">Edit Motivation</h1>
      <p className="text-gray-400 mb-6">
        Set your personal motivational phrase. It will override the daily global phrase when you view it.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-300 mb-2">
            Your motivational phrase
          </label>
          <textarea
            id="motivation"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your personal motivation..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && <p className="text-green-400 text-sm">Saved successfully!</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </main>
  );
}
