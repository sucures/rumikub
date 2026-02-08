import { create } from 'zustand';
import type { TournamentWithDetails, TournamentRound } from '../api/tournaments';

interface TournamentState {
  currentTournament: TournamentWithDetails | null;
  rounds: TournamentRound[];
  isLoading: boolean;
  error: string | null;
  setCurrentTournament: (t: TournamentWithDetails | null) => void;
  setRounds: (r: TournamentRound[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (e: string | null) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  currentTournament: null,
  rounds: [],
  isLoading: false,
  error: null,
  setCurrentTournament: (t) => set({ currentTournament: t }),
  setRounds: (r) => set({ rounds: r }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (e) => set({ error: e }),
}));
