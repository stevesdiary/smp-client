import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Student } from '@/types'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function StudentForm({ student, onSuccess }: { student?: Student; onSuccess: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: student,
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => student
      ? api.put(`/students/${student.id}`, data)
      : api.post('/students', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success(student ? 'Student updated' : 'Student created')
      onSuccess()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>First Name</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <Label>Date of Birth</Label>
        <Input type="date" {...register('dob')} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
      </Button>
    </form>
  )
}

export default function StudentsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Student | undefined>()
  const qc = useQueryClient()

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const columns: ColumnDef<Student>[] = [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'dob', header: 'Date of Birth', cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : '—' },
    { accessorKey: 'createdAt', header: 'Enrolled', cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(row.original); setOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-muted-foreground">{students.length} total students</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined) }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
            </DialogHeader>
            <StudentForm student={editing} onSuccess={() => { setOpen(false); setEditing(undefined) }} />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable data={students} columns={columns} searchKey="lastName" isLoading={isLoading} />
    </div>
  )
}
