import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { createTournament } from '../api/tournament';
import Button from '../components/ui/Button';

const MAX_PLAYERS_OPTIONS = [2, 4, 6, 8] as const;
const TURN_TIME_OPTIONS = [30, 60, 90, 120] as const;

export default function TournamentCreatePage() {
  const navigate = useNavigate();
  const { token, premium } = useUserStore();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<2 | 4 | 6 | 8>(4);
  const [entryFee, setEntryFee] = useState(0);
  const [allowJokers, setAllowJokers] = useState(true);
  const [tilesPerPlayer, setTilesPerPlayer] = useState(14);
  const [turnTimeSeconds, setTurnTimeSeconds] = useState(60);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: createTournament,
    onSuccess: (t) => {
      navigate(`/tournaments/${t.id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({
      name: name.trim() || 'Untitled Tournament',
      maxPlayers,
      entryFee: Math.max(0, entryFee),
      ruleset: {
        allowJokers,
        tilesPerPlayer,
        turnTimeSeconds,
        maxPlayers,
      },
      isPrivate,
    });
  };

  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/" className="text-gray-400 hover:text-white">← Home</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to create tournaments.</p>
        </div>
      </main>
    );
  }

  if (!premium) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/tournaments" className="text-gray-400 hover:text-white">← Tournaments</Link>
        <div className="card p-8 mt-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Premium required</h2>
          <p className="text-gray-400">Only Premium users can create tournaments.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Tournaments
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        Create Tournament
      </h1>
      <p className="text-sm text-gray-400 mb-8">
        Configure rules and entry fee. Free users can join; only Premium users can create.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
            Tournament name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Tournament"
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-1.5">
            Max players
          </label>
          <select
            id="maxPlayers"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value) as 2 | 4 | 6 | 8)}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          >
            {MAX_PLAYERS_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} players</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="entryFee" className="block text-sm font-medium text-gray-300 mb-1.5">
            Entry fee (coins)
          </label>
          <input
            id="entryFee"
            type="number"
            min={0}
            value={entryFee}
            onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-600 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium text-gray-300">Rules</h3>
          <div className="flex items-center gap-3">
            <input
              id="allowJokers"
              type="checkbox"
              checked={allowJokers}
              onChange={(e) => setAllowJokers(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="allowJokers" className="text-sm text-gray-300">Allow jokers</label>
          </div>
          <div>
            <label htmlFor="tilesPerPlayer" className="block text-sm text-gray-400 mb-1">
              Tiles per player
            </label>
            <input
              id="tilesPerPlayer"
              type="number"
              min={1}
              max={20}
              value={tilesPerPlayer}
              onChange={(e) => setTilesPerPlayer(Math.max(1, Math.min(20, Number(e.target.value) || 14)))}
              className="w-24 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="turnTimeSeconds" className="block text-sm text-gray-400 mb-1">
              Turn time (seconds)
            </label>
            <select
              id="turnTimeSeconds"
              value={turnTimeSeconds}
              onChange={(e) => setTurnTimeSeconds(Number(e.target.value) || 60)}
              className="w-full sm:w-40 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-white"
            >
              {TURN_TIME_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}s</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isPrivate"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-gray-600 bg-gray-800 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="isPrivate" className="text-sm text-gray-300">Private tournament</label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Tournament'}
          </Button>
        </div>
      </form>
    </main>
  );
}
