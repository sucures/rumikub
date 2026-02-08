import { create } from 'zustand';

interface UserState {
  token: string | null;
  userId: string | null;
  premium: boolean;
  coins: number;
  gems: number;
  referralCode: string | null;
  referralsCount: number;
  setUser: (token: string, userId?: string, user?: { premium?: boolean; coins?: number; gems?: number; referralCode?: string; referralsCount?: number }) => void;
  setMe: (user: { premium?: boolean; coins?: number; gems?: number; referralCode?: string; referralsCount?: number }) => void;
  setReferralInfo: (referralCode: string, referralsCount: number) => void;
  logout: () => void;
}

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('rummikub_token');
  } catch {
    return null;
  }
};

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.userId ?? decoded.sub ?? null;
  } catch {
    return null;
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  token: getStoredToken(),
  userId: getUserIdFromToken(getStoredToken() ?? '') ?? null,
  premium: false,
  coins: 0,
  gems: 0,
  referralCode: null,
  referralsCount: 0,
  setUser: (token, userId, user) => {
    try {
      localStorage.setItem('rummikub_token', token);
    } catch {
      // ignore
    }
    set({
      token,
      userId: userId ?? getUserIdFromToken(token) ?? null,
      premium: user?.premium ?? false,
      coins: user?.coins ?? 0,
      gems: user?.gems ?? 0,
      referralCode: user?.referralCode ?? get().referralCode,
      referralsCount: user?.referralsCount ?? get().referralsCount,
    });
  },
  setMe: (user) => {
    set({
      premium: user?.premium ?? get().premium,
      coins: user?.coins ?? get().coins,
      gems: user?.gems ?? get().gems,
      referralCode: user?.referralCode ?? get().referralCode,
      referralsCount: user?.referralsCount ?? get().referralsCount,
    });
  },
  setReferralInfo: (referralCode, referralsCount) => set({ referralCode, referralsCount }),
  logout: () => {
    try {
      localStorage.removeItem('rummikub_token');
    } catch {
      // ignore
    }
    set({ token: null, userId: null, premium: false, coins: 0, gems: 0, referralCode: null, referralsCount: 0 });
  },
}));
