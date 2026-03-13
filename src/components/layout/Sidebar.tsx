import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Calendar, Library, Bus, Package, Trophy,
  Building2, Heart, AlertTriangle, Video, MessageSquare,
  Award, Settings, LogOut, School
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'

const allNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
  { to: '/students', icon: Users, label: 'Students', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/teachers', icon: GraduationCap, label: 'Teachers', roles: ['ADMIN', 'PRINCIPAL'] },
  { to: '/classes', icon: School, label: 'Classes', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance', roles: ['ADMIN', 'TEACHER'] },
  { to: '/grades', icon: BookOpen, label: 'Grades', roles: ['ADMIN', 'TEACHER'] },
  { to: '/payments', icon: DollarSign, label: 'Payments', roles: ['ADMIN'] },
  { to: '/events', icon: Calendar, label: 'Events', roles: ['ADMIN', 'TEACHER'] },
  { to: '/library', icon: Library, label: 'Library', roles: ['ADMIN', 'TEACHER', 'STAFF'] },
  { to: '/transport', icon: Bus, label: 'Transport', roles: ['ADMIN', 'STAFF'] },
  { to: '/inventory', icon: Package, label: 'Inventory', roles: ['ADMIN', 'STAFF'] },
  { to: '/sports', icon: Trophy, label: 'Sports', roles: ['ADMIN', 'TEACHER'] },
  { to: '/hostel', icon: Building2, label: 'Hostel', roles: ['ADMIN', 'STAFF'] },
  { to: '/health', icon: Heart, label: 'Health', roles: ['ADMIN', 'STAFF'] },
  { to: '/disciplinary', icon: AlertTriangle, label: 'Disciplinary', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'] },
  { to: '/courses', icon: Video, label: 'Courses', roles: ['ADMIN', 'TEACHER'] },
  { to: '/elearning', icon: MessageSquare, label: 'E-Learning', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { to: '/certificates', icon: Award, label: 'Certificates', roles: ['ADMIN', 'STUDENT'] },
  { to: '/parent', icon: Users, label: 'Parent Portal', roles: ['PARENT'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT', 'STAFF'] },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const roleName = getUserRole(user)

  const navItems = allNavItems.filter(item => item.roles.includes(roleName))

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-card border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <School className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">EDUPLUS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
