// Referral API (Step 20)
import { apiClient } from './client';

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  referralsCount: number;
  rewards: { referredUserId: string; rewardCoins: number; rewardGems: number; createdAt: string }[];
}

export async function getReferralStats(): Promise<ReferralStats> {
  const { data } = await apiClient.get<{ success: boolean; referrals: ReferralStats }>('/api/referrals/me');
  if (!data.success || !data.referrals) throw new Error('Failed to fetch referral info');
  return data.referrals;
}

export async function validateReferralCode(code: string): Promise<boolean> {
  const { data } = await apiClient.get<{ success: boolean; valid: boolean }>(
    `/api/referrals/validate/${encodeURIComponent(code)}`
  );
  return data.success && data.valid;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  referralsCount: number;
}

export async function getReferralLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const url = limit ? `/api/referrals/leaderboard?limit=${limit}` : '/api/referrals/leaderboard';
  const { data } = await apiClient.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>(url);
  if (!data.success) throw new Error('Failed to fetch leaderboard');
  return data.leaderboard ?? [];
}

const REFERRAL_STORAGE_KEY = 'rummikub_referred_by';

export function getStoredReferralCode(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredReferralCode(code: string): void {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    // ignore
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}
