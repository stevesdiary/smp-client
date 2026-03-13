import { create } from 'zustand'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  tenantId: string | null
  login: (token: string, user: User, tenantId: string) => void
  logout: () => void
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
  login: (token, user, tenantId) => {
    localStorage.setItem('token', token)
    localStorage.setItem('tenantId', tenantId)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, tenantId })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('tenantId')
    localStorage.removeItem('user')
    set({ token: null, user: null, tenantId: null })
  },
}))
