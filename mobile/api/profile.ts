import { apiClient } from './client';

export interface PublicProfile {
  id: string;
  username: string;
  avatar: string | null;
  avatarUrl: string | null;
  bio: string | null;
  country: string | null;
  level: number;
  premium: boolean;
  referralCode: string | null;
  referralsCount: number;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    totalScore: number;
    tournamentsWon: number;
  };
  createdAt: string;
}

export async function getMyProfile(): Promise<PublicProfile> {
  const { data } = await apiClient.get<{ success: boolean; profile: PublicProfile }>('/api/profile/me');
  if (!data.success || !data.profile) throw new Error('Failed to get profile');
  return data.profile;
}

export async function getPublicProfile(username: string): Promise<PublicProfile> {
  const { data } = await apiClient.get<{ success: boolean; profile: PublicProfile }>(
    `/api/profile/${encodeURIComponent(username)}`
  );
  if (!data.success || !data.profile) throw new Error('User not found');
  return data.profile;
}

export async function updateProfile(updates: {
  username?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
}): Promise<PublicProfile> {
  const { data } = await apiClient.put<{ success: boolean; profile: PublicProfile }>(
    '/api/profile/me',
    updates
  );
  if (!data.success || !data.profile) throw new Error('Failed to update profile');
  return data.profile;
}
