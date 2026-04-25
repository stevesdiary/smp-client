import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Calendar, Library, Bus, Package, Trophy,
  Building2, Heart, AlertTriangle, Video, MessageSquare,
  Award, Settings, LogOut, School, ShieldCheck, Sparkles,
  CalendarDays, BookMarked, CalendarRange, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'

const allNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'Command center', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
  { to: '/academic-years', icon: CalendarDays, label: 'Academic Years', section: 'Academic core', roles: ['ADMIN', 'PRINCIPAL'] },
  { to: '/students', icon: Users, label: 'Students', section: 'Academic core', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/teachers', icon: GraduationCap, label: 'Teachers', section: 'Academic core', roles: ['ADMIN', 'PRINCIPAL'] },
  { to: '/classes', icon: School, label: 'Classes', section: 'Academic core', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/subjects', icon: BookMarked, label: 'Subjects', section: 'Academic core', roles: ['ADMIN', 'TEACHER'] },
  { to: '/timetable', icon: CalendarRange, label: 'Timetable', section: 'Academic core', roles: ['ADMIN', 'TEACHER'] },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance', section: 'Academic core', roles: ['ADMIN', 'TEACHER'] },
  { to: '/grades', icon: BookOpen, label: 'Grades', section: 'Academic core', roles: ['ADMIN', 'TEACHER'] },
  { to: '/payments', icon: DollarSign, label: 'Payments', section: 'Operations', roles: ['ADMIN'] },
  { to: '/events', icon: Calendar, label: 'Events', section: 'Operations', roles: ['ADMIN', 'TEACHER'] },
  { to: '/library', icon: Library, label: 'Library', section: 'Operations', roles: ['ADMIN', 'TEACHER', 'STAFF'] },
  { to: '/transport', icon: Bus, label: 'Transport', section: 'Operations', roles: ['ADMIN', 'STAFF'] },
  { to: '/inventory', icon: Package, label: 'Inventory', section: 'Operations', roles: ['ADMIN', 'STAFF'] },
  { to: '/sports', icon: Trophy, label: 'Sports', section: 'Campus life', roles: ['ADMIN', 'TEACHER'] },
  { to: '/hostel', icon: Building2, label: 'Hostel', section: 'Campus life', roles: ['ADMIN', 'STAFF'] },
  { to: '/health', icon: Heart, label: 'Health', section: 'Campus life', roles: ['ADMIN', 'STAFF'] },
  { to: '/disciplinary', icon: AlertTriangle, label: 'Disciplinary', section: 'Campus life', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/courses', icon: Video, label: 'Courses', section: 'Digital learning', roles: ['ADMIN', 'TEACHER'] },
  { to: '/elearning', icon: MessageSquare, label: 'E-Learning', section: 'Digital learning', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/certificates', icon: Award, label: 'Certificates', section: 'Digital learning', roles: ['ADMIN', 'STUDENT'] },
  { to: '/parent', icon: Users, label: 'Parent Portal', section: 'Family access', roles: ['PARENT'] },
  { to: '/website-editor', icon: Globe, label: 'Website Editor', section: 'System', roles: ['ADMIN'] },
  { to: '/custom-domain-setup', icon: Globe, label: 'Custom Domain', section: 'System', roles: ['ADMIN'] },
  { to: '/settings', icon: Settings, label: 'Settings', section: 'System', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, tenantId, logout } = useAuthStore()
  const roleName = getUserRole(user)

  const navItems = allNavItems.filter(item => item.roles.includes(roleName))
  const groupedItems = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    acc[item.section] = [...(acc[item.section] ?? []), item]
    return acc
  }, {})
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'School User'

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/40 bg-[hsl(var(--sidebar))]/90 text-[hsl(var(--sidebar-foreground))] shadow-2xl shadow-slate-900/5 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto dark:border-white/5',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="border-b border-white/40 px-6 py-6 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <School className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">EDUPLUS</p>
              <p className="text-sm text-muted-foreground">Institution control room</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-primary/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tenantId ? `${tenantId}.eduplus` : 'Multi-role workspace'}
                </p>
              </div>
              <Badge className="rounded-full bg-primary/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-primary-foreground">
                {roleName}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Access and modules are tailored to this role.
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="space-y-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {section}
              </p>
              <div className="space-y-1">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground'
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 transition-colors group-hover:bg-black/10 dark:bg-white/5 dark:group-hover:bg-white/10">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/40 p-4 dark:border-white/5">
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-100/70 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            Richer workspace applied to the live client.
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <LogOut className="h-4 w-4" />
            </span>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
