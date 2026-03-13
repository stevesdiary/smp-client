import { Menu, Moon, Sun, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { dark, toggle } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon" onClick={toggle}>
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {getInitials(user?.firstName, user?.lastName)}
      </div>
    </header>
  )
}
