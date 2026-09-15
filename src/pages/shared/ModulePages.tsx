import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Layers3, Pencil, Plus, Trash2, Upload, Wallet, Search, Users, Clock, ChevronLeft, ChevronRight, CalendarDays, TrendingUp, AlertTriangle, Percent, Printer } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { RecordPaymentDialog } from './RecordPaymentDialog'
import api from '@/lib/api'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import { formatCurrency, formatDate } from '@/lib/utils'

// ─── Staff Directory (faculty / teaching staff) ─────────────────────────────

const teacherSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  subject: z.string().optional(),
})
type TeacherForm = z.infer<typeof teacherSchema>

function staffInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}

function StaffStat({
  label, value, accent, icon: Icon, iconClass,
}: {
  label: string; value: number; accent: string; icon: typeof Users; iconClass: string
}) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl border-l-4 bg-surface-container-lowest p-6 shadow-soft ${accent}`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}>
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-mono text-3xl font-black text-on-surface">{value}</p>
      </div>
    </div>
  )
}

export function TeachersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const qc = useQueryClient()

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    values: editing,
  })

  const mutation = useMutation({
    mutationFn: (data: TeacherForm) =>
      editing ? api.put(`/teachers/${editing.id}`, data) : api.post('/teachers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Saved')
      setOpen(false); reset(); setEditing(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teachers'] }); toast.success('Deleted') },
  })

  const withSubject = teachers.filter((t: any) => t.subject).length
  const q = search.trim().toLowerCase()
  const filtered = q
    ? teachers.filter((t: any) =>
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        (t.subject ?? '').toLowerCase().includes(q))
    : teachers
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize)

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Directory · Staff management</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Staff Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">Faculty and teaching staff records.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setEditing(null) } }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2} /> Add New Staff
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Staff' : 'Add New Staff'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <Label>Specialty / Subject</Label>
                <Input {...register('subject')} placeholder="Mathematics" />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary bento */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StaffStat label="Total Staff" value={teachers.length} accent="border-primary" icon={Users} iconClass="bg-primary-container/10 text-primary" />
        <StaffStat label="With Specialty" value={withSubject} accent="border-secondary-container" icon={GraduationCap} iconClass="bg-secondary-container/10 text-secondary" />
        <StaffStat label="Unassigned" value={teachers.length - withSubject} accent="border-outline-variant" icon={Layers3} iconClass="bg-outline-variant/20 text-outline" />
      </section>

      {/* Filter / action bar */}
      <section className="rounded-3xl bg-surface-container-low p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or specialty…"
              aria-label="Search staff"
              className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest pl-11 pr-4 text-sm text-on-surface outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-secondary-container/30"
            />
          </div>
          <CsvUploadDialog
            title="Upload Staff CSV"
            uploadUrl="/teachers/upload-csv"
            templateUrl="/teachers/csv-template"
            templateFileName="teachers-template.csv"
            invalidateKeys={[['teachers']]}
            trigger={
              <button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high">
                <Upload className="h-4 w-4" strokeWidth={1.5} /> CSV Upload
              </button>
            }
          />
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Staff Details</th>
                <th className="px-6 py-5">Specialty</th>
                <th className="px-6 py-5">Reference</th>
                <th className="px-6 py-5">Joined</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-8 py-5"><div className="h-10 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <p className="text-sm font-semibold text-on-surface">No staff found</p>
                    <p className="mt-1 text-xs text-muted-foreground">{q ? 'Try a different search term.' : 'Add your first staff member to get started.'}</p>
                  </td>
                </tr>
              ) : (
                rows.map((t: any) => (
                  <tr key={t.id} className="group transition-colors hover:bg-surface-container-low/50">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-sm font-black text-primary-container">
                          {staffInitials(t.firstName, t.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface transition-colors group-hover:text-primary">{t.firstName} {t.lastName}</p>
                          <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" strokeWidth={1.5} /> Joined {formatDate(t.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {t.subject ? (
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">{t.subject}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">General</span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono text-xs text-muted-foreground">#{String(t.id).slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-outline" strokeWidth={1.5} />{formatDate(t.createdAt)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"
                          title="Edit" aria-label={`Edit ${t.firstName} ${t.lastName}`}
                          onClick={() => { setEditing(t); setOpen(true) }}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          className="rounded-lg p-2 text-outline transition-all hover:bg-destructive/5 hover:text-destructive"
                          title="Delete" aria-label={`Delete ${t.firstName} ${t.lastName}`}
                          onClick={() => deleteMutation.mutate(t.id)}
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

        {/* Footer / pagination */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/10 bg-surface px-8 py-5 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold text-on-surface">{filtered.length === 0 ? 0 : (current - 1) * pageSize + 1} - {Math.min(current * pageSize, filtered.length)}</span> of{' '}
            <span className="font-bold text-on-surface">{filtered.length}</span> staff
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 transition-colors hover:bg-surface-container-high disabled:opacity-30"
                disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)} aria-current={p === current ? 'page' : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    p === current ? 'bg-primary text-primary-foreground shadow-md' : 'border border-outline-variant/20 hover:bg-surface-container-high'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/20 transition-colors hover:bg-surface-container-high disabled:opacity-30"
                disabled={current >= totalPages} onClick={() => setPage(current + 1)} aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Classes ─────────────────────────────────────────────────────────────────

const classSchema = z.object({
  name: z.string().min(1, 'Required'),
  level: z.string().optional(),
})
type ClassForm = z.infer<typeof classSchema>

export function ClassesPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: ClassForm) => api.post('/classes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class created')
      setOpen(false); reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Class Name' },
    { accessorKey: 'level', header: 'Level', cell: ({ getValue }) => (getValue() as string) || '—' },
    {
      id: 'teacher',
      header: 'Homeroom Teacher',
      cell: ({ row }) => {
        const t = row.original.teacher
        return t ? `${t.firstName} ${t.lastName}` : '—'
      },
    },
    {
      id: 'enrollments',
      header: 'Students',
      cell: ({ row }) => row.original._count?.enrollments ?? 0,
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Class structure"
        title="Classes"
        description="Organize classrooms and homeroom assignments."
        stats={[
          { label: 'Classes', value: classes.length },
          { label: 'Students', value: classes.reduce((sum: number, c: any) => sum + (c._count?.enrollments ?? 0), 0) },
        ]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 rounded-xl px-5"><Plus className="mr-2 h-4 w-4" />Add Class</Button>
            </DialogTrigger>
            <DialogContent className="rounded-xl">
              <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Class Name</Label>
                  <Input className="h-11 rounded-2xl" {...register('name')} placeholder="Grade 5A" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Level</Label>
                  <Input className="h-11 rounded-2xl" {...register('level')} placeholder="Primary" />
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Class'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable data={classes} columns={columns} searchKey="name" isLoading={isLoading} />
    </div>
  )
}

// ─── Fee Management (Financial Overview) ─────────────────────────────────────

const METHOD_BAR = ['bg-primary', 'bg-secondary-container', 'bg-primary-fixed-dim', 'bg-outline']

function paymentStatusBadge(s: string) {
  if (s === 'SUCCESS') return { label: 'Cleared', cls: 'bg-primary-fixed text-on-secondary-fixed' }
  if (s === 'FAILED') return { label: 'Failed', cls: 'bg-[#ffdad6] text-[#93000a]' }
  return { label: 'Pending', cls: 'bg-secondary-fixed text-on-secondary-fixed' }
}

function prettyMethod(method: string) {
  return (method || 'Other').toLowerCase().split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function PaymentsPage() {
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'all-by-student'],
    queryFn: fetchAllPaymentsByStudent,
  })

  const successful = payments.filter((p: any) => p.status === 'SUCCESS')
  const collected = successful.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const outstanding = payments.filter((p: any) => p.status === 'PENDING').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const billed = collected + outstanding
  const collectionRate = billed > 0 ? Math.round((collected / billed) * 100) : 0
  const naira0 = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

  // Monthly collection trend (last 6 months)
  const trend = (() => {
    const months: { key: string; label: string; total: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), total: 0 })
    }
    const idx = new Map(months.map((m, i) => [m.key, i]))
    successful.forEach((p: any) => {
      const d = new Date(p.createdAt)
      const k = `${d.getFullYear()}-${d.getMonth()}`
      if (idx.has(k)) months[idx.get(k)!].total += Number(p.amount || 0)
    })
    const max = Math.max(...months.map((m) => m.total), 1)
    return { months, max }
  })()

  // Collection by method
  const byMethod = (() => {
    const map = new Map<string, number>()
    successful.forEach((p: any) => map.set(p.method || 'Other', (map.get(p.method || 'Other') ?? 0) + Number(p.amount || 0)))
    return [...map.entries()].map(([method, total]) => ({ method, total, pct: collected > 0 ? Math.round((total / collected) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
  })()

  const recent = [...payments]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const session = new Date().toLocaleDateString('en-GB', { year: 'numeric' })

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Bursary · Fee management</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Financial Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Session {session} · collections and outstanding balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <RecordPaymentDialog
            trigger={
              <button className="flex items-center gap-2 rounded-xl bg-secondary-fixed px-5 py-2.5 text-sm font-extrabold text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim">
                <Plus className="h-4 w-4" strokeWidth={2} /> Record Payment
              </button>
            }
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
          >
            <Printer className="h-4 w-4" strokeWidth={1.5} /> Generate Report
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-xl bg-primary-fixed p-2 text-primary"><Wallet className="h-5 w-5" strokeWidth={1.5} /></span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Billed</p>
          <h3 className="font-mono text-2xl font-black text-primary-container">{naira0(billed)}</h3>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-xl bg-primary-fixed p-2 text-primary"><TrendingUp className="h-5 w-5" strokeWidth={1.5} /></span>
            <span className="text-[10px] font-bold text-muted-foreground">{collectionRate}%</span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Collected</p>
          <h3 className="mb-3 font-mono text-2xl font-black text-primary-container">{naira0(collected)}</h3>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div className="h-full rounded-full bg-primary" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>
        <div className="rounded-2xl bg-secondary-fixed/40 p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-xl bg-secondary-fixed p-2 text-on-secondary-fixed"><AlertTriangle className="h-5 w-5" strokeWidth={1.5} /></span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-secondary-fixed/70">Total Outstanding</p>
          <h3 className="font-mono text-2xl font-black text-[#835500]">{naira0(outstanding)}</h3>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-xl bg-surface-container p-2 text-primary"><Percent className="h-5 w-5" strokeWidth={1.5} /></span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Collection Rate</p>
          <h3 className="font-headline text-2xl font-black text-primary-container">{collectionRate}%</h3>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Collection trend */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:col-span-2 lg:p-8">
          <h2 className="mb-1 font-headline text-xl font-extrabold text-on-surface">Collection Trend</h2>
          <p className="mb-8 text-sm text-outline">Successful collections · last 6 months</p>
          {collected === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-surface text-sm text-muted-foreground">No collections recorded yet.</div>
          ) : (
            <div className="flex h-48 items-end justify-between gap-3">
              {trend.months.map((m, i) => {
                const isLast = i === trend.months.length - 1
                return (
                  <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div
                        className={`group relative w-full max-w-[48px] rounded-t-lg transition-colors ${isLast ? 'bg-primary' : 'bg-primary-fixed hover:bg-primary'}`}
                        style={{ height: `${Math.max(Math.round((m.total / trend.max) * 100), 2)}%` }}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          {formatCurrency(m.total)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{m.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Collection by method */}
        <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
          <h2 className="mb-1 font-headline text-xl font-extrabold text-on-surface">Collection by Method</h2>
          <p className="mb-6 text-sm text-outline">Share of total collected</p>
          {byMethod.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-5">
              {byMethod.map((m, i) => (
                <div key={m.method}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-bold text-on-surface">{prettyMethod(m.method)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{m.pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-low">
                    <div className={`h-full rounded-full ${METHOD_BAR[i % METHOD_BAR.length]}`} style={{ width: `${Math.max(m.pct, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent payment activity */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="flex items-center justify-between px-8 py-6">
          <h2 className="font-headline text-xl font-extrabold text-on-surface">Recent Payment Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-4">Student</th>
                <th className="px-6 py-4">Fee Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center">
                  <p className="text-sm font-semibold text-on-surface">No payments recorded</p>
                  <p className="mt-1 text-xs text-muted-foreground">Payment activity will appear here as fees are collected.</p>
                </td></tr>
              ) : (
                recent.map((p: any) => {
                  const badge = paymentStatusBadge(p.status)
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-8 py-5 font-bold text-on-surface">{p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Unknown'}</td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">{p.fee?.name ?? 'Fee'}</span>
                      </td>
                      <td className="px-6 py-5 font-mono text-sm font-bold text-on-surface">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-5 text-sm text-muted-foreground">{prettyMethod(p.method)}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${badge.cls}`}>{badge.label}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ─── Placeholder ─────────────────────────────────────────────────────────────

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-2">This module is coming soon.</p>
    </div>
  )
}
