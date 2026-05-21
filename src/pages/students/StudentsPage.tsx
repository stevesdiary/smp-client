import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import { PageHeader } from '@/components/shared/PageHeader'
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First Name</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Last Name</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Date of Birth</Label>
        <Input type="date" {...register('dob')} />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : student ? 'Update Student' : 'Add Student'}
      </Button>
    </form>
  )
}

export default function StudentsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Student | undefined>()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const limit = 25

  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout>>()
  function onSearch(val: string) {
    setSearch(val)
    clearTimeout(searchTimer)
    setSearchTimer(setTimeout(() => { setDebouncedSearch(val); setPage(1) }, 400))
  }

  const { data: studentsResponse, isLoading } = useQuery<{ data: Student[]; total: number; page: number; limit: number }>({
    queryKey: ['students', page, limit, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      return api.get(`/students?${params}`).then(r => r.data)
    },
    placeholderData: keepPreviousData,
  })

  const students = studentsResponse?.data ?? []
  const total = studentsResponse?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const columns: ColumnDef<Student>[] = [
    { accessorKey: 'studentId', header: 'Student ID', cell: ({ getValue }) => getValue() || '—' },
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'dob', header: 'Date of Birth', cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : '—' },
    { accessorKey: 'createdAt', header: 'Enrolled', cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Edit student" onClick={() => { setEditing(row.original); setOpen(true) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete student" onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student registry"
        title="Students"
        description="Manage student records, enrollment, and learner data."
        stats={[
          { label: 'Total enrolled', value: total },
          { label: 'This page', value: students.length },
          { label: 'With DOB', value: students.filter(s => s.dob).length },
        ]}
        actions={
          <>
            <CsvUploadDialog
              title="Upload Students CSV"
              uploadUrl="/students/upload-csv"
              templateUrl="/students/csv-template"
              templateFileName="students-template.csv"
              invalidateKeys={[['students']]}
            />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined) }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" />Add Student</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editing} onSuccess={() => { setOpen(false); setEditing(undefined) }} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Server-side search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by name or student code…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-3"
          />
        </div>
        <span className="text-sm text-muted-foreground">{total} students</span>
      </div>

      {/* Table — searchKey omitted to avoid duplicate search UI */}
      <DataTable data={students} columns={columns} isLoading={isLoading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
