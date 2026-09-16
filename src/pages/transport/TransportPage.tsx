import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Bus, MapPin, Route as RouteIcon, Gauge, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SearchSelect } from '@/components/ui/search-select'
import api from '@/lib/api'

const busSchema = z.object({ busNumber: z.string().min(1), capacity: z.coerce.number().min(1), driverName: z.string().min(1), driverPhone: z.string().optional() })
const routeSchema = z.object({ busId: z.string().min(1), routeName: z.string().min(1) })
type BusForm = z.infer<typeof busSchema>
type RouteForm = z.infer<typeof routeSchema>

function initials(name?: string) { return (name ?? '').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?' }

export default function TransportPage() {
  const [busOpen, setBusOpen] = useState(false)
  const [routeOpen, setRouteOpen] = useState(false)
  const [tab, setTab] = useState<'routes' | 'fleet'>('routes')
  const qc = useQueryClient()

  const { data: buses = [] } = useQuery<any[]>({ queryKey: ['buses'], queryFn: () => api.get('/transport/buses').then(r => r.data) })
  const { data: routes = [], isLoading } = useQuery<any[]>({ queryKey: ['routes'], queryFn: () => api.get('/transport/routes').then(r => r.data) })

  const busForm = useForm<BusForm>({ resolver: zodResolver(busSchema) as any })
  const routeForm = useForm<RouteForm>({ resolver: zodResolver(routeSchema) })

  const busMutation = useMutation({
    mutationFn: (data: BusForm) => api.post('/transport/buses', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buses'] }); toast.success('Bus added'); setBusOpen(false); busForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const routeMutation = useMutation({
    mutationFn: (data: RouteForm) => api.post('/transport/routes', { ...data, stops: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['routes'] }); toast.success('Route created'); setRouteOpen(false); routeForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const totalCapacity = buses.reduce((s, b) => s + (b.capacity ?? 0), 0)
  const tiles = [
    { label: 'Fleet Size', value: buses.length, icon: Bus, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Active Routes', value: routes.length, icon: RouteIcon, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Total Capacity', value: totalCapacity, icon: Gauge, tone: 'bg-primary-fixed/40 text-primary' },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Transport operations</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Route &amp; Fleet Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the fleet and the routes it runs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"><MapPin className="h-4 w-4" strokeWidth={1.5} /> Add Route</button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Route</DialogTitle></DialogHeader>
              <form onSubmit={routeForm.handleSubmit(d => routeMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5"><Label>Route Name</Label><Input {...routeForm.register('routeName')} placeholder="North Route" /></div>
                <div className="space-y-1.5"><Label>Bus</Label>
                  <SearchSelect value={routeForm.watch('busId')} onChange={v => routeForm.setValue('busId', v, { shouldValidate: true })}
                    options={buses.map(b => ({ id: b.id, label: b.busNumber, sub: b.driverName }))} placeholder="Select bus" searchPlaceholder="Search buses…" emptyText="No buses" />
                </div>
                <Button type="submit" className="w-full" disabled={routeMutation.isPending}>Create Route</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={busOpen} onOpenChange={setBusOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> Add Bus</button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Bus</DialogTitle></DialogHeader>
              <form onSubmit={busForm.handleSubmit(d => busMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Bus Number</Label><Input {...busForm.register('busNumber')} placeholder="LAG-184-XC" /></div>
                  <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" {...busForm.register('capacity')} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Driver Name</Label><Input {...busForm.register('driverName')} /></div>
                  <div className="space-y-1.5"><Label>Driver Phone</Label><Input {...busForm.register('driverPhone')} /></div>
                </div>
                <Button type="submit" className="w-full" disabled={busMutation.isPending}>Add Bus</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className="font-mono text-2xl font-black text-on-surface">{t.value}</p></div>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['routes', 'Routes', RouteIcon], ['fleet', 'Fleet', Bus]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab === key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>
            <Icon className="h-4 w-4" strokeWidth={1.5} /> {label}
          </button>
        ))}
      </div>

      {tab === 'routes' ? (
        <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-8 py-5">Route</th><th className="px-6 py-5">Bus &amp; Driver</th><th className="px-6 py-5 text-center">Stops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <tr key={i}><td colSpan={3} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
                ) : routes.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No routes</p><p className="mt-1 text-xs text-muted-foreground">Create a route to get started.</p></td></tr>
                ) : routes.map(r => (
                  <tr key={r.id} className="transition-colors hover:bg-surface-container-low/40">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><RouteIcon className="h-4 w-4" strokeWidth={1.5} /></div>
                        <p className="font-bold text-on-surface">{r.routeName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">
                      {r.bus ? <><span className="font-mono font-bold">{r.bus.busNumber}</span><span className="text-muted-foreground"> · {r.bus.driverName}</span></> : <span className="text-muted-foreground">Unassigned</span>}
                    </td>
                    <td className="px-6 py-5 text-center font-mono text-sm text-muted-foreground">{(r.stops as any[])?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buses.length === 0 ? (
            <div className="col-span-full rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft"><p className="text-sm font-semibold text-on-surface">No buses</p><p className="mt-1 text-xs text-muted-foreground">Add a bus to the fleet.</p></div>
          ) : buses.map(b => (
            <div key={b.id} className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white"><Bus className="h-5 w-5" strokeWidth={1.5} /></div>
                <span className="rounded-full bg-primary-fixed/50 px-3 py-1 text-[11px] font-bold text-primary-container">Cap. {b.capacity}</span>
              </div>
              <p className="font-mono text-lg font-black text-on-surface">{b.busNumber}</p>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-primary-container">{initials(b.driverName)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">{b.driverName}</p>
                  {b.driverPhone && <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Phone className="h-3 w-3" strokeWidth={1.5} /> {b.driverPhone}</p>}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
