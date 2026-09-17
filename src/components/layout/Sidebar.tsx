import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList, CreditCard,
  DollarSign, Calendar, Library, Bus, Package, Trophy,
  Building2, Heart, AlertTriangle, Video, MessageSquare,
  Award, Settings, LogOut, School, UserCheck, Bell,
  CalendarDays, BookMarked, CalendarRange, Globe, MessageCircle, SquarePen
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
  { to: '/score-entry',     icon: SquarePen,       label: 'Score Entry',     section: 'Academic',        roles: ['ADMIN', 'TEACHER'] },
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

function titleCase(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
  const schoolName = tenantId ? titleCase(tenantId) : 'SchoolOS'
  const portalLabel = `${roleName.charAt(0) + roleName.slice(1).toLowerCase()} Portal`

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-on-surface/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform duration-300',
          'lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-sm leading-tight text-foreground">
                {schoolName}
              </h2>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {portalLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-widest text-subtle-foreground">
                {section}
              </p>
              <div className="space-y-1">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    end={to === '/dashboard'}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Help card */}
        <div className="px-4">
          <div className="rounded-xl bg-surface border border-border p-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-foreground">
              Need Help?
            </p>
            <a
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-background border border-border py-2 text-xs font-medium text-foreground transition-transform hover:bg-muted"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              WhatsApp Support
            </a>
          </div>
        </div>

        {/* Footer — user + sign out */}
        <div className="p-4">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
              {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{roleName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
