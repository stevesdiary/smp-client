import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, MapPin, Plus, CalendarClock, CalendarCheck, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import api from '@/lib/api'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

// Type accent tones drawn from the SchoolOS palette.
const typeTone: Record<string, { chip: string; rail: string }> = {
  sports: { chip: 'bg-primary-fixed/60 text-primary', rail: 'bg-primary' },
  cultural: { chip: 'bg-secondary-fixed text-on-secondary-fixed', rail: 'bg-secondary' },
  academic: { chip: 'bg-info-container text-on-info-container', rail: 'bg-info-accent' },
  meeting: { chip: 'bg-tertiary-container text-tertiary-on', rail: 'bg-tertiary' },
}
const toneFor = (type?: string) => typeTone[(type ?? '').toLowerCase()] ?? { chip: 'bg-surface-container-high text-on-surface-variant', rail: 'bg-outline' }

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function DateTile({ date, past }: { date: Date; past: boolean }) {
  return (
    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${past ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-white'}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{MONTHS[date.getMonth()]}</span>
      <span className="font-mono text-lg font-black leading-none">{date.getDate()}</span>
    </div>
  )
}

function EventCard({ event }: { event: any }) {
  const start = new Date(event.startDate)
  const past = start < new Date()
  const tone = toneFor(event.type)
  return (
    <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-5 shadow-soft">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${tone.rail}`} />
      <div className="flex items-start gap-4 pl-2">
        <DateTile date={start} past={past} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-headline font-bold text-on-surface">{event.title}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${tone.chip}`}>{event.type}</span>
            {past && <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">Past</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />{start.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            {event.venue && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />{event.venue}</span>}
          </div>
          {event.description && <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{event.description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: events = [], isLoading } = useQuery<any[]>({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/events', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Event created'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const now = new Date()
  const { upcoming, past, thisMonth, typeCount } = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const upcoming = sorted.filter(e => new Date(e.startDate) >= now)
    const past = sorted.filter(e => new Date(e.startDate) < now).reverse()
    const thisMonth = events.filter(e => { const d = new Date(e.startDate); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length
    const typeCount = new Set(events.map(e => (e.type ?? '').toLowerCase()).filter(Boolean)).size
    return { upcoming, past, thisMonth, typeCount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  const tiles = [
    { label: 'Total Events', value: events.length, icon: Calendar, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Upcoming', value: upcoming.length, icon: CalendarClock, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'This Month', value: thisMonth, icon: CalendarCheck, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Categories', value: typeCount, icon: Tag, tone: 'bg-primary-fixed/40 text-primary' },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">School calendar</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Events &amp; Activities</h1>
          <p className="mt-1 text-sm text-muted-foreground">Assemblies, fixtures and gatherings across the term.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> New Event</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5"><Label>Title</Label><Input {...register('title')} placeholder="Inter-house Sports" />{errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}</div>
              <div className="space-y-1.5"><Label>Type</Label><Input {...register('type')} placeholder="Sports, Cultural, Academic…" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Start</Label><Input type="datetime-local" {...register('startDate')} /></div>
                <div className="space-y-1.5"><Label>End</Label><Input type="datetime-local" {...register('endDate')} /></div>
              </div>
              <div className="space-y-1.5"><Label>Venue</Label><Input {...register('venue')} placeholder="School Hall" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Input {...register('description')} /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create Event'}</Button>
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

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-surface-container-low" />)}</div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-14 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed/50 text-primary"><Calendar className="h-6 w-6" strokeWidth={1.5} /></div>
          <p className="font-semibold text-on-surface">No events yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first event to populate the calendar.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline text-lg font-bold text-on-surface">Upcoming</h2>
              <div className="space-y-3">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-headline text-lg font-bold text-on-surface">Past</h2>
              <div className="space-y-3">{past.map(e => <EventCard key={e.id} event={e} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
