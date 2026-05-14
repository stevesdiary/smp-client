import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Layers3, Pencil, Plus, Trash2, Upload, Wallet } from 'lucide-react'
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
import api from '@/lib/api'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import { formatCurrency } from '@/lib/utils'

type ModuleHeroStat = {
  label: string
  value: string | number
  detail: string
}

function ModuleHero({
  eyebrow,
  title,
  description,
  stats,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  stats: ModuleHeroStat[]
  actions?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
        <div className="space-y-4">
          <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
            {eyebrow}
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">{description}</p>
          </div>
          {actions}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-white/70">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Teachers ───────────────────────────────────────────────────────────────

const teacherSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  subject: z.string().optional(),
})
type TeacherForm = z.infer<typeof teacherSchema>

export function TeachersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
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

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'firstName', header: 'First Name' },
    { accessorKey: 'lastName', header: 'Last Name' },
    { accessorKey: 'subject', header: 'Subject', cell: ({ getValue }) => (getValue() as string) || '—' },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { setEditing(row.original); setOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Academic core"
        title="Faculty records in one cleaner workspace."
        description="Teacher records remain live and editable while the page now matches the richer shell and dashboard direction."
        stats={[
          { label: 'Total faculty', value: teachers.length, detail: 'Current faculty profiles in the system.' },
          { label: 'With subject', value: teachers.filter((t: any) => t.subject).length, detail: 'Teachers with a subject specialty on file.' },
          { label: 'Unassigned', value: teachers.filter((t: any) => !t.subject).length, detail: 'Faculty not yet linked to a subject.' },
        ]}
        actions={
          <div className="flex gap-2">
            <CsvUploadDialog
              title="Upload Teachers CSV"
              uploadUrl="/teachers/upload-csv"
              templateUrl="/teachers/csv-template"
              templateFileName="teachers-template.csv"
              invalidateKeys={[['teachers']]}
              trigger={<Button className="h-12 rounded-2xl border border-white/30 bg-white/10 px-5 text-white hover:bg-white/20"><Upload className="mr-2 h-4 w-4" />CSV Upload</Button>}
            />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setEditing(null) } }}>
              <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
              </DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Teacher</DialogTitle></DialogHeader>
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
                  <Label>Subject</Label>
                  <Input className="h-11 rounded-2xl" {...register('subject')} placeholder="Mathematics" />
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total faculty</p>
              <p className="text-3xl font-semibold">{teachers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With subject assigned</p>
              <p className="text-3xl font-semibold">{teachers.filter((t: any) => t.subject).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Without subject</p>
              <p className="text-3xl font-semibold">{teachers.filter((t: any) => !t.subject).length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <DataTable data={teachers} columns={columns} searchKey="lastName" isLoading={isLoading} />
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
      <ModuleHero
        eyebrow="Class structure"
        title="Organize classes with a stronger classroom operations view."
        description="Class creation stays simple, but the page now aligns visually with the richer client direction."
        stats={[
          { label: 'Total classes', value: classes.length, detail: 'Current class records available in the system.' },
          { label: 'Homeroom linked', value: classes.filter((item: any) => item.teacher).length, detail: 'Classes already assigned a homeroom teacher.' },
          { label: 'Total students', value: classes.reduce((sum: number, c: any) => sum + (c._count?.enrollments ?? 0), 0), detail: 'Enrolled students across all classes.' },
        ]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />Add Class</Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px]">
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

// ─── Payments ────────────────────────────────────────────────────────────────

export function PaymentsPage() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', 'all-by-student'],
    queryFn: fetchAllPaymentsByStudent,
  })
  const successfulPayments = payments.filter((payment: any) => payment.status === 'SUCCESS')
  const totalRevenue = successfulPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)

  const columns: ColumnDef<any>[] = [
    {
      id: 'student',
      header: 'Student',
      cell: ({ row }) => `${row.original.student?.firstName ?? ''} ${row.original.student?.lastName ?? ''}`,
    },
    { id: 'fee', header: 'Fee', cell: ({ row }) => row.original.fee?.name ?? '—' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
    },
    { accessorKey: 'method', header: 'Method' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as string
        const color = s === 'SUCCESS' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          : s === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{s}</span>
      },
    },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Finance"
        title="Track payment flow with a clearer revenue view."
        description="Payments stay connected to the current module query layer while the page gains the same richer framing as the rest of the app."
        stats={[
          { label: 'Records', value: payments.length, detail: 'All payment records currently loaded.' },
          { label: 'Successful', value: successfulPayments.length, detail: 'Payments marked as successful.' },
          { label: 'Revenue', value: formatCurrency(totalRevenue), detail: 'Aggregate of successful payment amounts.' },
        ]}
      />
      <DataTable data={payments} columns={columns} isLoading={isLoading} />
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
