import { create } from 'zustand';
import type { Game } from '../../shared/types';

interface GameState {
  game: Game | null;
  currentGameId: string | null;
  roomId: string | null;
  lastScores: Record<string, number> | null;
  setGameState: (game: Game | null) => void;
  setCurrentGameId: (id: string | null) => void;
  setRoomId: (id: string | null) => void;
  setLastScores: (scores: Record<string, number> | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: null,
  currentGameId: null,
  roomId: null,
  lastScores: null,
  setGameState: (game) => set({ game }),
  setCurrentGameId: (id) => set({ currentGameId: id }),
  setRoomId: (id) => set({ roomId: id }),
  setLastScores: (scores) => set({ lastScores: scores }),
  resetGame: () =>
    set({
      game: null,
      currentGameId: null,
      roomId: null,
      lastScores: null,
    }),
}));
