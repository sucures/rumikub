import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';
import {
  getTournament,
  joinTournament,
  startTournament,
  finishTournament,
  getTournamentChat,
  sendTournamentChat,
  getTournamentRounds,
} from '../api/tournament';
import { getTournamentReviewStatus } from '../api/antiCheat';
import type { TournamentRound } from '../api/tournament';
import type { TournamentWithDetailsDto } from '../../shared/types';
import Button from '../components/ui/Button';

export default function TournamentLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, userId, premium } = useUserStore();
  const { fetchWallet } = useWalletStore();
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'players' | 'matches' | 'rounds'>('players');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: tournament, isLoading, error, refetch } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => getTournament(id!),
    enabled: !!id && !!token,
  });

  const { data: rounds = [] } = useQuery({
    queryKey: ['tournament-rounds', id],
    queryFn: () => getTournamentRounds(id!),
    enabled: !!id && !!token && (tournament?.status === 'in_progress' || tournament?.status === 'finished'),
  });

  const { data: tournamentReview } = useQuery({
    queryKey: ['tournament-review', id],
    queryFn: () => getTournamentReviewStatus(id!),
    enabled: !!id && !!token,
  });

  const { data: chatMessages = [], refetch: refetchChat } = useQuery({
    queryKey: ['tournament-chat', id],
    queryFn: () => getTournamentChat(id!, 50),
    enabled: !!id && !!token,
    refetchInterval: 5000,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinTournament(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      fetchWallet();
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Failed to join');
    },
  });

  const startMutation = useMutation({
    mutationFn: () => startTournament(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', id] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Failed to start');
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => finishTournament(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      fetchWallet();
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Failed to finish');
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: (msg: string) => sendTournamentChat(id!, msg),
    onSuccess: () => {
      setChatMessage('');
      refetchChat();
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/tournaments" className="text-gray-400 hover:text-white">← Tournaments</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to view tournaments.</p>
        </div>
      </main>
    );
  }

  if (!id) {
    navigate('/tournaments');
    return null;
  }

  if (isLoading || !tournament) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/tournaments" className="text-gray-400 hover:text-white">← Tournaments</Link>
        <div className="card p-8 mt-8 text-center text-gray-400 animate-pulse-subtle">
          {error ? (error instanceof Error ? error.message : 'Tournament not found') : 'Loading...'}
        </div>
      </main>
    );
  }

  const isCreator = tournament.creatorUserId === userId;
  const hasJoined = tournament.participants.some((p) => p.userId === userId);
  const canJoin = tournament.status === 'open' && !hasJoined && tournament.participantCount < tournament.maxPlayers;
  const canStart = isCreator && tournament.status === 'open' && tournament.participantCount >= 2;
  const canFinish = isCreator && tournament.status === 'in_progress';

  const handleJoin = () => joinMutation.mutate();
  const handleStart = () => startMutation.mutate();
  const handleFinish = () => finishMutation.mutate();
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendChatMutation.mutate(chatMessage.trim());
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Tournaments
      </Link>

      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{tournament.name}</h1>
            <p className="text-sm text-gray-400">
              by{' '}
            <Link to={`/profile/${encodeURIComponent(tournament.creatorUsername ?? '')}`} className="text-amber-400 hover:text-amber-300">
              {tournament.creatorUsername}
            </Link>
            {' '}· {tournament.participantCount}/{tournament.maxPlayers} players
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {tournamentReview?.underReview && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-900/60 text-amber-200">
                Tournament under review
              </span>
            )}
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                tournament.status === 'open'
                  ? 'bg-green-900/40 text-green-300'
                  : tournament.status === 'in_progress'
                  ? 'bg-amber-900/40 text-amber-300'
                  : 'bg-gray-700/60 text-gray-400'
              }`}
            >
              {tournament.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-gray-800/40">
            <span className="text-xs text-gray-500 block">Entry fee</span>
            <span className="font-semibold text-white">{tournament.entryFee} coins</span>
          </div>
          <div className="p-3 rounded-lg bg-gray-800/40">
            <span className="text-xs text-gray-500 block">Prize pool</span>
            <span className="font-semibold text-amber-400">{tournament.prizePool} coins</span>
          </div>
          {tournament.ruleset && (
            <>
              <div className="p-3 rounded-lg bg-gray-800/40">
                <span className="text-xs text-gray-500 block">Turn time</span>
                <span className="font-semibold text-white">{tournament.ruleset.turnTimeSeconds}s</span>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/40">
                <span className="text-xs text-gray-500 block">Jokers</span>
                <span className="font-semibold text-white">{tournament.ruleset.allowJokers ? 'Yes' : 'No'}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {canJoin && (
            <Button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Joining...' : 'Join Tournament'}
            </Button>
          )}
          {canStart && (
            <Button
              variant="secondary"
              onClick={handleStart}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? 'Starting...' : 'Start Tournament'}
            </Button>
          )}
          {canFinish && (
            <Button
              variant="danger"
              onClick={handleFinish}
              disabled={finishMutation.isPending}
            >
              {finishMutation.isPending ? 'Finishing...' : 'Finish Tournament'}
            </Button>
          )}
        </div>

        {(tournament.status === 'in_progress' || tournament.status === 'finished') && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('players')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'players' ? 'bg-amber-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Players
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'matches' ? 'bg-amber-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Matches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rounds')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'rounds' ? 'bg-amber-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Rounds
            </button>
          </div>
        )}

        <div>
          {activeTab === 'players' && (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Players</h3>
              {tournament.participants.length === 0 ? (
                <p className="text-sm text-gray-500">No players yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tournament.participants.map((p) => (
                    <li key={p.userId} className="flex items-center gap-3 text-sm">
                      {((p as { avatar?: string | null; avatarUrl?: string | null }).avatarUrl ?? (p as { avatar?: string | null }).avatar) ? (
                        <img
                          src={((p as { avatarUrl?: string | null }).avatarUrl ?? (p as { avatar?: string | null }).avatar) ?? ''}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300">
                          {(p.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <Link
                        to={`/profile/${encodeURIComponent(p.username ?? '')}`}
                        className="font-medium text-white hover:text-amber-400 transition-colors"
                      >
                        {p.username}
                      </Link>
                      {p.userId === tournament.creatorUserId && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">Creator</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {activeTab === 'matches' && (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Matches</h3>
              {rounds.length === 0 ? (
                <p className="text-sm text-gray-500">No matches yet. Start the tournament to create Round 1.</p>
              ) : (
                <ul className="space-y-2">
                  {rounds.flatMap((r: TournamentRound) =>
                    r.matches.map((m) => (
                      <li key={m.id}>
                        <Link
                          to={`/tournaments/${id}/matches/${m.id}`}
                          className="block p-3 rounded-lg bg-gray-800/40 hover:bg-gray-700/50 transition-colors"
                        >
                          <span className="text-sm text-white">
                            {m.player1Username ?? 'TBD'} vs {m.player2Username ?? 'Bye'}
                          </span>
                          {m.winnerUsername && (
                            <span className="ml-2 text-xs text-amber-400">→ {m.winnerUsername}</span>
                          )}
                          <span className="ml-2 text-xs text-gray-500">
                            Round {m.roundNumber} · {m.status}
                          </span>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
          {activeTab === 'rounds' && (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Rounds</h3>
              {rounds.length === 0 ? (
                <p className="text-sm text-gray-500">No rounds yet.</p>
              ) : (
                <div className="space-y-4">
                  {rounds.map((r: TournamentRound) => (
                    <div key={r.id} className="p-4 rounded-lg bg-gray-800/40">
                      <h4 className="text-sm font-medium text-amber-400 mb-2">
                        Round {r.roundNumber} · {r.status}
                      </h4>
                      <ul className="space-y-1">
                        {r.matches.map((m) => (
                          <li key={m.id}>
                            <Link
                              to={`/tournaments/${id}/matches/${m.id}`}
                              className="text-sm text-gray-300 hover:text-white"
                            >
                              Match {m.tableNumber}: {m.player1Username ?? 'TBD'} vs{' '}
                              {m.player2Username ?? 'Bye'}
                              {m.winnerUsername && (
                                <span className="text-amber-400"> → {m.winnerUsername}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Chat</h3>
        <div
          className="h-48 overflow-y-auto mb-3 space-y-2 pr-2"
          style={{ minHeight: '12rem' }}
        >
          {chatMessages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            chatMessages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium text-amber-400">{m.username}</span>
                <span className="text-gray-400">: </span>
                <span className="text-gray-300">{m.message}</span>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSendChat} className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800/60 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
          <Button type="submit" disabled={!chatMessage.trim() || sendChatMutation.isPending}>
            Send
          </Button>
        </form>
      </div>
    </main>
  );
}
