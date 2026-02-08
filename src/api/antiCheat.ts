// Anti-cheat API (Step 25)
import { apiClient } from './client';

export interface AntiCheatMe {
  reputation: number;
  hasSuspicious: boolean;
}

export async function getAntiCheatMe(): Promise<AntiCheatMe> {
  const { data } = await apiClient.get<{ success: boolean; reputation: number; hasSuspicious: boolean }>(
    '/api/anti-cheat/me'
  );
  if (!data.success) throw new Error('Failed to get anti-cheat status');
  return { reputation: data.reputation ?? 100, hasSuspicious: data.hasSuspicious ?? false };
}

export async function logGameAction(
  gameId: string,
  actionType: string,
  payload?: Record<string, unknown>,
  matchId?: string
): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `/api/game/${gameId}/log`,
    { actionType, payload: payload ?? {}, matchId }
  );
  if (!data.success) throw new Error('Failed to log action');
}

export async function getTournamentReviewStatus(tournamentId: string): Promise<{ underReview: boolean }> {
  const { data } = await apiClient.get<{ success: boolean; underReview: boolean }>(
    `/api/anti-cheat/tournament/${tournamentId}/status`
  );
  if (!data.success) return { underReview: false };
  return { underReview: data.underReview ?? false };
}

export async function getMatchReviewStatus(matchId: string): Promise<{ underReview: boolean }> {
  const { data } = await apiClient.get<{ success: boolean; underReview: boolean }>(
    `/api/anti-cheat/match/${matchId}/status`
  );
  if (!data.success) return { underReview: false };
  return { underReview: data.underReview ?? false };
}

export async function validateGameMove(gameId: string, move: unknown): Promise<{ valid: boolean; error?: string }> {
  const { data } = await apiClient.post<{ success: boolean; valid: boolean; error?: string }>(
    `/api/game/${gameId}/validate-move`,
    { move }
  );
  return { valid: data.valid ?? false, error: data.error };
}
