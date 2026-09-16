import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  PenLine,
  Send,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import api from '@/lib/api'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import type { PaymentWithStudent } from '@/lib/moduleQueries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Attendance, Class, Event, Student } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '??'
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

const methodBadge: Record<string, string> = {
  PAYSTACK: 'bg-primary-fixed/50 text-primary',
  CASH: 'bg-secondary-fixed/60 text-on-secondary-fixed',
  BANK_TRANSFER: 'bg-muted text-muted-foreground',
}

function methodLabel(method: string) {
  return method
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { user, tenantId } = useAuthStore()

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((res) => res.data),
  })
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((res) => res.data),
  })
  const { data: payments = [] } = useQuery<PaymentWithStudent[]>({
    queryKey: ['payments', 'all-by-student'],
    queryFn: fetchAllPaymentsByStudent,
  })
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((res) => res.data),
  })

  // Attendance for the trailing 7 days — best-effort (graceful empty on failure)
  const range = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    return { start: isoDay(start), end: isoDay(end) }
  }, [])
  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['attendances', 'range', range.start, range.end],
    queryFn: () =>
      api
        .get('/attendances', { params: { startDate: range.start, endDate: range.end } })
        .then((res) => (Array.isArray(res.data) ? res.data : [])),
    retry: false,
  })

  // ─── Derived metrics ──────────────────────────────────────────────────────
  const feesCollected = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const pendingPayments = payments.filter((p) => p.status === 'PENDING')
  const outstanding = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const collectedPct =
    feesCollected + outstanding > 0
      ? Math.min(100, Math.round((feesCollected / (feesCollected + outstanding)) * 100))
      : 0

  const recentPayments = [...payments]
    .filter((p) => p.status === 'SUCCESS')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Attendance grouped by day
  const attendanceByDay = useMemo(() => {
    const days: { key: string; label: string; rate: number | null }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = isoDay(d)
      const dayRecords = attendance.filter((a) => (a.date || '').slice(0, 10) === key)
      const present = dayRecords.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length
      const rate = dayRecords.length > 0 ? Math.round((present / dayRecords.length) * 100) : null
      days.push({ key, label: d.toLocaleDateString('en-GB', { weekday: 'short' }), rate })
    }
    return days
  }, [attendance])

  const todayRate = attendanceByDay[attendanceByDay.length - 1]?.rate
  const todayRecords = attendance.filter((a) => (a.date || '').slice(0, 10) === range.end)
  const todayAbsent = todayRecords.filter((a) => a.status === 'ABSENT').length
  const hasAttendance = attendance.length > 0

  // Priority alerts: nearest upcoming events
  // Prefer upcoming events; if none are upcoming, fall back to the most recent
  // past ones so the panel still reflects the school calendar.
  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  const upcoming = sortedEvents.filter((e) => new Date(e.startDate).getTime() >= Date.now() - 86_400_000)
  const upcomingEvents = (upcoming.length ? upcoming : [...sortedEvents].reverse()).slice(0, 3)

  // ─── Greeting ───────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.firstName ?? 'Admin'
  const schoolLabel = tenantId ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1) : 'your school'
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const quickActions = [
    { to: '/students', label: 'Add Student', icon: UserPlus, primary: true },
    { to: '/attendance', label: 'Record Attendance', icon: CalendarCheck },
    { to: '/gradebook', label: 'Enter Scores', icon: PenLine },
    { to: '/payments', label: 'Send Fee Reminder', icon: Send, accent: true },
  ]

  return (
    <div className="pb-4">
      {/* Greeting & context */}
      <div className="mb-10">
        <h1 className="mb-2 font-headline text-[2rem] font-extrabold leading-none text-on-surface md:text-[2.5rem]">
          {greeting}, {firstName}
        </h1>
        <p className="font-medium text-muted-foreground">
          Here's what's happening at {schoolLabel} today, {today}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="group relative overflow-hidden rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-surface-container-low transition-transform duration-500 group-hover:scale-150" />
          <div className="relative z-10">
            <div className="mb-4 flex items-start justify-between">
              <span className="rounded-xl bg-primary-fixed p-2 text-primary">
                <Users className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="rounded-full bg-surface-container-low px-2 py-1 text-[10px] font-bold text-primary-container">
                {classes.length} classes
              </span>
            </div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Students
            </p>
            <h3 className="font-headline text-4xl font-black text-primary-container">
              {studentsLoading ? '—' : students.length}
            </h3>
          </div>
        </div>

        {/* Fees Collected */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-xl bg-primary-fixed p-2 text-primary">
              <Wallet className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">{collectedPct}% of billed</span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Fees Collected
          </p>
          <h3 className="mb-4 font-mono text-3xl font-bold text-primary-container">
            {formatCurrency(feesCollected)}
          </h3>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div className="h-full rounded-full bg-primary" style={{ width: `${collectedPct}%` }} />
          </div>
        </div>

        {/* Attendance Today */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-xl bg-surface-container p-2 text-primary">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.5} />
            </span>
            {hasAttendance && todayAbsent > 0 && (
              <span className="text-[10px] font-bold text-destructive">{todayAbsent} Absent</span>
            )}
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Attendance Today
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="font-headline text-4xl font-black text-primary-container">
              {todayRate != null ? `${todayRate}%` : '—'}
            </h3>
            <span className="text-xs font-medium text-muted-foreground">
              {todayRate != null ? 'present' : 'not marked'}
            </span>
          </div>
        </div>

        {/* Outstanding Fees */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft transition-all">
          <div className="mb-4 flex items-start justify-between">
            <span className="rounded-xl bg-secondary-fixed p-2 text-on-secondary-fixed">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.5} />
            </span>
            {pendingPayments.length > 0 && (
              <span className="rounded-full bg-secondary-fixed px-2 py-1 text-[10px] font-bold text-on-secondary-fixed">
                {pendingPayments.length} Pending
              </span>
            )}
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Outstanding Fees
          </p>
          <h3 className="font-mono text-3xl font-bold text-[#835500]">{formatCurrency(outstanding)}</h3>
        </div>
      </div>

      {/* Recent payments + Priority alerts */}
      <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Fee Payments */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:col-span-2 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="font-headline text-xl font-bold text-on-surface">Recent Fee Payments</h4>
            <Link
              to="/payments"
              className="text-xs font-bold text-primary-container transition-all hover:underline"
            >
              View All Ledger
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="rounded-2xl bg-surface p-8 text-center">
              <p className="text-sm font-semibold text-on-surface">No payments recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Successful fee payments will appear here as they come in.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-12 items-center gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:bg-surface"
                >
                  <div className="col-span-6 flex items-center gap-3 sm:col-span-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-bold text-primary-container">
                      {initials(p.student?.firstName, p.student?.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">
                        {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Unknown student'}
                      </p>
                      <p className="truncate text-[10px] font-medium text-muted-foreground">
                        {p.fee?.name ?? 'Fee'} • ID: {p.student?.studentId ?? p.student?.studentCode ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <p className="font-mono text-sm font-bold text-on-surface">{formatCurrency(p.amount)}</p>
                  </div>
                  <div className="col-span-2 hidden text-xs font-medium text-muted-foreground sm:block">
                    {formatDate(p.createdAt)}
                  </div>
                  <div className="col-span-6 text-right sm:col-span-2">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                        methodBadge[p.method?.toUpperCase()] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {methodLabel(p.method || 'Other')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Alerts */}
        <div className="flex flex-col rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-white shadow-soft-lg lg:p-8">
          <h4 className="mb-8 font-headline text-xl font-bold">Priority Alerts</h4>
          <div className="flex-1 space-y-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-primary-fixed/80">
                No priority items right now. Upcoming events and deadlines will surface here.
              </p>
            ) : (
              upcomingEvents.map((e) => (
                <div key={e.id} className="group flex gap-4">
                  <div className="w-1 rounded-full bg-secondary-container transition-all group-hover:w-2" />
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
                      {e.type || 'Event'}
                    </p>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="mt-1 text-xs text-primary-fixed/70">{formatDate(e.startDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <Link
              to="/events"
              className="flex w-full items-center justify-between rounded-2xl bg-white/10 px-4 py-3 transition-colors hover:bg-white/20"
            >
              <span className="text-sm font-bold">View full calendar</span>
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Attendance overview */}
      <div className="mb-10 rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h4 className="font-headline text-xl font-bold text-on-surface">Attendance Overview</h4>
            <p className="text-sm text-muted-foreground">Daily present rate · last 7 school days</p>
          </div>
        </div>
        {hasAttendance ? (
          <div className="flex h-48 items-end justify-between gap-2 px-2">
            {attendanceByDay.map((day, i) => {
              const isToday = i === attendanceByDay.length - 1
              return (
                <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`group relative w-full max-w-[40px] rounded-t-lg transition-colors ${
                        isToday ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary-fixed hover:bg-primary'
                      }`}
                      style={{ height: `${Math.max(day.rate ?? 0, 3)}%` }}
                    >
                      <span
                        className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary ${
                          isToday ? '' : 'opacity-0 transition-opacity group-hover:opacity-100'
                        }`}
                      >
                        {day.rate != null ? `${day.rate}%` : '—'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      isToday ? 'text-primary-container' : 'text-muted-foreground'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl bg-surface text-center">
            <p className="text-sm font-semibold text-on-surface">No attendance data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once daily attendance is recorded, present-rate trends appear here.
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-surface-container-lowest/80 px-4 py-2 shadow-soft-lg backdrop-blur-md">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={
                action.primary
                  ? 'flex items-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-primary/20 active:scale-95'
                  : action.accent
                    ? 'group flex items-center gap-2 rounded-full px-4 py-3 font-bold text-secondary transition-colors hover:bg-secondary-fixed/30 active:scale-90'
                    : 'group flex items-center gap-2 rounded-full px-4 py-3 text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-primary active:scale-90'
              }
            >
              <action.icon className="h-5 w-5" strokeWidth={1.5} />
              <span className={action.primary ? 'text-sm' : 'text-xs font-bold'}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
