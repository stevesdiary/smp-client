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
  teal:  'bg-chart-1/10 text-chart-1',
  gold:  'bg-warning-light text-warning',
  slate: 'bg-muted text-muted-foreground',
  rose:  'bg-chart-4/10 text-chart-4',
}

function StatCard({ title, value, detail, icon: Icon, tone }: DashboardStat) {
  const toneClasses: Record<StatTone, string> = {
    teal:  'bg-primary/10 text-primary',
    gold:  'bg-warning-light text-warning',
    slate: 'bg-muted text-muted-foreground',
    rose:  'bg-chart-4/10 text-chart-4',
  }
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
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
      className="group flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3.5 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
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
    },
    ADMIN: {
      label: 'Command Center',
      title: 'Run the school with clarity instead of clutter.',
      description: 'Admissions, academics, finance, and operations are surfaced in one executive workspace.',
      badge: 'Executive view',
    },
    PRINCIPAL: {
      label: 'Leadership Desk',
      title: 'Stay ahead of discipline, policy, and oversight signals.',
      description: 'Use the dashboard as a daily brief for school-wide health and principal workflows.',
      badge: 'Leadership',
    },
    TEACHER: {
      label: 'Teaching Studio',
      title: 'Move from attendance to learning outcomes without context switching.',
      description: 'Your core teaching actions and class momentum sit at the top of the workspace.',
      badge: 'Faculty',
    },
    STAFF: {
      label: 'Operations Hub',
      title: 'Keep campus services reliable and visible.',
      description: 'Library, hostel, transport, and inventory flows are surfaced as one operations layer.',
      badge: 'Operations',
    },
    PARENT: {
      label: 'Family Portal',
      title: 'Track progress, attendance, and payments in one place.',
      description: 'The dashboard highlights what a parent needs now instead of exposing the entire admin system.',
      badge: 'Family',
    },
    STUDENT: {
      label: 'Student Pulse',
      title: 'See your live learning flow at a glance.',
      description: 'Classes, e-learning, and achievement tracking now feel like one coherent student experience.',
      badge: 'Learner',
    },
  }[role] ?? { label: 'Command Center', title: '', description: '', badge: 'Admin' }

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
        { label: 'Students', value: students.length, tone: 'bg-chart-1' },
        { label: 'Classes', value: classes.length, tone: 'bg-chart-2' },
        { label: 'Events', value: events.length, tone: 'bg-chart-3' },
        { label: 'Revenue units', value: Math.round(totalRevenue / 1000), tone: 'bg-chart-4' },
      ]
    }

    if (role === 'STAFF') {
      return [
        { label: 'Borrowed', value: libraryStats?.borrowed ?? 0, tone: 'bg-chart-1' },
        { label: 'Returned', value: libraryStats?.returned ?? 0, tone: 'bg-chart-2' },
        { label: 'Hostel ops', value: 1, tone: 'bg-chart-3' },
        { label: 'Transport ops', value: 1, tone: 'bg-chart-4' },
      ]
    }

    if (role === 'PARENT') {
      return [
        { label: 'Children linked', value: parentChildren.length, tone: 'bg-chart-1' },
        { label: 'Portal access', value: parentChildren.length > 0 ? 1 : 0, tone: 'bg-chart-2' },
        { label: 'Recent updates', value: parentChildren.length > 0 ? parentChildren.length : 0, tone: 'bg-chart-3' },
      ]
    }

    return [
      { label: 'Priority flows', value: 2, tone: 'bg-chart-1' },
      { label: 'School oversight', value: 1, tone: 'bg-chart-2' },
      { label: 'Controls ready', value: 1, tone: 'bg-chart-3' },
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

  // ─── Greeting card greeting ───────────────────────────────────────────────
  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.firstName ?? 'there'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{themeByRole.label}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
        <Badge variant="secondary" className="hidden sm:flex">{themeByRole.badge}</Badge>
      </div>

      {/* Stat grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {studentsLoading && canViewAcademic ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          stats.map((stat) => <StatCard key={stat.title} {...stat} />)
        )}
      </section>

      {/* Insight + Quick actions */}
      <section className="grid gap-6 xl:grid-cols-[1.25fr,0.95fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Overview</CardTitle>
            <CardDescription>Key operating signals from live dashboard data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <InsightBars items={insightItems} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/60 p-4">
                <p className="text-xs text-muted-foreground">Role lens</p>
                <p className="mt-1.5 text-sm font-semibold">{themeByRole.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Workspace prioritises actions for this role.
                </p>
              </div>
              <div className="rounded-xl bg-primary/8 p-4">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1.5 text-sm font-semibold">Connected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live data via the smp-client query layer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Fast paths into the most relevant workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <QuickAction key={action.to} {...action} />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Live feed + Events */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Live feed</CardTitle>
            <CardDescription>Recent events, linked records, or role-relevant actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activityItems.map((item) => (
              <div key={`${item.title}-${item.badge}`} className="flex items-start justify-between gap-4 rounded-xl bg-muted/40 p-3.5">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <Badge variant="outline">{item.badge}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Upcoming events</CardTitle>
            <CardDescription>School calendar signals surfaced when available.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                <p className="text-sm font-medium">No upcoming events</p>
                <p className="mt-1 text-xs text-muted-foreground">Event data will appear once schedules are added.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
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
