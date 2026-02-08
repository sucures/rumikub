import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';
import { getMatch, reportMatchWinner, getTournament } from '../api/tournament';
import { getMatchReviewStatus } from '../api/antiCheat';
import type { TournamentMatch } from '../api/tournament';
import Button from '../components/ui/Button';

export default function TournamentMatchPage() {
  const { id: tournamentId, matchId } = useParams<{ id: string; matchId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, userId } = useUserStore();
  const { fetchWallet } = useWalletStore();
  const [reportingWinner, setReportingWinner] = useState<string | null>(null);

  const { data: match, isLoading, error } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatch(matchId!),
    enabled: !!matchId && !!token,
  });

  const { data: tournament } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId!),
    enabled: !!tournamentId && !!token,
  });

  const { data: matchReview } = useQuery({
    queryKey: ['match-review', matchId],
    queryFn: () => getMatchReviewStatus(matchId!),
    enabled: !!matchId && !!token,
  });

  const reportMutation = useMutation({
    mutationFn: ({ mId, winnerId }: { mId: string; winnerId: string }) =>
      reportMatchWinner(mId, winnerId),
    onSuccess: (result) => {
      setReportingWinner(null);
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-rounds', tournamentId] });
      fetchWallet();
      if (result.tournamentFinished) {
        navigate(`/tournaments/${tournamentId}`);
      }
    },
    onError: (err) => {
      setReportingWinner(null);
      alert(err instanceof Error ? err.message : 'Failed to report winner');
    },
  });

  const handleReportWinner = (winnerId: string) => {
    if (!matchId) return;
    setReportingWinner(winnerId);
    reportMutation.mutate({ mId: matchId, winnerId });
  };

  const handlePlayMatch = () => {
    // For MVP: create/join game via rooms API and redirect
    // For now, show message - full game integration would create a room and redirect to /game/:gameId
    alert('Play Match: Create a game room for this match and redirect. Full integration in next step.');
  };

  if (!token) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/tournaments" className="text-gray-400 hover:text-white">← Tournaments</Link>
        <div className="card p-8 mt-8 text-center">
          <p className="text-gray-400">Log in to view matches.</p>
        </div>
      </main>
    );
  }

  if (!tournamentId || !matchId) {
    navigate('/tournaments');
    return null;
  }

  if (isLoading || !match) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to={`/tournaments/${tournamentId}`} className="text-gray-400 hover:text-white">← Tournament</Link>
        <div className="card p-8 mt-8 text-center text-gray-400 animate-pulse-subtle">
          {error ? (error instanceof Error ? error.message : 'Match not found') : 'Loading...'}
        </div>
      </main>
    );
  }

  const canReport =
    match.status !== 'finished' &&
    (match.player1Id === userId ||
      match.player2Id === userId ||
      tournament?.creatorUserId === userId);

  const p1Name = match.player1Username ?? 'TBD';
  const p2Name = match.player2Username ?? 'Bye';
  const isBye = !match.player2Id;
  const underReview = matchReview?.underReview ?? false;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to={`/tournaments/${tournamentId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Tournament
      </Link>

      <div className="card p-6 sm:p-8">
        {underReview && (
          <div className="mb-4 py-3 px-4 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-200 text-sm">
            This match is under fair-play review.
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">
            Round {match.roundNumber} · Match {match.tableNumber}
          </h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              match.status === 'finished'
                ? 'bg-green-900/40 text-green-300'
                : match.status === 'in_progress'
                ? 'bg-amber-900/40 text-amber-300'
                : 'bg-gray-700/60 text-gray-400'
            }`}
          >
            {match.status}
          </span>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/40">
            {match.player1Username ? (
              <Link
                to={`/profile/${encodeURIComponent(match.player1Username)}`}
                className="font-medium text-white hover:text-amber-400 transition-colors"
              >
                {p1Name}
              </Link>
            ) : (
              <span className="font-medium text-white">{p1Name}</span>
            )}
            {match.winnerId === match.player1Id && (
              <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">Winner</span>
            )}
          </div>
          <div className="text-center text-gray-500 text-sm">vs</div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/40">
            {match.player2Username ? (
              <Link
                to={`/profile/${encodeURIComponent(match.player2Username)}`}
                className="font-medium text-white hover:text-amber-400 transition-colors"
              >
                {p2Name}
              </Link>
            ) : (
              <span className="font-medium text-white">{p2Name}</span>
            )}
            {match.winnerId === match.player2Id && (
              <span className="text-xs px-2 py-1 rounded bg-amber-900/40 text-amber-300">Winner</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {match.status !== 'finished' && !isBye && (
            <Button onClick={handlePlayMatch} fullWidth>
              Play Match
            </Button>
          )}
          {canReport && !isBye && (
            <>
              {match.player1Id && (
                <Button
                  variant="secondary"
                  onClick={() => handleReportWinner(match.player1Id!)}
                  disabled={reportMutation.isPending || reportingWinner !== null}
                  fullWidth
                >
                  {reportingWinner === match.player1Id ? 'Reporting...' : `Report ${p1Name} wins`}
                </Button>
              )}
              {match.player2Id && (
                <Button
                  variant="secondary"
                  onClick={() => handleReportWinner(match.player2Id!)}
                  disabled={reportMutation.isPending || reportingWinner !== null}
                  fullWidth
                >
                  {reportingWinner === match.player2Id ? 'Reporting...' : `Report ${p2Name} wins`}
                </Button>
              )}
            </>
          )}
        </div>

        {match.status === 'finished' && match.winnerUsername && (
          <p className="mt-4 text-sm text-amber-400">
            Winner:{' '}
            <Link
              to={`/profile/${encodeURIComponent(match.winnerUsername)}`}
              className="hover:text-amber-300"
            >
              {match.winnerUsername}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
