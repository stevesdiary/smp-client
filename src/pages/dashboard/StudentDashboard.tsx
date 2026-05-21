import { useQuery } from '@tanstack/react-query'
import { BookOpen, Calendar, CheckCircle, Clock, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type TimetableEntry = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
  subject: { name: string; code?: string }
  teacher: { firstName: string; lastName: string }
}

type AttendanceSummary = {
  total: number
  present: number
  absent: number
  late: number
  attendanceRate: number
}

type GradeEntry = {
  id: string
  score: number
  maxScore: number
  subject: { name: string }
  assignment?: { title: string }
  gradedAt: string
}

export function StudentDashboard() {
  const today = new Date().getDay()

  const { data: timetableData, isLoading: ttLoading } = useQuery({
    queryKey: ['student-timetable'],
    queryFn: () => api.get('/student/me/timetable').then((r) => r.data),
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/student/me/attendance').then((r) => r.data),
  })

  const { data: gradesData } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student/me/grades').then((r) => r.data),
  })

  const timetable: TimetableEntry[] = timetableData?.timetable ?? []
  const todaySchedule = timetable.filter((e) => e.dayOfWeek === today)
  const summary: AttendanceSummary | undefined = attendanceData?.summary
  const recentGrades: GradeEntry[] = (gradesData?.grades ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Dashboard</h1>
        <p className="text-muted-foreground">
          {timetableData?.class?.name ? `${timetableData.class.name} • ` : ''}
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success-light text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{summary.attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Attendance rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-info-light text-info">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{summary.present}</p>
                <p className="text-xs text-muted-foreground">Days present</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-2/10 text-warning">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{recentGrades.length}</p>
                <p className="text-xs text-muted-foreground">Recent grades</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's timetable */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Today's Schedule</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {ttLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : todaySchedule.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No classes today</p>
            ) : (
              <div className="space-y-2">
                {todaySchedule.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="text-center">
                      <p className="text-xs font-medium text-primary">{entry.startTime}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.endTime}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.teacher.firstName} {entry.teacher.lastName}
                        {entry.room ? ` • ${entry.room}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent grades */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Recent Grades</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentGrades.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No grades yet</p>
            ) : (
              <div className="space-y-2">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{grade.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{grade.assignment?.title ?? 'Assessment'}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {grade.score}/{grade.maxScore}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full week timetable */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Weekly Timetable</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {ttLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : timetable.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No timetable assigned yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-medium">Time</th>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <th key={d} className={`px-2 py-2 text-left font-medium ${d === today ? 'text-primary' : ''}`}>
                        {DAYS[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getTimeSlots(timetable).map((slot) => (
                    <tr key={slot} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{slot}</td>
                      {[1, 2, 3, 4, 5].map((d) => {
                        const entry = timetable.find((e) => e.dayOfWeek === d && e.startTime === slot)
                        return (
                          <td key={d} className={`px-2 py-2 ${d === today ? 'bg-primary/5' : ''}`}>
                            {entry ? (
                              <div>
                                <p className="text-xs font-medium">{entry.subject.name}</p>
                                <p className="text-[10px] text-muted-foreground">{entry.room}</p>
                              </div>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getTimeSlots(timetable: TimetableEntry[]) {
  const slots = [...new Set(timetable.map((e) => e.startTime))].sort()
  return slots
}
