import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../api/auth';

const TOKEN_KEY = 'rummikub_token';
const USER_KEY = 'rummikub_user';

async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setStoredToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded.userId ?? decoded.sub ?? null;
  } catch {
    return null;
  }
}

interface AuthState {
  token: string | null;
  userId: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setUser: (token: string, user?: AuthUser) => void;
  setUserData: (user: Partial<AuthUser>) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  userId: null,
  user: null,
  isHydrated: false,

  setUser: (token, user) => {
    setStoredToken(token).then(() => {
      const userId = getUserIdFromToken(token);
      set({
        token,
        userId,
        user: user ?? get().user,
      });
      // Register push notifications after login
      import('../services/pushNotifications').then((m) =>
        m.setupPushNotifications().catch(() => {})
      );
    });
  },

  setUserData: (userData) => {
    const current = get().user;
    set({ user: current ? { ...current, ...userData } : null });
  },

  logout: async () => {
    await setStoredToken(null);
    set({
      token: null,
      userId: null,
      user: null,
    });
  },

  hydrate: async () => {
    const token = await getStoredToken();
    if (token) {
      set({
        token,
        userId: getUserIdFromToken(token),
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));
