import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Printer, CalendarDays, TrendingUp, Wallet, ShieldCheck,
  Phone, Mail, GraduationCap, FileText,
} from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Attendance, Grade, Payment, Student } from '@/types'
import { StudentAIInsights } from './components/StudentAIInsights'

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}

function ageFrom(dob?: string) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}

function gradeLetter(pct: number): { letter: string; cls: string } {
  if (pct >= 90) return { letter: 'A+', cls: 'bg-primary-fixed text-on-secondary-fixed' }
  if (pct >= 80) return { letter: 'A', cls: 'bg-primary-fixed text-on-secondary-fixed' }
  if (pct >= 70) return { letter: 'B', cls: 'bg-surface-container-high text-on-surface' }
  if (pct >= 60) return { letter: 'C', cls: 'bg-secondary-fixed text-on-secondary-fixed' }
  if (pct >= 50) return { letter: 'D', cls: 'bg-secondary-fixed text-on-secondary-fixed' }
  return { letter: 'F', cls: 'bg-error-container text-error-on' }
}

function StatTile({
  label, value, sub, badge, badgeClass, icon: Icon, iconClass,
}: {
  label: string; value: string; sub: string; badge?: string; badgeClass?: string
  icon: typeof Wallet; iconClass: string
}) {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        {badge && <span className={`rounded px-2 py-0.5 text-xs font-bold ${badgeClass}`}>{badge}</span>}
      </div>
      <h4 className="mb-1 text-sm font-semibold text-outline">{label}</h4>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-on-surface">{value}</span>
        <span className="text-xs font-medium text-outline">{sub}</span>
      </div>
    </div>
  )
}

