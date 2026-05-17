import type { SessionUser } from '@teamflow/shared';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setSession: (s: {
    user: SessionUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: SessionUser) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setSession: (s) =>
        set({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),

      setTokens: (t) => set({ accessToken: t.accessToken, refreshToken: t.refreshToken }),

      setUser: (user) => set({ user }),

      clear: () => set({ user: null, accessToken: null, refreshToken: null }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      isAuthenticated: () => Boolean(get().accessToken && get().user),
    }),
    {
      name: 'teamflow.auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
