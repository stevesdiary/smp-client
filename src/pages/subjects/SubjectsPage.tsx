import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { ModuleHero } from '@/components/shared/ModuleHero'
import api from '@/lib/api'
import type { Class, Teacher, AcademicYear } from '@/types'

type SubjectRow = {
  id: string
  name: string
  code?: string
  classId?: string
  class?: Class
  teacherId?: string
  teacher?: Teacher
  academicYearId?: string
  academicYear?: AcademicYear
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  code: z.string().optional(),
  classId: z.string().min(1, 'Select a class'),
  academicYearId: z.string().min(1, 'Select an academic year'),
})
type FormData = z.infer<typeof schema>

export default function SubjectsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectRow | undefined>()
  const qc = useQueryClient()

  const { data: subjects = [], isLoading } = useQuery<SubjectRow[]>({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data),
  })
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  })
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data),
  })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing
      ? { name: editing.name, code: editing.code ?? '', classId: editing.classId ?? '', academicYearId: editing.academicYearId ?? '' }
      : undefined,
  })

  const closeDialog = () => { setOpen(false); reset(); setEditing(undefined) }

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? api.put(`/subjects/${editing.id}`, data) : api.post('/subjects', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] })
      toast.success(editing ? 'Subject updated' : 'Subject created')
      closeDialog()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Deleted') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const assignedCount = subjects.filter(s => s.teacher).length
  const classCount = new Set(subjects.map(s => s.classId).filter(Boolean)).size

  const columns: ColumnDef<SubjectRow>[] = [
    { accessorKey: 'name', header: 'Subject' },
    { accessorKey: 'code', header: 'Code', cell: ({ getValue }) => (getValue() as string) || '—' },
    { id: 'class', header: 'Class', cell: ({ row }) => row.original.class?.name || '—' },
    {
      id: 'teacher',
      header: 'Assigned Teacher',
      cell: ({ row }) => {
        const t = row.original.teacher
        return t ? (
          <span className="flex items-center gap-1.5 text-sm">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            {t.firstName} {t.lastName}
          </span>
        ) : <Badge variant="outline" className="text-xs">Unassigned</Badge>
      },
    },
    {
      id: 'year',
      header: 'Academic Year',
      cell: ({ row }) => row.original.academicYear?.name || '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl"
            onClick={() => { setEditing(row.original); setOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl"
            onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Subject registry"
        title="Manage subjects across classes and academic years."
        description="Create subjects, link them to classes and academic years, and assign teachers directly from this view."
        stats={[
          { label: 'Subjects', value: subjects.length, detail: 'Total subjects configured in the system.' },
          { label: 'Teacher-assigned', value: assignedCount, detail: 'Subjects already linked to a teacher.' },
          { label: 'Classes covered', value: classCount, detail: 'Distinct classes with at least one subject.' },
        ]}
        actions={
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true) }}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-5">
                <Plus className="mr-2 h-4 w-4" />Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Subject Name</Label>
                    <Input className="h-11 rounded-2xl" {...register('name')} placeholder="Mathematics" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Code <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input className="h-11 rounded-2xl" {...register('code')} placeholder="MATH-101" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Class</Label>
                  <Select defaultValue={editing?.classId} onValueChange={v => setValue('classId', v)}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Academic Year</Label>
                  <Select defaultValue={editing?.academicYearId} onValueChange={v => setValue('academicYearId', v)}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}{y.isCurrent ? ' (current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academicYearId && <p className="text-xs text-destructive">{errors.academicYearId.message}</p>}
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable data={subjects} columns={columns} searchKey="name" isLoading={isLoading} />
    </div>
  )
}
