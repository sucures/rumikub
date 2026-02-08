// Auth API
import { apiClient } from './client';
import { getStoredReferralCode, clearStoredReferralCode } from './referral';

export interface AuthUser {
  id?: string;
  email?: string;
  username?: string;
  premium?: boolean;
  coins?: number;
  gems?: number;
  referralCode?: string;
  referralsCount?: number;
}

export async function register(
  email: string,
  username: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const referredBy = getStoredReferralCode();
  const { data } = await apiClient.post<{ success: boolean; user: AuthUser; token: string }>(
    '/api/auth/register',
    { email, username, password, referredBy }
  );
  if (!data.success || !data.token) throw new Error(data.error ?? 'Registration failed');
  clearStoredReferralCode();
  return { user: data.user!, token: data.token };
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const { data } = await apiClient.post<{ success: boolean; user: AuthUser; token: string }>(
    '/api/auth/login',
    { email, password }
  );
  if (!data.success || !data.token) throw new Error(data.error ?? 'Login failed');
  return { user: data.user!, token: data.token };
}
