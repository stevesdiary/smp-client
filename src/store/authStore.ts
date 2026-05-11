import { create } from 'zustand'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  tenantId: string | null
  refreshToken: string | null
  login: (token: string, user: User, refreshToken?: string) => void
  logout: () => void
  setTokens: (token: string, refreshToken?: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem('token'),
  tenantId: localStorage.getItem('tenantId'),
  refreshToken: localStorage.getItem('refreshToken'),
  login: (token, user, refreshToken) => {
    const tenantId = user.tenantSubdomain ?? user.tenantId ?? null
    localStorage.setItem('token', token)
    if (tenantId) localStorage.setItem('tenantId', tenantId)
    else localStorage.removeItem('tenantId')
    localStorage.setItem('user', JSON.stringify(user))
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    else localStorage.removeItem('refreshToken')
    set({ token, user, tenantId, refreshToken: refreshToken ?? null })
  },
  logout: () => {
    const rt = localStorage.getItem('refreshToken')
    if (rt) {
      // Fire-and-forget server logout
      const tenantId = localStorage.getItem('tenantId')
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      fetch(`${baseURL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}) },
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {})
    }
    localStorage.removeItem('token')
    localStorage.removeItem('tenantId')
    localStorage.removeItem('user')
    localStorage.removeItem('refreshToken')
    set({ token: null, user: null, tenantId: null, refreshToken: null })
  },
  setTokens: (token, refreshToken) => {
    localStorage.setItem('token', token)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    else localStorage.removeItem('refreshToken')
    set({ token, refreshToken: refreshToken ?? null })
  },
}))
