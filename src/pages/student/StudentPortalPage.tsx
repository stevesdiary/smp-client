import { BookOpen, Calendar, ClipboardList, CreditCard, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  useStudentProfile,
  useStudentTimetable,
  useStudentGrades,
  useStudentAttendance,
  useStudentFees,
  type StudentTimetableEntry,
  type StudentFee,
} from '@/hooks/useStudentSelf'
import type { Grade, Attendance } from '@/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAY_TONE: Record<number, string> = {
  1: 'bg-teal-500/15 text-teal-800 dark:text-teal-200',
  2: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  3: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  4: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
  5: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PRESENT: 'default',
  LATE: 'secondary',
  ABSENT: 'destructive',
  EXCUSED: 'outline',
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
}

function OverviewTab() {
  const { data: profile, isLoading } = useStudentProfile()
  if (isLoading) return <LoadingSkeleton />
  if (!profile) return <Empty message="Could not load profile." />

  return (
    <Card className="rounded-[28px]">
      <CardContent className="grid gap-3 p-6 text-sm">
        <Row label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
        <Row label="Student ID" value={profile.studentId || profile.studentCode || '—'} mono />
        <Row label="Date of Birth" value={profile.dob ? formatDate(profile.dob) : '—'} />
        <Row label="Class" value={profile.class?.name || '—'} />
      </CardContent>
    </Card>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function TimetableTab() {
  const { data: entries = [], isLoading } = useStudentTimetable()
  if (isLoading) return <LoadingSkeleton />
  if (!entries.length) return <Empty message="No timetable entries found." />

  const byDay = [1, 2, 3, 4, 5].map(day => ({
    day,
    label: DAY_NAMES[day],
    entries: (entries as StudentTimetableEntry[])
      .filter(e => e.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter(d => d.entries.length > 0)

  return (
    <div className="space-y-5">
      {byDay.map(({ day, label, entries: dayEntries }) => (
        <div key={day}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</h3>
          <div className="space-y-2">
            {dayEntries.map(e => (
              <Card key={e.id} className="rounded-2xl">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{e.subject?.name || '—'}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.teacher ? `${e.teacher.firstName} ${e.teacher.lastName}` : ''}
                      {e.room ? ` · Room ${e.room}` : ''}
                    </p>
                  </div>
                  <Badge className={DAY_TONE[e.dayOfWeek]}>{e.startTime} – {e.endTime}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GradesTab() {
  const { data: grades = [], isLoading } = useStudentGrades()
  if (isLoading) return <LoadingSkeleton />
  if (!grades.length) return <Empty message="No grades recorded yet." />

  return (
    <div className="space-y-2">
      {(grades as Grade[]).map(g => (
        <Card key={g.id} className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{g.subject?.name || g.assignment?.title || '—'}</p>
              {g.remarks && <p className="text-sm text-muted-foreground">{g.remarks}</p>}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {g.score}<span className="text-sm text-muted-foreground">/{g.maxScore}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(g.gradedAt)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AttendanceTab() {
  const { data: records = [], isLoading } = useStudentAttendance()
  if (isLoading) return <LoadingSkeleton />
  if (!records.length) return <Empty message="No attendance records found." />

  return (
    <div className="space-y-2">
      {(records as Attendance[]).map(r => (
        <Card key={r.id} className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <span className="font-medium">{formatDate(r.date)}</span>
            <Badge variant={STATUS_VARIANT[r.status] ?? 'secondary'}>{r.status}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FeesTab() {
  const { data: fees = [], isLoading } = useStudentFees()
  if (isLoading) return <LoadingSkeleton />
  if (!fees.length) return <Empty message="No fee records found." />

  return (
    <div className="space-y-2">
      {(fees as StudentFee[]).map(f => {
        const paid = (f.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
        const balance = f.amount - paid
        return (
          <Card key={f.id} className="rounded-2xl">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{f.name}</p>
                <Badge variant={balance <= 0 ? 'default' : 'destructive'}>
                  {balance <= 0 ? 'Paid' : `Owing ${formatCurrency(balance)}`}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total: {formatCurrency(f.amount)}</span>
                <span>Paid: {formatCurrency(paid)}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function StudentPortalPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-2xl lg:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative space-y-2">
          <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
            Student portal
          </Badge>
          <h1 className="text-3xl font-semibold">Welcome back, {user?.firstName || 'Student'}</h1>
          <p className="text-sm text-white/70">Your timetable, grades, attendance, and fees — all in one place.</p>
        </div>
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl gap-1.5"><User className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="timetable" className="rounded-xl gap-1.5"><Calendar className="h-3.5 w-3.5" />Timetable</TabsTrigger>
          <TabsTrigger value="grades" className="rounded-xl gap-1.5"><BookOpen className="h-3.5 w-3.5" />Grades</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Attendance</TabsTrigger>
          <TabsTrigger value="fees" className="rounded-xl gap-1.5"><CreditCard className="h-3.5 w-3.5" />Fees</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="timetable" className="mt-4"><TimetableTab /></TabsContent>
        <TabsContent value="grades" className="mt-4"><GradesTab /></TabsContent>
        <TabsContent value="attendance" className="mt-4"><AttendanceTab /></TabsContent>
        <TabsContent value="fees" className="mt-4"><FeesTab /></TabsContent>
      </Tabs>
    </div>
  )
}
