import { create } from 'zustand'
import type { User } from '../types'
import * as authApi from '../api/auth'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (email, password) => {
    set({ error: null })
    try {
      const user = await authApi.login(email, password)
      set({ user })
    } catch (e) {
      set({ error: e instanceof authApi.ApiError ? e.message : 'Anmeldung fehlgeschlagen' })
      throw e
    }
  },

  register: async (email, password, displayName) => {
    set({ error: null })
    try {
      const user = await authApi.register(email, password, displayName)
      set({ user })
    } catch (e) {
      set({ error: e instanceof authApi.ApiError ? e.message : 'Registrierung fehlgeschlagen' })
      throw e
    }
  },

  logout: async () => {
    await authApi.logout()
    set({ user: null })
  },

  checkAuth: async () => {
    set({ loading: true })
    try {
      const user = await authApi.getMe()
      set({ user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
