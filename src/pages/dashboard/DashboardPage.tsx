import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  DollarSign,
  GraduationCap,
  Library,
  School,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'
import { StudentDashboard } from './StudentDashboard'

type DashboardEvent = {
  id: string
  title: string
  startDate: string
  type: string
}

type StatTone = 'teal' | 'gold' | 'slate' | 'rose'

type DashboardStat = {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone: StatTone
}

type InsightItem = {
  label: string
  value: number
  tone: string
}

type ActivityItem = {
  title: string
  detail: string
  badge: string
}

const statToneClasses: Record<StatTone, string> = {
  teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  gold: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

function StatCard({ title, value, detail, icon: Icon, tone }: DashboardStat) {
  return (
    <Card className="overflow-hidden border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${statToneClasses[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function InsightBars({ items }: { items: InsightItem[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${item.tone}`}
              style={{ width: `${Math.max(12, Math.round((item.value / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function QuickAction({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-4 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const canViewAcademic = role === 'ADMIN' || role === 'TEACHER'
  const canViewPayments = role === 'ADMIN'
  const canViewEvents = role === 'ADMIN' || role === 'TEACHER'
  const isParent = role === 'PARENT'
  const isStudent = role === 'STUDENT'
  const isStaff = role === 'STAFF'

  if (isStudent) return <StudentDashboard />

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((res) => res.data),
    enabled: canViewAcademic,
  })
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((res) => res.data),
    enabled: role === 'ADMIN',
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((res) => res.data),
    enabled: canViewAcademic,
  })
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'all-by-student'],
    queryFn: fetchAllPaymentsByStudent,
    enabled: canViewPayments,
  })
  const { data: events = [] } = useQuery<DashboardEvent[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((res) => res.data),
    enabled: canViewEvents,
  })
  const { data: parentChildren = [] } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get('/parent/children').then((res) => res.data),
    enabled: isParent,
  })
  const { data: liveClasses = [] } = useQuery({
    queryKey: ['live-classes'],
    queryFn: () => api.get('/elearning/live-classes').then((res) => res.data),
    enabled: isStudent,
  })
  const { data: libraryStats } = useQuery({
    queryKey: ['library-stats'],
    queryFn: () => api.get('/library/stats').then((res) => res.data),
    enabled: isStaff,
  })

  const totalRevenue = payments.reduce((sum, payment) => (
    payment.status === 'SUCCESS' ? sum + payment.amount : sum
  ), 0)

  const themeByRole = {
    MASTER: {
      label: 'Platform Control',
      title: 'Oversee all schools from a single command surface.',
      description: 'Monitor tenants, manage access, and ensure platform health across every school.',
      badge: 'Platform admin',
      surface: 'from-violet-500/10 to-indigo-500/5',
      orb: 'bg-violet-400/30',
    },
    ADMIN: {
      label: 'Command Center',
      title: 'Run the school with clarity instead of clutter.',
      description: 'Admissions, academics, finance, and operations are surfaced in one executive workspace.',
      badge: 'Executive view',
      surface: 'from-slate-950 via-teal-950 to-cyan-900 text-white',
      orb: 'bg-amber-300/20',
    },
    PRINCIPAL: {
      label: 'Leadership Desk',
      title: 'Stay ahead of discipline, policy, and oversight signals.',
      description: 'Use the dashboard as a daily brief for school-wide health and principal workflows.',
      badge: 'Leadership',
      surface: 'from-slate-900 via-slate-800 to-slate-700 text-white',
      orb: 'bg-sky-300/20',
    },
    TEACHER: {
      label: 'Teaching Studio',
      title: 'Move from attendance to learning outcomes without context switching.',
      description: 'Your core teaching actions and class momentum sit at the top of the workspace.',
      badge: 'Faculty',
      surface: 'from-emerald-950 via-teal-900 to-cyan-800 text-white',
      orb: 'bg-amber-300/20',
    },
    STAFF: {
      label: 'Operations Hub',
      title: 'Keep campus services reliable and visible.',
      description: 'Library, hostel, transport, and inventory flows are surfaced as one operations layer.',
      badge: 'Operations',
      surface: 'from-slate-950 via-stone-900 to-amber-900 text-white',
      orb: 'bg-teal-300/20',
    },
    PARENT: {
      label: 'Family Portal',
      title: 'Track progress, attendance, and payments in one place.',
      description: 'The dashboard highlights what a parent needs now instead of exposing the entire admin system.',
      badge: 'Family',
      surface: 'from-sky-950 via-cyan-900 to-teal-800 text-white',
      orb: 'bg-amber-300/20',
    },
    STUDENT: {
      label: 'Student Pulse',
      title: 'See your live learning flow at a glance.',
      description: 'Classes, e-learning, and achievement tracking now feel like one coherent student experience.',
      badge: 'Learner',
      surface: 'from-indigo-950 via-sky-900 to-cyan-800 text-white',
      orb: 'bg-amber-300/20',
    },
  }[role]

  const stats: DashboardStat[] = (() => {
    if (role === 'ADMIN') {
      return [
        { title: 'Students', value: studentsLoading ? '...' : students.length, detail: 'Active learners currently enrolled.', icon: Users, tone: 'teal' },
        { title: 'Teachers', value: teachersLoading ? '...' : teachers.length, detail: 'Faculty accounts visible to admin.', icon: GraduationCap, tone: 'gold' },
        { title: 'Classes', value: classes.length, detail: 'Structured classrooms and homerooms.', icon: School, tone: 'slate' },
        { title: 'Revenue', value: formatCurrency(totalRevenue), detail: 'Successful payments recorded so far.', icon: DollarSign, tone: 'rose' },
      ]
    }

    if (role === 'TEACHER') {
      return [
        { title: 'Students', value: studentsLoading ? '...' : students.length, detail: 'Learners currently visible to teaching workflows.', icon: Users, tone: 'teal' },
        { title: 'Classes', value: classes.length, detail: 'Classrooms you can operate in today.', icon: School, tone: 'gold' },
        { title: 'Events', value: events.length, detail: 'Upcoming school events worth planning around.', icon: Calendar, tone: 'slate' },
        { title: 'E-Learning', value: 'Live', detail: 'Digital learning modules are available.', icon: BookOpen, tone: 'rose' },
      ]
    }

    if (role === 'PRINCIPAL') {
      return [
        { title: 'Leadership', value: '2', detail: 'Priority pathways surfaced for principal review.', icon: ShieldCheck, tone: 'teal' },
        { title: 'Discipline', value: 'Live', detail: 'School discipline records remain accessible.', icon: Calendar, tone: 'gold' },
        { title: 'Policies', value: 'Ready', detail: 'Settings and oversight controls are available.', icon: Building2, tone: 'slate' },
        { title: 'School Health', value: 'Stable', detail: 'No blocked admin flows detected here.', icon: TrendingUp, tone: 'rose' },
      ]
    }

    if (role === 'STAFF') {
      return [
        { title: 'Books Borrowed', value: libraryStats?.borrowed ?? 0, detail: 'Borrow transactions logged in the library.', icon: Library, tone: 'teal' },
        { title: 'Returns', value: libraryStats?.returned ?? 0, detail: 'Completed returns processed by staff.', icon: BookOpen, tone: 'gold' },
        { title: 'Hostel', value: 'Active', detail: 'Accommodation workflows are currently enabled.', icon: Building2, tone: 'slate' },
        { title: 'Transport', value: 'Ready', detail: 'Transport and route operations remain available.', icon: Calendar, tone: 'rose' },
      ]
    }

    if (role === 'PARENT') {
      return [
        { title: 'Children Linked', value: parentChildren.length, detail: 'Learners connected to this parent account.', icon: Users, tone: 'teal' },
        { title: 'Updates', value: parentChildren.length > 0 ? 'Live' : 'None', detail: 'Progress and records can be reviewed here.', icon: TrendingUp, tone: 'gold' },
        { title: 'Portal', value: 'Active', detail: 'Attendance, grades, and payment history are available.', icon: BookOpen, tone: 'slate' },
        { title: 'Communication', value: 'Open', detail: 'Parent-facing academic records are synced.', icon: Calendar, tone: 'rose' },
      ]
    }

    return [
      { title: 'Live Classes', value: liveClasses.length, detail: 'Scheduled live sessions visible to students.', icon: Calendar, tone: 'teal' },
      { title: 'E-Learning', value: 'Ready', detail: 'Digital learning modules can be opened now.', icon: BookOpen, tone: 'gold' },
      { title: 'Certificates', value: 'Track', detail: 'Certificates and milestones remain in view.', icon: GraduationCap, tone: 'slate' },
      { title: 'Momentum', value: liveClasses.length > 0 ? 'On' : 'Idle', detail: 'Current study rhythm based on live sessions.', icon: TrendingUp, tone: 'rose' },
    ]
  })()

  const quickActions = (() => {
    if (role === 'ADMIN') {
      return [
        { to: '/students', title: 'Manage students', description: 'Open learner records and enrollment details.' },
        { to: '/payments', title: 'Review payments', description: 'See all payment records and collection status.' },
        { to: '/events', title: 'Publish event schedule', description: 'Coordinate the school calendar from one place.' },
      ]
    }

    if (role === 'TEACHER') {
      return [
        { to: '/attendance', title: 'Take attendance', description: 'Mark daily attendance and identify gaps early.' },
        { to: '/gradebook', title: 'Record grades', description: 'Update assessment scores and feedback.' },
        { to: '/elearning', title: 'Open e-learning', description: 'Manage live classes and digital submissions.' },
      ]
    }

    if (role === 'STAFF') {
      return [
        { to: '/library', title: 'Library desk', description: 'Track borrow and return activity.' },
        { to: '/inventory', title: 'Inventory room', description: 'Review item counts and storage locations.' },
        { to: '/hostel', title: 'Hostel records', description: 'Check rooms, assignments, and occupancy.' },
      ]
    }

    if (role === 'PARENT') {
      return [
        { to: '/parent', title: 'Open parent portal', description: 'See detailed attendance, grades, and payments.' },
        { to: '/settings', title: 'Account settings', description: 'Review parent access and profile settings.' },
      ]
    }

    return [
      { to: '/disciplinary', title: 'Disciplinary records', description: 'Open the core principal workflow for oversight.' },
      { to: '/settings', title: 'System settings', description: 'Review school controls and policy settings.' },
    ]
  })()

  const insightItems: InsightItem[] = (() => {
    if (role === 'ADMIN' || role === 'TEACHER') {
      return [
        { label: 'Students', value: students.length, tone: 'bg-teal-500' },
        { label: 'Classes', value: classes.length, tone: 'bg-amber-500' },
        { label: 'Events', value: events.length, tone: 'bg-slate-500' },
        { label: 'Revenue units', value: Math.round(totalRevenue / 1000), tone: 'bg-rose-500' },
      ]
    }

    if (role === 'STAFF') {
      return [
        { label: 'Borrowed', value: libraryStats?.borrowed ?? 0, tone: 'bg-teal-500' },
        { label: 'Returned', value: libraryStats?.returned ?? 0, tone: 'bg-amber-500' },
        { label: 'Hostel ops', value: 1, tone: 'bg-slate-500' },
        { label: 'Transport ops', value: 1, tone: 'bg-rose-500' },
      ]
    }

    if (role === 'PARENT') {
      return [
        { label: 'Children linked', value: parentChildren.length, tone: 'bg-teal-500' },
        { label: 'Portal access', value: parentChildren.length > 0 ? 1 : 0, tone: 'bg-amber-500' },
        { label: 'Recent updates', value: parentChildren.length > 0 ? parentChildren.length : 0, tone: 'bg-slate-500' },
      ]
    }

    return [
      { label: 'Priority flows', value: 2, tone: 'bg-teal-500' },
      { label: 'School oversight', value: 1, tone: 'bg-amber-500' },
      { label: 'Controls ready', value: 1, tone: 'bg-slate-500' },
    ]
  })()

  const activityItems: ActivityItem[] = (() => {
    if (events.length > 0) {
      return events.slice(0, 3).map((event) => ({
        title: event.title,
        detail: formatDate(event.startDate),
        badge: event.type,
      }))
    }

    if (parentChildren.length > 0) {
      return parentChildren.slice(0, 3).map((child: any) => ({
        title: `${child.firstName} ${child.lastName}`,
        detail: 'Child record linked to parent account.',
        badge: 'Linked',
      }))
    }

    if (liveClasses.length > 0) {
      return liveClasses.slice(0, 3).map((liveClass: any) => ({
        title: liveClass.title,
        detail: formatDate(liveClass.scheduledAt),
        badge: liveClass.status,
      }))
    }

    return quickActions.slice(0, 3).map((action) => ({
      title: action.title,
      detail: action.description,
      badge: 'Ready',
    }))
  })()

  return (
    <div className="space-y-8">
      <section className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${themeByRole.surface} p-6 shadow-2xl shadow-slate-900/10 lg:p-8`}>
        <div className={`absolute right-0 top-0 h-48 w-48 rounded-full blur-3xl ${themeByRole.orb}`} />
        <div className="relative grid gap-8 xl:grid-cols-[1.4fr,0.9fr]">
          <div className="space-y-5">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.25em] text-white">
              {themeByRole.label}
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight lg:text-5xl">
                {themeByRole.title}
              </h1>
              <p className="max-w-2xl text-sm text-white/78 lg:text-base">
                {themeByRole.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-white/90">
                <Link to={quickActions[0]?.to ?? '/settings'}>{quickActions[0]?.title ?? 'Open workspace'}</Link>
              </Button>
              <Badge className="rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                {themeByRole.badge}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {stats.slice(0, 2).map((stat) => (
              <div key={stat.title} className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/70">{stat.title}</p>
                <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-sm text-white/70">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {studentsLoading && canViewAcademic ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[24px]" />)
        ) : (
          stats.map((stat) => <StatCard key={stat.title} {...stat} />)
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr,0.95fr]">
        <Card className="overflow-hidden border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle>Performance overview</CardTitle>
            <CardDescription>Key operating signals derived from live dashboard data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <InsightBars items={insightItems} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-sm text-muted-foreground">Role lens</p>
                <p className="mt-2 text-lg font-semibold">{themeByRole.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The workspace prioritizes the actions most likely to matter for this role.
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">Operational status</p>
                <p className="mt-2 text-lg font-semibold">Connected</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This dashboard is still using the live `smp-client` query layer, not a static mock.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Fast paths into the most relevant workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <QuickAction key={action.to} {...action} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="overflow-hidden border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle>Live feed</CardTitle>
            <CardDescription>Recent events, linked records, or role-relevant actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityItems.map((item) => (
              <div key={`${item.title}-${item.badge}`} className="flex items-start justify-between gap-4 rounded-2xl bg-secondary/55 p-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <Badge variant="outline" className="border-primary/20 bg-background/70">
                  {item.badge}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
          <CardHeader className="pb-4">
            <CardTitle>Upcoming events</CardTitle>
            <CardDescription>School calendar signals surfaced when available.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/50 p-6 text-center">
                <p className="font-medium">No upcoming events yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Event data will appear here as soon as school schedules are added.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.startDate)}</p>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
