import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, UserCheck, UserX, Eye, Upload, Users, Clock, GraduationCap, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

type Candidate = {
  id: string
  candidateCode: string
  firstName: string
  lastName: string
  dob?: string
  applicationData?: { previousSchool?: string; classAppliedFor?: string; parentPhone?: string; [key: string]: unknown }
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

const STATUS: Record<Candidate['status'], { label: string; badge: string; seg: string }> = {
  PENDING: { label: 'Pending', badge: 'bg-secondary-fixed text-on-secondary-fixed', seg: 'bg-secondary-container' },
  ADMITTED: { label: 'Admitted', badge: 'bg-primary-fixed text-on-secondary-fixed', seg: 'bg-primary' },
  REJECTED: { label: 'Rejected', badge: 'bg-[#ffdad6] text-[#93000a]', seg: 'bg-[#ba1a1a]' },
}
const initials = (f?: string, l?: string) => `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase() || '?'

export default function CandidatesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detail, setDetail] = useState<Candidate | null>(null)
  const [filter, setFilter] = useState<'all' | Candidate['status']>('all')
  const qc = useQueryClient()

  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['candidates'],
    queryFn: () => api.get('/candidates').then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? [])),
  })
  const form = useForm<CreateForm>({ resolver: zodResolver(createSchema) })

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/candidates', {
      firstName: data.firstName, lastName: data.lastName, dob: data.dob || undefined,
      applicationData: { previousSchool: data.previousSchool || undefined, classAppliedFor: data.classAppliedFor || undefined, parentPhone: data.parentPhone || undefined },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Application registered'); setCreateOpen(false); form.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const admitMutation = useMutation({
    mutationFn: (id: string) => api.post(`/candidates/${id}/admit`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Admitted — student record created'); setDetail(null) },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Admission failed'),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.put(`/candidates/${id}`, { status: 'REJECTED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates'] }); toast.success('Application rejected'); setDetail(null) },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const pending = candidates.filter(c => c.status === 'PENDING').length
  const admitted = candidates.filter(c => c.status === 'ADMITTED').length
  const rejected = candidates.filter(c => c.status === 'REJECTED').length
  const decided = admitted + rejected
  const acceptRate = decided > 0 ? Math.round((admitted / decided) * 100) : null
  const total = candidates.length
  const rows = filter === 'all' ? candidates : candidates.filter(c => c.status === filter)

  const tiles = [
    { label: 'Total Applicants', value: total, hint: 'All applications', icon: Users, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Pending Review', value: pending, hint: 'Awaiting decision', icon: Clock, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Admitted', value: admitted, hint: 'Enrolled as students', icon: GraduationCap, tone: 'bg-primary-fixed/50 text-primary' },
    { label: 'Acceptance Rate', value: acceptRate != null ? `${acceptRate}%` : '—', hint: 'Of decided applications', icon: Percent, tone: 'bg-surface-container-high text-primary-container' },
  ]
  const filters: { key: 'all' | Candidate['status']; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: total },
    { key: 'PENDING', label: 'Pending', count: pending },
    { key: 'ADMITTED', label: 'Admitted', count: admitted },
    { key: 'REJECTED', label: 'Rejected', count: rejected },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Admissions</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Admissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Register applicants and admit them into the school.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvUploadDialog
            title="Upload Candidates CSV" uploadUrl="/candidates/upload-csv" templateUrl="/candidates/csv-template"
            templateFileName="candidates-template.csv" invalidateKeys={[['candidates']]}
            trigger={<button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"><Upload className="h-4 w-4" strokeWidth={1.5} /> CSV Upload</button>}
          />
          <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) form.reset() }}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95">
                <Plus className="h-4 w-4" strokeWidth={2} /> New Application
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Application</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>First Name</Label><Input {...form.register('firstName')} />{form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}</div>
                  <div className="space-y-1.5"><Label>Last Name</Label><Input {...form.register('lastName')} />{form.formState.errors.lastName && <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>}</div>
                </div>
                <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" {...form.register('dob')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Class Applied For</Label><Input placeholder="e.g. JSS 1" {...form.register('classAppliedFor')} /></div>
                  <div className="space-y-1.5"><Label>Previous School</Label><Input {...form.register('previousSchool')} /></div>
                </div>
                <div className="space-y-1.5"><Label>Parent Phone</Label><Input placeholder="+234…" {...form.register('parentPhone')} /></div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? 'Registering…' : 'Register Application'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-mono text-3xl font-black text-primary-container">{t.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
          </div>
        ))}
      </section>

      {/* Pipeline bar */}
      {total > 0 && (
        <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-lg font-extrabold text-on-surface">Application Pipeline</h2>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-secondary"><span className="h-2 w-2 rounded-full bg-secondary-container" /> Pending {pending}</span>
              <span className="flex items-center gap-1.5 text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> Admitted {admitted}</span>
              <span className="flex items-center gap-1.5 text-[#93000a]"><span className="h-2 w-2 rounded-full bg-[#ba1a1a]" /> Rejected {rejected}</span>
            </div>
          </div>
          <div className="flex h-4 overflow-hidden rounded-full bg-surface-container-low">
            {(['PENDING', 'ADMITTED', 'REJECTED'] as const).map(s => {
              const n = s === 'PENDING' ? pending : s === 'ADMITTED' ? admitted : rejected
              const pct = total > 0 ? (n / total) * 100 : 0
              return pct > 0 ? <div key={s} className={STATUS[s].seg} style={{ width: `${pct}%` }} title={`${STATUS[s].label}: ${n}`} /> : null
            })}
          </div>
        </section>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === f.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f.label} <span className="font-mono opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Applicant table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Applicant</th>
                <th className="px-6 py-5">Class Applied</th>
                <th className="px-6 py-5">Previous School</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Applied</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center">
                  <p className="text-sm font-semibold text-on-surface">No applications</p>
                  <p className="mt-1 text-xs text-muted-foreground">{filter === 'all' ? 'Register your first applicant to get started.' : `No ${filter.toLowerCase()} applications.`}</p>
                </td></tr>
              ) : (
                rows.map(c => (
                  <tr key={c.id} className="group transition-colors hover:bg-surface-container-low/40">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-xs font-black text-primary-container">{initials(c.firstName, c.lastName)}</div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{c.firstName} {c.lastName}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{c.candidateCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {c.applicationData?.classAppliedFor ? <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">{c.applicationData.classAppliedFor}</span> : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{c.applicationData?.previousSchool || '—'}</td>
                    <td className="px-6 py-5"><span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${STATUS[c.status].badge}`}>{STATUS[c.status].label}</span></td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{formatDate(c.createdAt)}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setDetail(c)} aria-label="View" title="View" className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"><Eye className="h-4 w-4" strokeWidth={1.5} /></button>
                        {c.status === 'PENDING' && (
                          <>
                            <button onClick={() => admitMutation.mutate(c.id)} aria-label="Admit" title="Admit" className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"><UserCheck className="h-4 w-4" strokeWidth={1.5} /></button>
                            <button onClick={() => rejectMutation.mutate(c.id)} aria-label="Reject" title="Reject" className="rounded-lg p-2 text-outline transition-all hover:bg-destructive/5 hover:text-destructive"><UserX className="h-4 w-4" strokeWidth={1.5} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={v => { if (!v) setDetail(null) }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Applicant Details</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-lg font-extrabold text-on-surface">{detail.firstName} {detail.lastName}</h3>
                  <p className="font-mono text-sm text-muted-foreground">{detail.candidateCode}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${STATUS[detail.status].badge}`}>{STATUS[detail.status].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low p-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Birth</p><p className="text-sm font-medium text-on-surface">{detail.dob ? formatDate(detail.dob) : '—'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Applied</p><p className="text-sm font-medium text-on-surface">{formatDate(detail.createdAt)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Class Applied For</p><p className="text-sm font-medium text-on-surface">{detail.applicationData?.classAppliedFor || '—'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous School</p><p className="text-sm font-medium text-on-surface">{detail.applicationData?.previousSchool || '—'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Parent Phone</p><p className="text-sm font-medium text-on-surface">{detail.applicationData?.parentPhone || '—'}</p></div>
                {detail.admittedAt && <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admitted On</p><p className="text-sm font-medium text-on-surface">{formatDate(detail.admittedAt)}</p></div>}
              </div>
              {detail.status === 'PENDING' ? (
                <div className="flex gap-3">
                  <button onClick={() => admitMutation.mutate(detail.id)} disabled={admitMutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50">
                    <UserCheck className="h-4 w-4" strokeWidth={1.5} /> {admitMutation.isPending ? 'Admitting…' : 'Admit'}
                  </button>
                  <button onClick={() => rejectMutation.mutate(detail.id)} disabled={rejectMutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ffdad6] bg-[#ffdad6]/40 px-4 py-3 text-sm font-bold text-[#93000a] transition-colors hover:bg-[#ffdad6]/60 disabled:opacity-50">
                    <UserX className="h-4 w-4" strokeWidth={1.5} /> {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              ) : detail.status === 'ADMITTED' ? (
                <div className="rounded-2xl bg-primary-fixed/30 p-4 text-sm font-medium text-primary-container">This applicant has been admitted and a student record was created.</div>
              ) : (
                <div className="rounded-2xl bg-[#ffdad6]/40 p-4 text-sm font-medium text-[#93000a]">This application was rejected.</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
