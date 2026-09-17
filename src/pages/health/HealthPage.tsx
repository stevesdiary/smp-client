import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, HeartPulse, Droplet, TriangleAlert, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SearchSelect } from '@/components/ui/search-select'
import api from '@/lib/api'
import { getApiErrorMessage, getInitials } from '@/lib/utils'
import { fetchHealthRecordsByStudent, type HealthRecordWithStudent } from '@/lib/moduleQueries'
import type { Student } from '@/types'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function HealthPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['health-records'],
    queryFn: fetchHealthRecordsByStudent,
  })
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data),
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/health/records', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health-records'] }); toast.success('Health record created'); setOpen(false); reset() },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })

  const hasValue = (v?: string | null) => Boolean(v) && v!.trim().toLowerCase() !== 'none'
  const withConditions = useMemo(() => records.filter((r: any) => hasValue(r.conditions)).length, [records])
  const withAllergies = useMemo(() => records.filter((r: any) => hasValue(r.allergies)).length, [records])
  const incidents = useMemo(() => records.reduce((s: number, r: any) => s + (r.incidents?.length ?? 0), 0), [records])

  const tiles = [
    { label: 'Records', value: records.length, icon: HeartPulse, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'With Conditions', value: withConditions, icon: Stethoscope, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'With Allergies', value: withAllergies, icon: TriangleAlert, tone: 'bg-error-container text-error-on' },
    { label: 'Incidents Logged', value: incidents, icon: Droplet, tone: 'bg-primary-container/10 text-primary' },
  ]

  const nameFor = (r: HealthRecordWithStudent) => {
    const s = r.student ?? students.find(c => c.id === r.studentId)
    return s ? { name: `${s.firstName} ${s.lastName}`, first: s.firstName, last: s.lastName } : { name: r.studentId, first: '?', last: '' }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Student wellbeing</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Health &amp; Medical Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">Blood groups, allergies and conditions for every boarder and day student.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> New Record</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Health Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <SearchSelect value={watch('studentId')} onChange={v => setValue('studentId', v, { shouldValidate: true })}
                  options={students.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentId || s.studentCode }))}
                  placeholder="Select student" searchPlaceholder="Search students…" emptyText="No students" />
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Blood Group</Label><Input {...register('bloodGroup')} placeholder="A+" /></div>
                <div className="space-y-1.5"><Label>Allergies</Label><Input {...register('allergies')} placeholder="Peanuts, Dust…" /></div>
              </div>
              <div className="space-y-1.5"><Label>Medical Conditions</Label><Input {...register('conditions')} placeholder="Asthma, Diabetes…" /></div>
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
                <th className="px-8 py-5">Student</th><th className="px-6 py-5 text-center">Blood</th><th className="px-6 py-5">Allergies</th><th className="px-6 py-5">Conditions</th><th className="px-6 py-5 text-center">Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No health records</p><p className="mt-1 text-xs text-muted-foreground">Add a record to begin tracking student wellbeing.</p></td></tr>
              ) : records.map((r) => {
                const who = nameFor(r)
                const incidentCount = r.incidents?.length ?? 0
                return (
                  <tr key={r.id} className="transition-colors hover:bg-surface-container-low/40">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed/50 text-[11px] font-bold text-primary">{getInitials(who.first, who.last)}</span>
                        <p className="font-bold text-on-surface">{who.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {r.bloodGroup ? <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-3 py-1 font-mono text-[11px] font-bold text-error-on"><Droplet className="h-3 w-3" strokeWidth={2} /> {r.bloodGroup}</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-5 text-sm">{hasValue(r.allergies) ? <span className="rounded-full bg-error-container px-3 py-1 text-[11px] font-bold text-error-on">{r.allergies}</span> : <span className="text-muted-foreground">None</span>}</td>
                    <td className="px-6 py-5 text-sm">{hasValue(r.conditions) ? <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[11px] font-bold text-on-secondary-fixed">{r.conditions}</span> : <span className="text-muted-foreground">None</span>}</td>
                    <td className="px-6 py-5 text-center"><span className={`font-mono text-sm font-bold ${incidentCount > 0 ? 'text-error-on' : 'text-muted-foreground'}`}>{incidentCount}</span></td>
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
