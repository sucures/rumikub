// Profile store (Step 21)
import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { PublicProfile } from '../api/profile';
import type { FriendInfo, PendingRequest } from '../api/friends';

interface ProfileState {
  profile: PublicProfile | null;
  friends: FriendInfo[];
  pendingRequests: PendingRequest[];
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  setProfile: (p: PublicProfile | null) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  friends: [],
  pendingRequests: [],
  isLoading: false,
  error: null,
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ success: boolean; profile: PublicProfile }>('/api/profile/me');
      if (data.success && data.profile) {
        set({ profile: data.profile });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch profile' });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchFriends: async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        apiClient.get<{ success: boolean; friends: FriendInfo[] }>('/api/friends'),
        apiClient.get<{ success: boolean; pending: PendingRequest[] }>('/api/friends/requests'),
      ]);
      set({
        friends: friendsRes.data.friends ?? [],
        pendingRequests: requestsRes.data.pending ?? [],
      });
    } catch {
      // ignore
    }
  },
  setProfile: (p) => set({ profile: p }),
}));
