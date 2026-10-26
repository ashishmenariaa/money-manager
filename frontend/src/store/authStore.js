import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setSession: ({ accessToken, refreshToken, user }) =>
        set((state) => ({ accessToken, refreshToken, user: user ?? state.user })),

      setUser: (user) => set({ user }),

      clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'moneymanager-auth' }
  )
)
