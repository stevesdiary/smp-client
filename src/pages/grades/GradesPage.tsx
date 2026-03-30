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
import type { Student, Subject } from '@/types'
import { ModuleHero } from '@/components/shared/ModuleHero'

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
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data) })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/gradebook/grades', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grades', 'all-by-student'] }); toast.success('Grade recorded'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const averagePercent = grades.length > 0
    ? Math.round(grades.reduce((sum: number, grade: any) => sum + ((grade.score / grade.maxScore) * 100), 0) / grades.length)
    : 0

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
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Assessment desk"
        title="Record and review grades from a more deliberate academic surface."
        description="Grade recording still uses the existing gradebook endpoint while the interface now aligns with the richer app shell."
        stats={[
          { label: 'Records', value: grades.length, detail: 'Grade entries currently visible in the system.' },
          { label: 'Students', value: students.length, detail: 'Students available for grade entry.' },
          { label: 'Average', value: `${averagePercent}%`, detail: 'Mean score percentage across visible grade records.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Grades</h1><p className="text-muted-foreground">{grades.length} records</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="h-4 w-4 mr-2" />Record Grade</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Record Grade</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Student</Label>
                <Select onValueChange={v => setValue('studentId', v)}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                </Select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select onValueChange={v => setValue('subjectId', v)}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Score</Label><Input className="h-11 rounded-2xl" type="number" {...register('score')} /></div>
                <div className="space-y-1"><Label>Max Score</Label><Input className="h-11 rounded-2xl" type="number" {...register('maxScore')} defaultValue={100} /></div>
              </div>
              <div className="space-y-1"><Label>Remarks</Label><Input className="h-11 rounded-2xl" {...register('remarks')} placeholder="Optional" /></div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Grade'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={grades} columns={columns} isLoading={isLoading} />
    </div>
  )
}
