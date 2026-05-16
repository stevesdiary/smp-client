import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList, CreditCard,
  DollarSign, Calendar, Library, Bus, Package, Trophy,
  Building2, Heart, AlertTriangle, Video, MessageSquare,
  Award, Settings, LogOut, School, ShieldCheck, UserCheck, Bell,
  CalendarDays, BookMarked, CalendarRange, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'

const allNavItems = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',      section: 'Workspace',       roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
  { to: '/notices',         icon: Bell,            label: 'Notices',         section: 'Workspace',       roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
  { to: '/academic-years',  icon: CalendarDays,    label: 'Academic Years',  section: 'Academic',        roles: ['ADMIN', 'PRINCIPAL'] },
  { to: '/students',        icon: Users,           label: 'Students',        section: 'Academic',        roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/candidates',      icon: UserCheck,       label: 'Admissions',      section: 'Academic',        roles: ['ADMIN'] },
  { to: '/teachers',        icon: GraduationCap,   label: 'Teachers',        section: 'Academic',        roles: ['ADMIN', 'PRINCIPAL'] },
  { to: '/classes',         icon: School,          label: 'Classes',         section: 'Academic',        roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/subjects',        icon: BookMarked,      label: 'Subjects',        section: 'Academic',        roles: ['ADMIN', 'TEACHER'] },
  { to: '/timetable',       icon: CalendarRange,   label: 'Timetable',       section: 'Academic',        roles: ['ADMIN', 'TEACHER'] },
  { to: '/attendance',      icon: ClipboardList,   label: 'Attendance',      section: 'Academic',        roles: ['ADMIN', 'TEACHER'] },
  { to: '/gradebook',       icon: BookOpen,        label: 'Gradebook',       section: 'Academic',        roles: ['ADMIN', 'TEACHER'] },
  { to: '/payments',        icon: DollarSign,      label: 'Payments',        section: 'Operations',      roles: ['ADMIN'] },
  { to: '/events',          icon: Calendar,        label: 'Events',          section: 'Operations',      roles: ['ADMIN', 'TEACHER'] },
  { to: '/library',         icon: Library,         label: 'Library',         section: 'Operations',      roles: ['ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT'] },
  { to: '/transport',       icon: Bus,             label: 'Transport',       section: 'Operations',      roles: ['ADMIN', 'STAFF'] },
  { to: '/inventory',       icon: Package,         label: 'Inventory',       section: 'Operations',      roles: ['ADMIN', 'STAFF'] },
  { to: '/sports',          icon: Trophy,          label: 'Sports',          section: 'Campus',          roles: ['ADMIN', 'TEACHER'] },
  { to: '/hostel',          icon: Building2,       label: 'Hostel',          section: 'Campus',          roles: ['ADMIN', 'STAFF'] },
  { to: '/health',          icon: Heart,           label: 'Health',          section: 'Campus',          roles: ['ADMIN', 'STAFF'] },
  { to: '/disciplinary',    icon: AlertTriangle,   label: 'Disciplinary',    section: 'Campus',          roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/courses',         icon: Video,           label: 'Courses',         section: 'Learning',        roles: ['ADMIN', 'TEACHER'] },
  { to: '/elearning',       icon: MessageSquare,   label: 'E-Learning',      section: 'Learning',        roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/certificates',    icon: Award,           label: 'Certificates',    section: 'Learning',        roles: ['ADMIN', 'STUDENT'] },
  { to: '/parent',          icon: Users,           label: 'Parent Portal',   section: 'Family',          roles: ['PARENT'] },
  { to: '/billing',         icon: CreditCard,      label: 'Billing',         section: 'System',          roles: ['ADMIN'] },
  { to: '/website-editor',  icon: Globe,           label: 'Website Editor',  section: 'System',          roles: ['ADMIN'] },
  { to: '/custom-domain-setup', icon: Globe,       label: 'Custom Domain',   section: 'System',          roles: ['ADMIN'] },
  { to: '/settings',        icon: Settings,        label: 'Settings',        section: 'System',          roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const roleName = getUserRole(user)

  const navItems = allNavItems.filter(item => item.roles.includes(roleName))
  const groupedItems = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    acc[item.section] = [...(acc[item.section] ?? []), item]
    return acc
  }, {})

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'School User'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300',
          'lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">EduPlus</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-5">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
              {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{roleName}</p>
            </div>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
