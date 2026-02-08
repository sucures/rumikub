import { create } from 'zustand';
import type { Club } from '../api/clubs';

interface ClubState {
  myClubs: Club[];
  discoverClubs: Club[];
  currentClub: Club | null;
  isLoading: boolean;
  error: string | null;
  setMyClubs: (c: Club[]) => void;
  setDiscoverClubs: (c: Club[]) => void;
  setCurrentClub: (c: Club | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (e: string | null) => void;
}

export const useClubStore = create<ClubState>((set) => ({
  myClubs: [],
  discoverClubs: [],
  currentClub: null,
  isLoading: false,
  error: null,
  setMyClubs: (c) => set({ myClubs: c }),
  setDiscoverClubs: (c) => set({ discoverClubs: c }),
  setCurrentClub: (c) => set({ currentClub: c }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (e) => set({ error: e }),
}));
