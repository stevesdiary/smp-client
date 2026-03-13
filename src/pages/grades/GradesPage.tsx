import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { fetchAllGradesByStudent } from '@/lib/moduleQueries'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1),
  remarks: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function GradesPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades', 'all-by-student'],
    queryFn: fetchAllGradesByStudent,
  })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data) })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/gradebook/grades', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grades', 'all-by-student'] }); toast.success('Grade recorded'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const columns: ColumnDef<any>[] = [
    { id: 'student', header: 'Student', cell: ({ row }) => `${row.original.student?.firstName ?? ''} ${row.original.student?.lastName ?? ''}` },
    { id: 'subject', header: 'Subject', cell: ({ row }) => row.original.subject?.name ?? '—' },
    { id: 'assignment', header: 'Assignment', cell: ({ row }) => row.original.assignment?.title ?? 'Manual' },
    { id: 'score', header: 'Score', cell: ({ row }) => `${row.original.score}/${row.original.maxScore}` },
    {
      id: 'pct', header: '%',
      cell: ({ row }) => {
        const pct = Math.round((row.original.score / row.original.maxScore) * 100)
        return <Badge variant={pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'destructive'}>{pct}%</Badge>
      },
    },
    { accessorKey: 'gradedAt', header: 'Date', cell: ({ getValue }) => formatDate(getValue() as string) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Grades</h1><p className="text-muted-foreground">{grades.length} records</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Record Grade</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Grade</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Student</Label>
                <Select onValueChange={v => setValue('studentId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s: unknown) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                </Select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select onValueChange={v => setValue('subjectId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Score</Label><Input type="number" {...register('score')} /></div>
                <div className="space-y-1"><Label>Max Score</Label><Input type="number" {...register('maxScore')} defaultValue={100} /></div>
              </div>
              <div className="space-y-1"><Label>Remarks</Label><Input {...register('remarks')} placeholder="Optional" /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Grade'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={grades} columns={columns} isLoading={isLoading} />
    </div>
  )
}
