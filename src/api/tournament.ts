import { apiClient } from './client';
import type { TournamentWithDetailsDto } from '../../shared/types';

export interface CreateTournamentBody {
  name: string;
  maxPlayers: 2 | 4 | 6 | 8;
  entryFee: number;
  ruleset?: {
    allowJokers?: boolean;
    tilesPerPlayer?: number;
    turnTimeSeconds?: number;
    maxPlayers?: number;
    customName?: string;
  };
  isPrivate?: boolean;
}

export interface ListTournamentsFilters {
  status?: string;
  freeOnly?: boolean;
  premiumOnly?: boolean;
}

export async function createTournament(body: CreateTournamentBody): Promise<TournamentWithDetailsDto> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetailsDto }>(
    '/api/tournaments',
    body
  );
  if (!data.success || !data.tournament) throw new Error('Failed to create tournament');
  return data.tournament;
}

export async function listTournaments(filters?: ListTournamentsFilters): Promise<TournamentWithDetailsDto[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.freeOnly) params.set('freeOnly', 'true');
  if (filters?.premiumOnly) params.set('premiumOnly', 'true');
  const qs = params.toString();
  const url = `/api/tournaments${qs ? `?${qs}` : ''}`;
  const { data } = await apiClient.get<{ success: boolean; tournaments: TournamentWithDetailsDto[] }>(url);
  if (!data.success) throw new Error('Failed to list tournaments');
  return data.tournaments ?? [];
}

export async function getTournament(id: string): Promise<TournamentWithDetailsDto> {
  const { data } = await apiClient.get<{ success: boolean; tournament: TournamentWithDetailsDto }>(
    `/api/tournaments/${id}`
  );
  if (!data.success || !data.tournament) throw new Error('Tournament not found');
  return data.tournament;
}

export async function joinTournament(id: string): Promise<TournamentWithDetailsDto> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetailsDto }>(
    `/api/tournaments/${id}/join`
  );
  if (!data.success || !data.tournament) throw new Error('Failed to join tournament');
  return data.tournament;
}

export async function startTournament(id: string): Promise<TournamentWithDetailsDto> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetailsDto }>(
    `/api/tournaments/${id}/start`
  );
  if (!data.success || !data.tournament) throw new Error('Failed to start tournament');
  return data.tournament;
}

export async function finishTournament(id: string, winnerUserId?: string): Promise<TournamentWithDetailsDto> {
  const { data } = await apiClient.post<{ success: boolean; tournament: TournamentWithDetailsDto }>(
    `/api/tournaments/${id}/finish`,
    { winnerUserId }
  );
  if (!data.success || !data.tournament) throw new Error('Failed to finish tournament');
  return data.tournament;
}

export interface TournamentChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

export async function getTournamentChat(id: string, limit?: number): Promise<TournamentChatMessage[]> {
  const url = limit ? `/api/tournaments/${id}/chat?limit=${limit}` : `/api/tournaments/${id}/chat`;
  const { data } = await apiClient.get<{ success: boolean; messages: TournamentChatMessage[] }>(url);
  if (!data.success) throw new Error('Failed to fetch chat');
  return data.messages ?? [];
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

export async function getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
  const { data } = await apiClient.get<{ success: boolean; matches: TournamentMatch[] }>(
    `/api/tournaments/${tournamentId}/matches`
  );
  if (!data.success) throw new Error('Failed to list matches');
  return data.matches ?? [];
}

export async function getTournamentRounds(tournamentId: string): Promise<TournamentRound[]> {
  const { data } = await apiClient.get<{ success: boolean; rounds: TournamentRound[] }>(
    `/api/tournaments/${tournamentId}/rounds`
  );
  if (!data.success) throw new Error('Failed to list rounds');
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

export async function sendTournamentChat(id: string, message: string): Promise<{ id: string; createdAt: string }> {
  const { data } = await apiClient.post<{ success: boolean; message: { id: string; createdAt: string } }>(
    `/api/tournaments/${id}/chat`,
    { message }
  );
  if (!data.success || !data.message) throw new Error('Failed to send message');
  return {
    id: data.message.id,
    createdAt:
      typeof data.message.createdAt === 'string'
        ? data.message.createdAt
        : (data.message.createdAt as Date).toISOString(),
  };
}
