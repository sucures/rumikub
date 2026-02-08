import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { apiClient } from '../api/client';
import {
  listTournaments,
  type ListTournamentsFilters,
} from '../api/tournament';
import type { TournamentWithDetailsDto } from '../../shared/types';

export default function TournamentsPage() {
  const navigate = useNavigate();
  const { token, premium, setMe } = useUserStore();
  const [filters, setFilters] = useState<ListTournamentsFilters>({
    status: 'open',
    freeOnly: false,
    premiumOnly: false,
  });

  useEffect(() => {
    if (!token) return;
    apiClient
      .get<{ success: boolean; user: { premium?: boolean; coins?: number } }>('/api/auth/me')
      .then(({ data }) => {
        if (data.success && data.user) setMe(data.user);
      })
      .catch(() => {});
  }, [token, setMe]);

  const { data: tournaments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tournaments', filters],
    queryFn: () => listTournaments(filters),
    enabled: !!token,
  });

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
            Tournaments
          </h1>
          <p className="text-sm text-gray-400">
            Join or create tournaments. Premium users can create.
          </p>
        </div>
        {token && premium && (
          <Link
            to="/tournaments/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-200"
          >
            Create Tournament
          </Link>
        )}
      </div>

      {!token ? (
        <div className="card p-8 sm:p-10 text-center animate-fade-in-up">
          <p className="text-gray-400">Log in to view and join tournaments.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500"
          >
            Go to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: 'open', freeOnly: false, premiumOnly: false }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'open' && !filters.freeOnly && !filters.premiumOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Open
            </button>
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: 'open', freeOnly: true, premiumOnly: false }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.freeOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Free Only
            </button>
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: 'open', freeOnly: false, premiumOnly: true }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.premiumOnly
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Entry Fee
            </button>
          </div>

          {error && (
            <div className="card p-4 mb-6 border-red-500/50 bg-red-900/20 text-red-300">
              {error instanceof Error ? error.message : 'Failed to load tournaments'}
            </div>
          )}

          {isLoading ? (
            <div className="card p-8 text-center text-gray-400 animate-pulse-subtle">Loading...</div>
          ) : tournaments.length === 0 ? (
            <div className="card p-8 sm:p-10 text-center animate-fade-in-up">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-700/40 flex items-center justify-center text-3xl" aria-hidden>
                🏆
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No tournaments</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-sm mx-auto">
                {filters.freeOnly || filters.premiumOnly
                  ? 'No tournaments match your filters. Try "All Open".'
                  : 'No open tournaments yet. Create one if you have Premium.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tournaments.map((t: TournamentWithDetailsDto, i: number) => (
                <li key={t.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="card card-hover flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 block transition-all duration-200"
                  >
                    <div>
                      <span className="font-medium text-white">{t.name}</span>
                      <p className="text-sm text-gray-400 mt-0.5">
                        by {t.creatorUsername} · {t.participantCount}/{t.maxPlayers} players
                        {t.entryFee > 0 && ` · ${t.entryFee} coins entry`}
                        {t.prizePool > 0 && ` · Prize: ${t.prizePool}`}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-700/60 text-gray-300 shrink-0">
                      {t.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