export default function StudentProfilePage() {
  const { id = '' } = useParams()

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then((r) => r.data),
    enabled: !!id,
  })
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['student-grades', id],
    queryFn: () => api.get(`/gradebook/grades/student/${id}`).then((r) => r.data),
    enabled: !!id, retry: false,
  })
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['student-payments', id],
    queryFn: () => api.get(`/payments/student/${id}`).then((r) => r.data),
    enabled: !!id, retry: false,
  })
  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['student-attendance', id],
    queryFn: () =>
      api.get('/attendances', { params: { studentId: id } }).then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: !!id, retry: false,
  })

  // Derived metrics
  const academicAvg = grades.length
    ? Math.round(grades.reduce((s, g) => s + (g.maxScore ? (g.score / g.maxScore) * 100 : 0), 0) / grades.length)
    : null
  const feesPaid = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + Number(p.amount || 0), 0)
  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length
  const attendancePct = attendance.length ? Math.round((presentCount / attendance.length) * 100) : null

  // Current-month attendance calendar
  const calendar = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7 // Monday-first
    const byDay = new Map<number, string>()
    attendance.forEach((a) => {
      const d = new Date(a.date)
      if (d.getFullYear() === year && d.getMonth() === month) byDay.set(d.getDate(), a.status)
    })
    const cells: ({ day: number; status?: string } | null)[] = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) cells.push({ day, status: byDay.get(day) })
    return { cells, label: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }
  }, [attendance])

  // Recent activity from real records
  const activity = useMemo(() => {
    const items: { title: string; detail: string; when: number; kind: 'pay' | 'grade' | 'att' }[] = []
    payments.filter((p) => p.status === 'SUCCESS').slice(0, 3).forEach((p) =>
      items.push({ title: `Paid ${p.fee?.name ?? 'fees'}`, detail: formatCurrency(p.amount), when: new Date(p.createdAt).getTime(), kind: 'pay' }))
    grades.slice(0, 3).forEach((g) =>
      items.push({ title: `Graded ${g.subject?.name ?? 'assessment'}`, detail: `${g.score}/${g.maxScore}`, when: new Date(g.gradedAt).getTime(), kind: 'grade' }))
    return items.sort((a, b) => b.when - a.when).slice(0, 4)
  }, [payments, grades])

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-3xl bg-surface-container-low" />
  }
  if (!student) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
        <p className="text-sm font-semibold text-on-surface">Student not found</p>
        <Link to="/students" className="mt-2 inline-block text-sm font-bold text-primary hover:underline">
          Back to directory
        </Link>
      </div>
    )
  }

  const age = ageFrom(student.dob)
  const studentRef = student.studentId ?? student.studentCode ?? '—'

  return (
    <div className="space-y-8">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Student Directory
      </Link>

      {/* Profile header */}
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-2xl font-black text-primary-container ring-4 ring-primary-fixed/30">
            {initials(student.firstName, student.lastName)}
          </div>
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                {student.firstName} {student.lastName}
              </h1>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-secondary-fixed">Active</span>
            </div>
            <p className="flex items-center gap-2 font-medium text-outline">
              <span className="font-mono text-sm">{studentRef}</span>
              {age != null && <span>· {age} years old</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground shadow-md transition-all hover:opacity-90"
        >
          <Printer className="h-4 w-4" strokeWidth={1.5} /> Print Student ID
        </button>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Term Attendance" value={attendancePct != null ? `${attendancePct}%` : '—'}
          sub={attendance.length ? `${presentCount}/${attendance.length} days` : 'not recorded'}
          icon={CalendarDays} iconClass="bg-primary-fixed/20 text-primary"
        />
        <StatTile
          label="Academic Average" value={academicAvg != null ? `${academicAvg}%` : '—'}
          sub={grades.length ? `${grades.length} assessments` : 'no grades yet'}
          badge={academicAvg != null && academicAvg >= 70 ? 'Honors' : undefined} badgeClass="bg-secondary-container/20 text-secondary"
          icon={TrendingUp} iconClass="bg-secondary-container/20 text-secondary"
        />
        <StatTile
          label="Fees Paid" value={formatCurrency(feesPaid)} sub="this account"
          badge={feesPaid > 0 ? 'Paid' : undefined} badgeClass="bg-primary-fixed/40 text-primary"
          icon={Wallet} iconClass="bg-primary-fixed/20 text-primary"
        />
        <StatTile
          label="Disciplinary Record" value="Clean" sub="no infractions"
          badge="Good" badgeClass="bg-primary-fixed/40 text-primary"
          icon={ShieldCheck} iconClass="bg-surface-container-high text-primary-container"
        />
      </div>

      {/* AI Insights */}
      <StudentAIInsights studentId={id} />

      {/* Main bento */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left — academic + calendar */}
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl font-extrabold text-on-surface">Academic Performance</h2>
                <p className="text-sm text-outline">Recorded assessment scores</p>
              </div>
            </div>
            {grades.length === 0 ? (
              <div className="rounded-2xl bg-surface p-8 text-center">
                <p className="text-sm font-semibold text-on-surface">No grades recorded</p>
                <p className="mt-1 text-xs text-muted-foreground">Assessment scores will appear here once entered.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant/15 text-left text-xs font-bold uppercase tracking-wider text-outline">
                      <th className="pb-4">Subject</th>
                      <th className="pb-4">Score</th>
                      <th className="pb-4">Max</th>
                      <th className="pb-4">Total</th>
                      <th className="pb-4">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {grades.map((g) => {
                      const pct = g.maxScore ? Math.round((g.score / g.maxScore) * 100) : 0
                      const gr = gradeLetter(pct)
                      return (
                        <tr key={g.id} className="transition-colors hover:bg-surface-container-low">
                          <td className="py-4 font-bold text-on-surface">{g.subject?.name ?? 'Subject'}</td>
                          <td className="py-4 font-mono">{g.score}</td>
                          <td className="py-4 font-mono text-muted-foreground">{g.maxScore}</td>
                          <td className="py-4 font-mono font-extrabold text-primary">{pct}%</td>
                          <td className="py-4">
                            <span className={`rounded-lg px-3 py-1 text-xs font-bold ${gr.cls}`}>{gr.letter}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl font-extrabold text-on-surface">Attendance Calendar</h2>
                <p className="text-sm text-outline">Monthly view · {calendar.label}</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center gap-1 text-xs font-bold text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> Present</span>
                <span className="flex items-center gap-1 text-xs font-bold text-destructive"><span className="h-2 w-2 rounded-full bg-destructive" /> Absent</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="py-2 text-center text-xs font-bold text-outline">{d}</div>
              ))}
              {calendar.cells.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} className="aspect-square rounded-lg bg-surface-container" />
                const present = cell.status === 'PRESENT' || cell.status === 'LATE'
                const absent = cell.status === 'ABSENT' || cell.status === 'EXCUSED'
                return (
                  <div
                    key={cell.day}
                    className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold ${
                      present ? 'border-2 border-primary-fixed bg-primary-fixed/30 text-primary'
                        : absent ? 'border-2 border-error-container bg-error-container/40 text-destructive'
                        : 'bg-surface-container text-outline-variant'
                    }`}
                  >
                    {cell.day}
                  </div>
                )
              })}
            </div>
            {attendance.length === 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">No attendance recorded for this student yet.</p>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Guardian */}
          <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
            <h3 className="mb-6 font-headline text-lg font-extrabold text-on-surface">Guardian Information</h3>
            {student.guardian?.name || student.guardian?.phone || student.guardian?.email ? (
              <>
                <div className="mb-6 flex items-start gap-4 rounded-2xl bg-surface-container-low p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-primary-container">
                    {initials(student.guardian?.name?.split(' ')[0], student.guardian?.name?.split(' ')[1])}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-on-surface">{student.guardian?.name ?? 'Guardian'}</p>
                    <p className="text-xs font-medium text-outline">Primary Guardian</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {student.guardian?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary-container" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-on-surface">{student.guardian.phone}</span>
                    </div>
                  )}
                  {student.guardian?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary-container" strokeWidth={1.5} />
                      <span className="truncate text-sm font-medium text-on-surface">{student.guardian.email}</span>
                    </div>
                  )}
                </div>
                {student.guardian?.email && (
                  <a
                    href={`mailto:${student.guardian.email}`}
                    className="mt-6 block w-full rounded-xl border border-outline-variant/30 py-2.5 text-center text-sm font-bold text-primary transition-colors hover:bg-surface-container"
                  >
                    Message Guardian
                  </a>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No guardian information on record.</p>
            )}
          </section>

          {/* Recent activity */}
          <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
            <h3 className="mb-6 font-headline text-lg font-extrabold text-on-surface">Recent Activity</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-6">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed/40 text-primary">
                      {a.kind === 'pay' ? <Wallet className="h-4 w-4" strokeWidth={1.5} /> : <GraduationCap className="h-4 w-4" strokeWidth={1.5} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface">{a.title}</p>
                      <p className="text-xs font-medium text-outline">{a.detail} · {formatDate(new Date(a.when).toISOString())}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documents (not yet modeled) */}
          <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
            <h3 className="mb-6 font-headline text-lg font-extrabold text-on-surface">Documents</h3>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-surface p-6 text-center">
              <FileText className="mb-2 h-6 w-6 text-outline-variant" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-on-surface">No documents uploaded</p>
              <p className="mt-1 text-xs text-muted-foreground">Certificates and records will appear here.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
