import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ShieldAlert, CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SearchSelect } from '@/components/ui/search-select'
import { formatDate, getInitials } from '@/lib/utils'
import api from '@/lib/api'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  incidentDate: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  severity: z.string().min(1, 'Required'),
  actionTaken: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const SEVERITIES = ['Minor', 'Major', 'Severe'] as const
const severityChip: Record<string, string> = {
  Minor: 'bg-[#ffddb4] text-[#7a4b00]',
  Major: 'bg-[#ffdad6] text-[#93000a]',
  Severe: 'bg-[#ba1a1a] text-white',
}

export default function DisciplinaryPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ['disciplinary'],
    queryFn: () => api.get('/disciplinary/records').then(r => r.data),
  })
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/disciplinary/records', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disciplinary'] }); toast.success('Record created'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const { open: openCount, resolved, severe } = useMemo(() => {
    const open = records.filter(r => r.status !== 'Resolved').length
    const resolved = records.filter(r => r.status === 'Resolved').length
    const severe = records.filter(r => r.severity === 'Severe').length
    return { open, resolved, severe }
  }, [records])

  const tiles = [
    { label: 'Records', value: records.length, icon: ShieldAlert, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Open', value: openCount, icon: CircleAlert, tone: 'bg-[#ffddb4] text-[#7a4b00]' },
    { label: 'Resolved', value: resolved, icon: CircleCheck, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Severe', value: severe, icon: TriangleAlert, tone: 'bg-[#ffdad6] text-[#93000a]' },
  ]

  const selectedSeverity = watch('severity')
  const nameFor = (studentId: string) => {
    const s = students.find(c => c.id === studentId)
    return s ? { name: `${s.firstName} ${s.lastName}`, first: s.firstName, last: s.lastName } : { name: '—', first: '?', last: '' }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Behaviour desk</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Disciplinary Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log incidents, track severity and record resolutions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> New Record</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Disciplinary Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <SearchSelect value={watch('studentId')} onChange={v => setValue('studentId', v, { shouldValidate: true })}
                  options={students.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentId || s.studentCode }))}
                  placeholder="Select student" searchPlaceholder="Search students…" emptyText="No students" />
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Incident Date</Label>
                <Input type="date" {...register('incidentDate')} />
                {errors.incidentDate && <p className="text-xs text-destructive">{errors.incidentDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} type="button" onClick={() => setValue('severity', s, { shouldValidate: true })}
                      className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${selectedSeverity === s ? severityChip[s] : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>{s}</button>
                  ))}
                </div>
                {errors.severity && <p className="text-xs text-destructive">{errors.severity.message}</p>}
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Input {...register('description')} />{errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}</div>
              <div className="space-y-1.5"><Label>Action Taken</Label><Input {...register('actionTaken')} placeholder="Suspension, Warning…" /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save Record'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className="font-mono text-2xl font-black text-on-surface">{t.value}</p></div>
          </div>
        ))}
      </section>

      {/* Records table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Student</th><th className="px-6 py-5">Date</th><th className="px-6 py-5">Incident</th><th className="px-6 py-5 text-center">Severity</th><th className="px-6 py-5 text-center">Status</th><th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No records</p><p className="mt-1 text-xs text-muted-foreground">A clean behaviour log — nothing to report.</p></td></tr>
              ) : records.map((r) => {
                const who = nameFor(r.studentId)
                const isResolved = r.status === 'Resolved'
                return (
                  <tr key={r.id} className="transition-colors hover:bg-surface-container-low/40">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed/50 text-[11px] font-bold text-primary">{getInitials(who.first, who.last)}</span>
                        <p className="font-bold text-on-surface">{who.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{r.incidentDate ? formatDate(r.incidentDate) : '—'}</td>
                    <td className="px-6 py-5 text-sm text-on-surface"><span className="line-clamp-1 max-w-xs">{r.description}</span></td>
                    <td className="px-6 py-5 text-center"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${severityChip[r.severity] ?? 'bg-surface-container-high text-on-surface-variant'}`}>{r.severity}</span></td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${isResolved ? 'bg-primary-fixed/60 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {isResolved ? <CircleCheck className="h-3 w-3" strokeWidth={2} /> : <CircleAlert className="h-3 w-3" strokeWidth={2} />} {r.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">{r.actionTaken || <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
