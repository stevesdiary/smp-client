import { Menu, Moon, Search, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'
import { getUserRole } from '@/lib/auth'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  onMenuClick: () => void
}

/** Derive a human-readable page title from the current pathname */
function useBreadcrumb() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard'
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Header({ onMenuClick }: HeaderProps) {
  const { dark, toggle } = useThemeStore()
  const { user } = useAuthStore()
  const roleName = getUserRole(user)
  const pageTitle = useBreadcrumb()
  const initials = getInitials(user?.firstName, user?.lastName)

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4-sm lg:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Breadcrumb */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="text-sm font-semibold">{pageTitle}</span>
      </div>

      {/* Search */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search…"
            aria-label="Search"
            className="h-9 w-full rounded-lg border border-border bg-muted/60 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 dark:bg-muted/30"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground"
          title={`${user?.firstName} ${user?.lastName} — ${roleName}`}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
