import { apiClient } from './client';

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
  password: string,
  referredBy?: string | null
): Promise<{ user: AuthUser; token: string }> {
  const { data } = await apiClient.post<{ success: boolean; user: AuthUser; token: string }>(
    '/api/auth/register',
    { email, username, password, referredBy: referredBy || undefined }
  );
  if (!data.success || !data.token) throw new Error((data as { error?: string }).error ?? 'Registration failed');
  return { user: data.user!, token: data.token };
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const { data } = await apiClient.post<{ success: boolean; user: AuthUser; token: string }>(
    '/api/auth/login',
    { email, password }
  );
  if (!data.success || !data.token) throw new Error((data as { error?: string }).error ?? 'Login failed');
  return { user: data.user!, token: data.token };
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: boolean; user: AuthUser }>('/api/auth/me');
  if (!data.success || !data.user) throw new Error('Failed to fetch user');
  return data.user;
}
