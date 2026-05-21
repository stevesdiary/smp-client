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
import { PageHeader } from '@/components/shared/PageHeader'
import api from '@/lib/api'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import { formatCurrency } from '@/lib/utils'

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
          <Button variant="ghost" aria-label="Edit" size="icon" className="rounded-xl" onClick={() => { setEditing(row.original); setOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" aria-label="Delete" size="icon" className="rounded-xl" onClick={() => deleteMutation.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academic core"
        title="Teachers"
        description="Faculty records and subject assignments."
        stats={[
          { label: 'Faculty', value: teachers.length },
          { label: 'With subject', value: teachers.filter((t: any) => t.subject).length },
        ]}
        actions={
          <div className="flex gap-2">
            <CsvUploadDialog
              title="Upload Teachers CSV"
              uploadUrl="/teachers/upload-csv"
              templateUrl="/teachers/csv-template"
              templateFileName="teachers-template.csv"
              invalidateKeys={[['teachers']]}
              trigger={<Button variant="outline"><Upload className="mr-2 h-4 w-4" />CSV Upload</Button>}
            />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setEditing(null) } }}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl px-5"><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
              </DialogTrigger>
            <DialogContent className="rounded-xl">
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
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total faculty</p>
              <p className="text-3xl font-semibold">{teachers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-2/10 text-warning-foreground dark:text-warning">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">With subject assigned</p>
              <p className="text-3xl font-semibold">{teachers.filter((t: any) => t.subject).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 dark:text-chart-1">
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
        const color = s === 'SUCCESS' ? 'bg-success-light text-success dark:bg-green-900 dark:text-green-200'
          : s === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{s}</span>
      },
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Track payment records and revenue."
        stats={[
          { label: 'Records', value: payments.length },
          { label: 'Successful', value: successfulPayments.length },
          { label: 'Revenue', value: formatCurrency(totalRevenue) },
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
