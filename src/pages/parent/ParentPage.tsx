import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ClipboardList, BookOpen, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

export default function ParentPage() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get('/parent/children').then(r => r.data),
  })

  const childId = selectedChild ?? children[0]?.id

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

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>

  const presentCount = attendance.filter((a: any) => a.status === 'PRESENT').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Parent Portal</h1>
        <p className="text-muted-foreground">Monitor your children's progress</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {children.map((child: any) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              (childId === child.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'
            }`}
          >
            <Users className="h-4 w-4" />
            {child.firstName} {child.lastName}
          </button>
        ))}
      </div>

      {childId && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-semibold">{attendanceRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grades Recorded</p>
                  <p className="text-2xl font-semibold">{grades.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <p className="text-2xl font-semibold">{payments.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance">
            <TabsList>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="grades">Grades</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card>
                <CardHeader><CardTitle>Recent Attendance</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {attendance.slice(0, 20).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between px-6 py-3 border-b last:border-0">
                      <p className="text-sm">{formatDate(a.date)}</p>
                      <Badge variant={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'destructive' : 'warning'}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grades">
              <Card>
                <CardHeader><CardTitle>Grades</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {grades.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between px-6 py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{g.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{g.assignment?.title}</p>
                      </div>
                      <p className="font-semibold">{g.score}/{g.maxScore}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-6 py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.fee?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(p.amount)}</p>
                        <Badge variant={p.status === 'SUCCESS' ? 'success' : p.status === 'FAILED' ? 'destructive' : 'warning'} className="text-xs">
                          {p.status}
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
