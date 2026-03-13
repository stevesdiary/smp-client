import { create } from 'zustand'

interface ThemeStore {
  dark: boolean
  toggle: () => void
}

const saved = localStorage.getItem('theme') === 'dark'
if (saved) document.documentElement.classList.add('dark')

export const useThemeStore = create<ThemeStore>((set, get) => ({
  dark: saved,
  toggle: () => {
    const next = !get().dark
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
    set({ dark: next })
  },
}))
