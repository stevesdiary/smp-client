import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronLeft, ChevronRight, Eye, Pencil, Plus, Trash2, Search,
  Users, Phone, Mail, CalendarDays, ContactRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}

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

// Build a compact page list with ellipses, e.g. [1, 2, 3, '…', 62]
function pageList(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('…')
  pages.push(totalPages)
  return pages
}

function StatCard({
  label, value, accent, hint, icon: Icon, iconClass,
}: {
  label: string; value: string | number; accent: string; hint: string
  icon: typeof Users; iconClass: string
}) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border-b-4 bg-surface-container-lowest p-6 shadow-soft ${accent}`}>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="mt-1 font-mono text-4xl font-black text-on-surface">{value}</h3>
        <p className="mt-2 text-xs font-bold text-muted-foreground">{hint}</p>
      </div>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-7 w-7" strokeWidth={1.5} />
      </div>
    </div>
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
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const withGuardian = students.filter(s => s.guardian?.phone || s.guardian?.email).length
  const withDob = students.filter(s => s.dob).length

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Student deleted') },
    onError: () => toast.error('Failed to delete'),
  })

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Student registry</p>
        <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Student Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage learner records, enrollment, and guardian contacts.</p>
      </div>

      {/* Summary bento */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Total Students" value={total} hint="Enrolled across the school"
          accent="border-primary" icon={Users} iconClass="bg-primary-container/10 text-primary"
        />
        <StatCard
          label="Guardian Contacts" value={withGuardian} hint="On this page"
          accent="border-secondary-container" icon={ContactRound} iconClass="bg-secondary-container/10 text-secondary"
        />
        <StatCard
          label="Birth Dates on Record" value={withDob} hint="On this page"
          accent="border-outline-variant" icon={CalendarDays} iconClass="bg-outline-variant/20 text-outline"
        />
      </section>

      {/* Filter / action bar */}
      <section className="rounded-3xl bg-surface-container-low p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by name or Student ID…"
              aria-label="Search students"
              className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-secondary-container/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <CsvUploadDialog
              title="Upload Students CSV"
              uploadUrl="/students/upload-csv"
              templateUrl="/students/csv-template"
              templateFileName="students-template.csv"
              invalidateKeys={[['students']]}
            />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(undefined) }}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-secondary-fixed px-5 py-2.5 text-sm font-extrabold text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim">
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  New Admission
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Student' : 'New Admission'}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editing} onSuccess={() => { setOpen(false); setEditing(undefined) }} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Data table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Student Information</th>
                <th className="px-6 py-5">Parent Contact</th>
                <th className="px-6 py-5">Date of Birth</th>
                <th className="px-6 py-5">Enrolled</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-8 py-5">
                      <div className="h-10 animate-pulse rounded-xl bg-surface-container-low" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <p className="text-sm font-semibold text-on-surface">No students found</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {debouncedSearch ? 'Try a different search term.' : 'Add your first student to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-surface-container-low/50">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-sm font-black text-primary-container">
                          {initials(s.firstName, s.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface transition-colors group-hover:text-primary">
                            {s.lastName}, {s.firstName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {s.studentId ?? s.studentCode ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {s.guardian?.phone || s.guardian?.email ? (
                        <div className="space-y-0.5">
                          {s.guardian?.phone && (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                              <Phone className="h-3.5 w-3.5 text-outline" strokeWidth={1.5} />
                              <span>{s.guardian.phone}</span>
                            </div>
                          )}
                          {s.guardian?.email && (
                            <div className="flex items-center gap-1.5 pl-5 text-xs text-muted-foreground">
                              <Mail className="hidden h-3 w-3 text-outline" strokeWidth={1.5} />
                              <span className="truncate">{s.guardian.email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {s.dob ? (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">
                          {formatDate(s.dob)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{formatDate(s.createdAt)}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/students/${s.id}`}
                          className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"
                          title="View profile"
                          aria-label={`View ${s.firstName} ${s.lastName}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"
                          title="Edit"
                          aria-label={`Edit ${s.firstName} ${s.lastName}`}
                          onClick={() => { setEditing(s); setOpen(true) }}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          className="rounded-lg p-2 text-outline transition-all hover:bg-destructive/5 hover:text-destructive"
                          title="Delete"
                          aria-label={`Delete ${s.firstName} ${s.lastName}`}
                          onClick={() => deleteMutation.mutate(s.id)}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface px-8 py-5 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold text-on-surface">{from} - {to}</span> of{' '}
            <span className="font-bold text-on-surface">{total}</span> students
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 transition-colors hover:bg-surface-container-high disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {pageList(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-1 text-outline-variant">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    p === page
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'border border-outline-variant/20 hover:bg-surface-container-high'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 transition-colors hover:bg-surface-container-high disabled:opacity-30"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
