import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2, Clock, Plus, UserCheck, UserX, Eye, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

type Candidate = {
  id: string
  candidateCode: string
  firstName: string
  lastName: string
  dob?: string
  applicationData?: {
    previousSchool?: string
    classAppliedFor?: string
    parentPhone?: string
    [key: string]: unknown
  }
  status: 'PENDING' | 'ADMITTED' | 'REJECTED'
  admittedAt?: string
  studentId?: string
  createdAt: string
}

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
  previousSchool: z.string().optional(),
  classAppliedFor: z.string().optional(),
  parentPhone: z.string().optional(),
})
type CreateForm = z.infer<typeof createSchema>

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const, icon: Clock },
  ADMITTED: { label: 'Admitted', variant: 'success' as const, icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', variant: 'destructive' as const, icon: UserX },
}

export default function CandidatesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null)
  const qc = useQueryClient()

  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: () => api.get('/candidates').then(r => r.data),
  })

  const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/candidates', {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob || undefined,
      applicationData: {
        previousSchool: data.previousSchool || undefined,
        classAppliedFor: data.classAppliedFor || undefined,
        parentPhone: data.parentPhone || undefined,
      },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate registered')
      setCreateOpen(false)
      form.reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const admitMutation = useMutation({
    mutationFn: (id: string) => api.post(`/candidates/${id}/admit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      toast.success('Candidate admitted — student record created')
      setDetailCandidate(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Admission failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.put(`/candidates/${id}`, { status: 'REJECTED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate rejected')
      setDetailCandidate(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const pending = candidates.filter(c => c.status === 'PENDING')
  const admitted = candidates.filter(c => c.status === 'ADMITTED')
  const rejected = candidates.filter(c => c.status === 'REJECTED')

  const columns: ColumnDef<Candidate>[] = [
    { accessorKey: 'candidateCode', header: 'Code' },
    { id: 'name', header: 'Name', cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}` },
    { accessorKey: 'dob', header: 'Date of Birth', cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : '—' },
    {
      id: 'classApplied', header: 'Class Applied',
      cell: ({ row }) => (row.original.applicationData?.classAppliedFor as string) || '—',
    },
    {
      id: 'previousSchool', header: 'Previous School',
      cell: ({ row }) => (row.original.applicationData?.previousSchool as string) || '—',
    },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue() as Candidate['status']
        const cfg = statusConfig[s]
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    { accessorKey: 'createdAt', header: 'Applied', cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setDetailCandidate(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'PENDING' && (
            <>
              <Button variant="ghost" aria-label="Admit" size="icon" className="rounded-xl text-success" onClick={() => admitMutation.mutate(row.original.id)}>
                <UserCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" aria-label="Reject" size="icon" className="rounded-xl text-destructive" onClick={() => rejectMutation.mutate(row.original.id)}>
                <UserX className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admissions"
        title="Candidates"
        description="Register applicants and admit them into the school."
        stats={[
          { label: 'Total', value: candidates.length },
          { label: 'Pending', value: pending.length },
          { label: 'Admitted', value: admitted.length },
        ]}
        actions={
          <div className="flex gap-2">
            <CsvUploadDialog
              title="Upload Candidates CSV"
              uploadUrl="/candidates/upload-csv"
              templateUrl="/candidates/csv-template"
              templateFileName="candidates-template.csv"
              invalidateKeys={[['candidates']]}
              trigger={<Button className="h-10 rounded-xl border border-white/30 bg-white/10 px-5 text-white hover:bg-white/20"><Upload className="mr-2 h-4 w-4" />CSV Upload</Button>}
            />
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl px-5"><Plus className="mr-2 h-4 w-4" />New Candidate</Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl">
                <DialogHeader><DialogTitle>Register Candidate</DialogTitle></DialogHeader>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>First Name</Label>
                      <Input className="h-11 rounded-2xl" {...form.register('firstName')} />
                      {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Last Name</Label>
                      <Input className="h-11 rounded-2xl" {...form.register('lastName')} />
                      {form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Date of Birth</Label>
                    <Input className="h-11 rounded-2xl" type="date" {...form.register('dob')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Class Applied For</Label>
                      <Input className="h-11 rounded-2xl" placeholder="e.g. JSS 1" {...form.register('classAppliedFor')} />
                    </div>
                    <div className="space-y-1">
                      <Label>Previous School</Label>
                      <Input className="h-11 rounded-2xl" {...form.register('previousSchool')} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Parent Phone</Label>
                    <Input className="h-11 rounded-2xl" placeholder="+234..." {...form.register('parentPhone')} />
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-2xl" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Registering...' : 'Register Candidate'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Pipeline summary cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-2/10 text-warning-foreground dark:text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-semibold">{pending.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-success-light text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admitted</p>
              <p className="text-3xl font-semibold">{admitted.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-3xl font-semibold">{rejected.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tabs: All / Pending / Admitted / Rejected */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="all">All ({candidates.length})</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="admitted">Admitted ({admitted.length})</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><DataTable data={candidates} columns={columns} searchKey="lastName" isLoading={isLoading} /></TabsContent>
        <TabsContent value="pending"><DataTable data={pending} columns={columns} searchKey="lastName" isLoading={isLoading} /></TabsContent>
        <TabsContent value="admitted"><DataTable data={admitted} columns={columns} searchKey="lastName" isLoading={isLoading} /></TabsContent>
        <TabsContent value="rejected"><DataTable data={rejected} columns={columns} searchKey="lastName" isLoading={isLoading} /></TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detailCandidate} onOpenChange={(v) => { if (!v) setDetailCandidate(null) }}>
        <DialogContent className="rounded-xl max-w-lg">
          <DialogHeader><DialogTitle>Candidate Details</DialogTitle></DialogHeader>
          {detailCandidate && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{detailCandidate.firstName} {detailCandidate.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{detailCandidate.candidateCode}</p>
                </div>
                <Badge variant={statusConfig[detailCandidate.status].variant} className="text-sm px-3 py-1">
                  {statusConfig[detailCandidate.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-secondary/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{detailCandidate.dob ? formatDate(detailCandidate.dob) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Applied</p>
                  <p className="font-medium">{formatDate(detailCandidate.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class Applied For</p>
                  <p className="font-medium">{detailCandidate.applicationData?.classAppliedFor || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Previous School</p>
                  <p className="font-medium">{detailCandidate.applicationData?.previousSchool || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parent Phone</p>
                  <p className="font-medium">{detailCandidate.applicationData?.parentPhone || '—'}</p>
                </div>
                {detailCandidate.admittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Admitted On</p>
                    <p className="font-medium">{formatDate(detailCandidate.admittedAt)}</p>
                  </div>
                )}
              </div>

              {detailCandidate.status === 'PENDING' && (
                <div className="flex gap-3">
                  <Button
                    className="h-11 flex-1 rounded-2xl bg-success hover:bg-success/90"
                    onClick={() => admitMutation.mutate(detailCandidate.id)}
                    disabled={admitMutation.isPending}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {admitMutation.isPending ? 'Admitting...' : 'Admit'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-11 flex-1 rounded-2xl"
                    onClick={() => rejectMutation.mutate(detailCandidate.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              )}

              {detailCandidate.status === 'ADMITTED' && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                  <p className="text-sm font-medium text-success dark:text-green-200">
                    This candidate has been admitted and a student record was created.
                  </p>
                </div>
              )}

              {detailCandidate.status === 'REJECTED' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    This application was rejected.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
