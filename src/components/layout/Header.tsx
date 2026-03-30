import { Bell, Menu, Moon, Search, Sparkles, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'
import { getUserRole } from '@/lib/auth'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { dark, toggle } = useThemeStore()
  const { user, tenantId } = useAuthStore()
  const roleName = getUserRole(user)
  const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'School User'

  return (
    <header className="sticky top-0 z-10 mx-4 mt-4 flex h-20 items-center gap-4 rounded-[28px] border border-white/40 bg-background/80 px-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl lg:mx-6 lg:px-6 dark:border-white/10">
      <Button variant="ghost" size="icon" className="rounded-2xl lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {tenantId ? `${tenantId}.eduplus` : 'EDUPLUS workspace'}
          </p>
          <p className="text-xs text-muted-foreground">
            {roleName} view • {today}
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center xl:flex">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students, records, classes, inventory..."
            className="h-12 w-full rounded-full border border-border/70 bg-secondary/65 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <Button variant="ghost" size="icon" className="relative rounded-2xl">
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-500" />
      </Button>

      <Button variant="ghost" size="icon" className="rounded-2xl" onClick={toggle}>
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="flex items-center gap-3 rounded-2xl bg-secondary/65 px-2 py-2">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight">{displayName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{roleName}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25">
          {getInitials(user?.firstName, user?.lastName)}
        </div>
      </div>
    </header>
  )
}
