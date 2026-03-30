import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      business: null,
      // PIN-authenticated staff session (short-lived, not persisted)
      staffSession: null,

      setAuth: (data) => set({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        business: data.business,
      }),

      setBusiness: (business) => set({ business }),

      setTokens: (token, refreshToken) => set({ token, refreshToken }),

      setStaffSession: (session) => set({ staffSession: session }),
      clearStaffSession: () => set({ staffSession: null }),

      logout: () => set({ token: null, refreshToken: null, user: null, business: null, staffSession: null }),

      // Convenience
      isOwner: () => get().user?.role === 'owner',
      isManager: () => ['owner', 'admin', 'manager'].includes(get().staffSession?.role || get().user?.role),
      businessId: () => get().business?.id || get().staffSession?.businessId,
    }),
    {
      name: 'sy-auth',
      partialize: (s) => ({
        token: s.token,
        refreshToken: s.refreshToken,
        user: s.user,
        business: s.business,
      }),
    }
  )
);
