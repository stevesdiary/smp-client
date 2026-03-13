import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { Student } from '@/types'

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

const statusConfig = {
  PRESENT: { icon: Check, color: 'success', label: 'Present' },
  ABSENT: { icon: X, color: 'destructive', label: 'Absent' },
  LATE: { icon: Clock, color: 'warning', label: 'Late' },
  EXCUSED: { icon: AlertCircle, color: 'secondary', label: 'Excused' },
} as const

export default function AttendancePage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const qc = useQueryClient()

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data),
  })

  const bulkMutation = useMutation({
    mutationFn: (records: any[]) => api.post('/attendance/bulk', { records }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); toast.success('Attendance saved') },
    onError: () => toast.error('Failed to save attendance'),
  })

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {}
    students.forEach(s => { all[s.id] = status })
    setAttendance(all)
  }

  const submit = () => {
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, date, status
    }))
    if (records.length === 0) return toast.error('Mark attendance first')
    bulkMutation.mutate(records)
  }

  const marked = Object.keys(attendance).length
  const present = Object.values(attendance).filter(s => s === 'PRESENT').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-muted-foreground">{marked}/{students.length} marked · {present} present</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <Button onClick={submit} disabled={bulkMutation.isPending}>
            {bulkMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(statusConfig) as AttendanceStatus[]).map(status => (
          <Button key={status} variant="outline" size="sm" onClick={() => markAll(status)}>
            Mark All {statusConfig[status].label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <Card>
          <CardHeader><CardTitle>Students</CardTitle></CardHeader>
          <CardContent className="p-0">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-6 py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{student.firstName} {student.lastName}</p>
                  {attendance[student.id] && (
                    <Badge variant={statusConfig[attendance[student.id]].color as any} className="text-xs mt-0.5">
                      {statusConfig[attendance[student.id]].label}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {(Object.keys(statusConfig) as AttendanceStatus[]).map(status => {
                    const { icon: Icon } = statusConfig[status]
                    return (
                      <Button
                        key={status}
                        variant={attendance[student.id] === status ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAttendance(prev => ({ ...prev, [student.id]: status }))}
                        title={statusConfig[status].label}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
