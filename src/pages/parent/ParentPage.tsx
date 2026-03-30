import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Calendar, ChevronRight, DollarSign, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[24px]" />)}
      </div>
    )
  }

  const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0
  const totalPaid = payments.reduce((sum: number, payment: any) => (
    payment.status === 'SUCCESS' ? sum + payment.amount : sum
  ), 0)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-950 via-cyan-900 to-teal-800 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.9fr]">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Family Portal
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">
                {activeChild ? `${activeChild.firstName}'s progress at a glance.` : 'Monitor your child from one focused workspace.'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">
                Attendance, grades, and payment history are arranged into a cleaner parent-first experience.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Attendance rate</p>
              <p className="mt-2 text-3xl font-semibold">{attendanceRate}%</p>
              <p className="mt-2 text-sm text-white/70">Based on recorded sessions for the selected child.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Grades recorded</p>
              <p className="mt-2 text-3xl font-semibold">{grades.length}</p>
              <p className="mt-2 text-sm text-white/70">Assessment entries currently visible in the portal.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Payments made</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalPaid)}</p>
              <p className="mt-2 text-sm text-white/70">Successful parent-side payment volume for this child.</p>
            </div>
          </div>
        </div>
      </section>

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
            <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance rate</p>
                  <p className="text-3xl font-semibold">{attendanceRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grades recorded</p>
                  <p className="text-3xl font-semibold">{grades.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
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
              <TabsTrigger value="payments" className="rounded-2xl px-5 py-2.5">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
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
              <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
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

            <TabsContent value="payments">
              <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
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
