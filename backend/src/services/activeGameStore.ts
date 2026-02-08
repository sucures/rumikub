/**
 * In-memory store for active games. Used by Socket.io handlers to get/update game state.
 * No persistence; process memory only.
 */
import type { Game } from '../shared/types.js';

const games = new Map<string, Game>();

export function getGame(gameId: string): Game | undefined {
  return games.get(gameId);
}

export function setGame(gameId: string, game: Game): void {
  games.set(gameId, game);
}

export function deleteGame(gameId: string): void {
  games.delete(gameId);
}

export const activeGameStore = {
  getGame,
  setGame,
  deleteGame,
};
