import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Calendar, ChevronRight, Clock, DollarSign, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/lib/api'

export default function ParentPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get('/parent/children').then(r => r.data),
  })

  const childId = selectedChild ?? children[0]?.id
  const activeChild = children.find((child: any) => child.id === childId)

  const { data: attendance = [] } = useQuery({
    queryKey: ['child-attendance', childId],
    queryFn: () => api.get(`/parent/children/${childId}/attendance`).then(r => r.data),
    enabled: !!childId,
  })

  const { data: grades = [] } = useQuery({
    queryKey: ['child-grades', childId],
    queryFn: () => api.get(`/parent/children/${childId}/grades`).then(r => r.data),
    enabled: !!childId,
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['child-payments', childId],
    queryFn: () => api.get(`/parent/children/${childId}/payments`).then(r => r.data),
    enabled: !!childId,
  })

  const { data: timetable = [] } = useQuery({
    queryKey: ['child-timetable', childId],
    queryFn: () => api.get(`/parent/children/${childId}/timetable`).then(r => r.data),
    enabled: !!childId,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
    )
  }

  const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0
  const totalPaid = payments.reduce((sum: number, payment: any) => (
    payment.status === 'SUCCESS' ? sum + payment.amount : sum
  ), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Family portal"
        title={activeChild ? `${activeChild.firstName}'s Progress` : 'Parent Portal'}
        description="Attendance, grades, and payment history for your child."
        stats={[
          { label: 'Attendance', value: `${attendanceRate}%` },
          { label: 'Grades', value: grades.length },
          { label: 'Paid', value: formatCurrency(totalPaid) },
        ]}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Select child</h2>
          <p className="text-sm text-muted-foreground">Each child keeps a separate progress view inside the same portal.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {children.map((child: any) => (
            <button
              key={child.id}
              onClick={() => setSelectedChild(child.id)}
              className={`group rounded-2xl border px-4 py-4 text-left transition ${
                childId === child.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-border/70 bg-white/75 shadow-sm hover:border-primary/30 hover:bg-primary/5 dark:bg-card/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  childId === child.id ? 'bg-white/15' : 'bg-primary/10 text-primary'
                }`}>
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{child.firstName} {child.lastName}</p>
                  <p className={`text-sm ${childId === child.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                    Child record available
                  </p>
                </div>
                <ChevronRight className={`ml-2 h-4 w-4 ${childId === child.id ? 'text-white/80' : 'text-muted-foreground'}`} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {childId && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance rate</p>
                  <p className="text-3xl font-semibold">{attendanceRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success-light text-emerald-700 dark:text-emerald-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grades recorded</p>
                  <p className="text-3xl font-semibold">{grades.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-2/10 text-warning-foreground dark:text-warning">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Successful payments</p>
                  <p className="text-3xl font-semibold">{payments.filter((payment: any) => payment.status === 'SUCCESS').length}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Tabs defaultValue="attendance" className="space-y-4">
            <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
              <TabsTrigger value="attendance" className="rounded-2xl px-5 py-2.5">Attendance</TabsTrigger>
              <TabsTrigger value="grades" className="rounded-2xl px-5 py-2.5">Grades</TabsTrigger>
              <TabsTrigger value="timetable" className="rounded-2xl px-5 py-2.5">Timetable</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-2xl px-5 py-2.5">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Recent attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attendance records available yet.</p>
                  ) : attendance.slice(0, 20).map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between rounded-2xl bg-secondary/55 px-4 py-4">
                      <div>
                        <p className="font-medium">{formatDate(record.date)}</p>
                        <p className="text-sm text-muted-foreground">Attendance checkpoint recorded</p>
                      </div>
                      <Badge variant={record.status === 'PRESENT' ? 'success' : record.status === 'ABSENT' ? 'destructive' : 'warning'}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grades">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Grades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
                  ) : grades.map((grade: any) => (
                    <div key={grade.id} className="flex items-center justify-between rounded-2xl bg-secondary/55 px-4 py-4">
                      <div>
                        <p className="font-medium">{grade.subject?.name}</p>
                        <p className="text-sm text-muted-foreground">{grade.assignment?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{grade.score}/{grade.maxScore}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recorded</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timetable">
              <Card className="rounded-xl">
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Weekly Timetable</CardTitle></CardHeader>
                <CardContent>
                  {timetable.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No timetable assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, di) => {
                        const dayEntries = timetable.filter((e: any) => e.dayOfWeek === di + 1)
                        if (!dayEntries.length) return null
                        return (
                          <div key={day}>
                            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{day}</p>
                            <div className="space-y-1">
                              {dayEntries.map((e: any) => (
                                <div key={e.id} className="flex items-center gap-3 rounded-xl border p-2">
                                  <span className="text-xs font-medium text-primary">{e.startTime}-{e.endTime}</span>
                                  <span className="text-sm">{e.subject?.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{e.teacher?.firstName} {e.teacher?.lastName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="rounded-xl">
                <CardHeader>
                  <CardTitle>Payment history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment records available yet.</p>
                  ) : payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-2xl bg-secondary/55 px-4 py-4">
                      <div>
                        <p className="font-medium">{payment.fee?.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        <Badge
                          variant={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'destructive' : 'warning'}
                          className="mt-2 text-[11px]"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
