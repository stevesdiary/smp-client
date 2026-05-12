import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
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
          <Input className="h-11 rounded-2xl" {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input className="h-11 rounded-2xl" {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <Label>Date of Birth</Label>
        <Input className="h-11 rounded-2xl" type="date" {...register('dob')} />
      </div>
      <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
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

  // Simple debounce
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Student registry
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">Manage student records with a cleaner operating surface.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">
                Enrollment data remains connected to the live student API while the interface now feels closer to the richer client direction.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Total enrolled</p>
              <p className="mt-2 text-3xl font-semibold">{total}</p>
              <p className="mt-2 text-sm text-white/70">Active learner records in the registry.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">This page</p>
              <p className="mt-2 text-3xl font-semibold">{students.length}</p>
              <p className="mt-2 text-sm text-white/70">Showing {students.length} of {total} students.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">With DOB on file</p>
              <p className="mt-2 text-3xl font-semibold">{students.filter(s => s.dob).length}</p>
              <p className="mt-2 text-sm text-white/70">Students with date of birth recorded.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Student records</h2>
            <p className="text-sm text-muted-foreground">Search, review, and maintain the school’s active learner list.</p>
          </div>
          <div className="flex gap-2">
            <CsvUploadDialog
              title="Upload Students CSV"
              uploadUrl="/students/upload-csv"
              templateUrl="/students/csv-template"
              templateFileName="students-template.csv"
              invalidateKeys={[['students']]}
            />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined) }}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />Add Student</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
              </DialogHeader>
              <StudentForm student={editing} onSuccess={() => { setOpen(false); setEditing(undefined) }} />
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 rounded-2xl pl-9"
              placeholder="Search by name or student code…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <span className="text-sm text-muted-foreground">{total} students</span>
        </div>

        <DataTable data={students} columns={columns} searchKey="lastName" isLoading={isLoading} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
