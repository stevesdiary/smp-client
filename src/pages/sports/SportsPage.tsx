import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trophy, Users, Dumbbell, UserPlus, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SearchSelect } from '@/components/ui/search-select'
import { getApiErrorMessage } from '@/lib/utils'
import api from '@/lib/api'

const schema = z.object({ name: z.string().min(1), type: z.string().min(1), description: z.string().optional(), instructor: z.string().optional(), maxCapacity: z.coerce.number().optional() })
type FormData = z.infer<typeof schema>

// Activity type accents from the SchoolOS palette.
const typeTone: Record<string, { chip: string; icon: string }> = {
  sports: { chip: 'bg-primary-fixed/60 text-primary', icon: 'bg-primary text-white' },
  arts: { chip: 'bg-secondary-fixed text-on-secondary-fixed', icon: 'bg-secondary text-white' },
  music: { chip: 'bg-[#d7e3ff] text-[#0b3b8c]', icon: 'bg-[#3b6fd4] text-white' },
  clubs: { chip: 'bg-[#ffddb4] text-[#7a4b00]', icon: 'bg-[#c67c1e] text-white' },
}
const toneFor = (type?: string) => typeTone[(type ?? '').toLowerCase()] ?? { chip: 'bg-surface-container-high text-on-surface-variant', icon: 'bg-surface-container-high text-on-surface-variant' }

export default function SportsPage() {
  const [open, setOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [enrollStudentId, setEnrollStudentId] = useState('')
  const qc = useQueryClient()

  const { data: activities = [], isLoading } = useQuery<any[]>({ queryKey: ['activities'], queryFn: () => api.get('/sports/activities').then(r => r.data) })
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/sports/activities', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity created'); setOpen(false); reset() },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/sports/enrollments', { activityId: selectedActivity, studentId: enrollStudentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Student enrolled'); setEnrollOpen(false); setEnrollStudentId('') },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })

  const totalEnrollments = useMemo(() => activities.reduce((sum, a) => sum + (a._count?.enrollments ?? 0), 0), [activities])
  const typeCount = useMemo(() => new Set(activities.map(a => (a.type ?? '').toLowerCase()).filter(Boolean)).size, [activities])
  const capacity = useMemo(() => activities.reduce((sum, a) => sum + (a.maxCapacity ?? 0), 0), [activities])

  const tiles = [
    { label: 'Activities', value: activities.length, icon: Dumbbell, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Enrollments', value: totalEnrollments, icon: Users, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Categories', value: typeCount, icon: Trophy, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Total Capacity', value: capacity, icon: GraduationCap, tone: 'bg-primary-fixed/40 text-primary' },
  ]

  const activeName = activities.find(a => a.id === selectedActivity)?.name

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Campus life</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Sports &amp; Activities</h1>
          <p className="mt-1 text-sm text-muted-foreground">Teams, clubs and extracurricular participation.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> New Activity</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Activity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Name</Label><Input {...register('name')} placeholder="Football" /></div>
                <div className="space-y-1.5"><Label>Type</Label><Input {...register('type')} placeholder="Sports, Arts, Music…" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Instructor</Label><Input {...register('instructor')} /></div>
                <div className="space-y-1.5"><Label>Max Capacity</Label><Input type="number" {...register('maxCapacity')} /></div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Input {...register('description')} /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Activity'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enroll dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Enroll Student{activeName ? ` · ${activeName}` : ''}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <SearchSelect value={enrollStudentId} onChange={setEnrollStudentId}
                options={students.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentId || s.studentCode }))}
                placeholder="Select student" searchPlaceholder="Search students…" emptyText="No students" />
            </div>
            <Button className="w-full" onClick={() => enrollMutation.mutate()} disabled={!enrollStudentId || enrollMutation.isPending}>Enroll</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className="font-mono text-2xl font-black text-on-surface">{t.value}</p></div>
          </div>
        ))}
      </section>

      {/* Activity cards */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-surface-container-low" />)}</div>
      ) : activities.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-14 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed/50 text-primary"><Dumbbell className="h-6 w-6" strokeWidth={1.5} /></div>
          <p className="font-semibold text-on-surface">No activities yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first activity to open enrollments.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => {
            const tone = toneFor(a.type)
            const enrolled = a._count?.enrollments ?? 0
            const cap = a.maxCapacity ?? 0
            const pct = cap ? Math.min(Math.round((enrolled / cap) * 100), 100) : 0
            const full = cap > 0 && enrolled >= cap
            return (
              <div key={a.id} className="flex flex-col rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone.icon}`}><Trophy className="h-5 w-5" strokeWidth={1.5} /></div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${tone.chip}`}>{a.type}</span>
                </div>
                <h3 className="font-headline text-lg font-bold text-on-surface">{a.name}</h3>
                {a.instructor && <p className="mt-0.5 text-sm text-muted-foreground">Coach · {a.instructor}</p>}
                {a.description && <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{a.description}</p>}

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-on-surface"><Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />{enrolled}{cap ? `/${cap}` : ''} enrolled</span>
                    {cap > 0 && <span className={`font-mono font-bold ${full ? 'text-[#93000a]' : 'text-muted-foreground'}`}>{pct}%</span>}
                  </div>
                  {cap > 0 && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div className={`h-full rounded-full ${full ? 'bg-[#ba1a1a]' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>

                <button onClick={() => { setSelectedActivity(a.id); setEnrollStudentId(''); setEnrollOpen(true) }} disabled={full}
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50">
                  <UserPlus className="h-4 w-4" strokeWidth={1.5} /> {full ? 'Full' : 'Enroll'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
