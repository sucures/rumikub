import { apiClient } from './client';
import type { Game } from '../../shared/types';

export async function getGame(id: string): Promise<Game> {
  const { data } = await apiClient.get<{ success: boolean; game: Game }>(`/api/game/${id}`);
  if (!data.success || !data.game) {
    throw new Error('Game not found');
  }
  return data.game;
}
