import { apiClient } from './client';

export interface TournamentParticipant {
  userId: string;
  username: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  paidEntryFee: number;
  joinedAt: string;
}

export interface TournamentRuleset {
  id: string;
  allowJokers: boolean;
  tilesPerPlayer: number;
  turnTimeSeconds: number;
  maxPlayers: number;
  customName?: string | null;
}

export interface TournamentWithDetails {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  name: string;
  status: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: number;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  ruleset: TournamentRuleset | null;
  participants: TournamentParticipant[];
  participantCount: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  tableNumber: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Username: string | null;
  player2Username: string | null;
  winnerId: string | null;
  winnerUsername: string | null;
  gameId: string | null;
  status: string;
  createdAt: string;
}

export interface TournamentRound {
  id: string;
  tournamentId: string;
  roundNumber: number;
  status: string;
  matches: TournamentMatch[];
  createdAt: string;
}

export async function listTournaments(filters?: {
  status?: string;
  freeOnly?: boolean;
  premiumOnly?: boolean;
}): Promise<TournamentWithDetails[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.freeOnly) params.set('freeOnly', 'true');
  if (filters?.premiumOnly) params.set('premiumOnly', 'true');
  const qs = params.toString();
  const url = `/api/tournaments${qs ? `?${qs}` : ''}`;
  const { data } = await apiClient.get<{ success: boolean; tournaments: TournamentWithDetails[] }>(url);
  if (!data.success) throw new Error('Failed to list tournaments');
  return data.tournaments ?? [];
}

export async function getTournament(id: string): Promise<TournamentWithDetails> {
  const { data } = await apiClient.get<{ success: boolean; tournament: TournamentWithDetails }>(
    `/api/tournaments/${id}`
  );
  if (!data.success || !data.tournament) throw new Error('Tournament not found');
  return data.tournament;
}

export async function createTournament(body: {
  name: string;
  maxPlayers: 2 | 4 | 6 | 8;
  entryFee: number;
  ruleset?: { allowJokers?: boolean; tilesPerPlayer?: number; turnTimeSeconds?: number; maxPlayers?: number; customName?: string };
  isPrivate?: boolean;
}): Promise<TournamentWithDetails> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetails }>(
    '/api/tournaments',
    body
  );
  if (!data.success || !data.tournament) throw new Error('Failed to create tournament');
  return data.tournament;
}

export async function joinTournament(id: string): Promise<TournamentWithDetails> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetails }>(
    `/api/tournaments/${id}/join`
  );
  if (!data.success || !data.tournament) throw new Error('Failed to join tournament');
  return data.tournament;
}

export async function startTournament(id: string): Promise<TournamentWithDetails> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetails }>(
    `/api/tournaments/${id}/start`
  );
  if (!data.success || !data.tournament) throw new Error('Failed to start tournament');
  return data.tournament;
}

export async function getTournamentRounds(id: string): Promise<TournamentRound[]> {
  const { data } = await apiClient.get<{ success: boolean; rounds: TournamentRound[] }>(
    `/api/tournaments/${id}/rounds`
  );
  if (!data.success) throw new Error('Failed to fetch rounds');
  return data.rounds ?? [];
}

export async function getMatch(matchId: string): Promise<TournamentMatch> {
  const { data } = await apiClient.get<{ success: boolean; match: TournamentMatch }>(
    `/api/tournaments/matches/${matchId}`
  );
  if (!data.success || !data.match) throw new Error('Match not found');
  return data.match;
}

export async function reportMatchWinner(
  matchId: string,
  winnerId: string
): Promise<{ match: TournamentMatch; tournamentFinished: boolean }> {
  const { data } = await apiClient.post<{
    success: boolean;
    match: TournamentMatch;
    tournamentFinished: boolean;
  }>(`/api/tournaments/matches/${matchId}/report-winner`, { winnerId });
  if (!data.success || !data.match) throw new Error('Failed to report winner');
  return { match: data.match, tournamentFinished: data.tournamentFinished ?? false };
}
