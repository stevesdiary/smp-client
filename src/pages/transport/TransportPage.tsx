import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Bus, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import api from '@/lib/api'

const busSchema = z.object({ busNumber: z.string().min(1), capacity: z.coerce.number().min(1), driverName: z.string().min(1), driverPhone: z.string().optional() })
const routeSchema = z.object({ busId: z.string().min(1), routeName: z.string().min(1) })
type BusForm = z.infer<typeof busSchema>
type RouteForm = z.infer<typeof routeSchema>

export default function TransportPage() {
  const [busOpen, setBusOpen] = useState(false)
  const [routeOpen, setRouteOpen] = useState(false)
  const qc = useQueryClient()

  const { data: buses = [], isLoading } = useQuery({ queryKey: ['buses'], queryFn: () => api.get('/transport/buses').then(r => r.data) })
  const { data: routes = [] } = useQuery({ queryKey: ['routes'], queryFn: () => api.get('/transport/routes').then(r => r.data) })

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

  const busColumns: ColumnDef<any>[] = [
    { accessorKey: 'busNumber', header: 'Bus Number' },
    { accessorKey: 'capacity', header: 'Capacity' },
    { accessorKey: 'driverName', header: 'Driver' },
    { accessorKey: 'driverPhone', header: 'Phone', cell: ({ getValue }) => (getValue() as string) || '—' },
  ]

  const routeColumns: ColumnDef<any>[] = [
    { accessorKey: 'routeName', header: 'Route Name' },
    { id: 'bus', header: 'Bus', cell: ({ row }) => row.original.bus?.busNumber ?? '—' },
    { id: 'stops', header: 'Stops', cell: ({ row }) => (row.original.stops as any[])?.length ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Transport operations
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">Manage buses and routes from a stronger operations view.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">
                Fleet and route workflows remain connected to the current transport endpoints while adopting the richer interface language.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Buses</p>
              <p className="mt-2 text-3xl font-semibold">{buses.length}</p>
              <p className="mt-2 text-sm text-white/70">Fleet records currently in the system.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Routes</p>
              <p className="mt-2 text-3xl font-semibold">{routes.length}</p>
              <p className="mt-2 text-sm text-white/70">Transport routes mapped to buses.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Status</p>
              <p className="mt-2 text-3xl font-semibold">Live</p>
              <p className="mt-2 text-sm text-white/70">Additions continue to use the current transport API.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Transport</h1><p className="text-muted-foreground">{buses.length} buses · {routes.length} routes</p></div>
        <div className="flex gap-2">
          <Dialog open={routeOpen} onOpenChange={setRouteOpen}>
            <DialogTrigger asChild><Button variant="outline" className="h-12 rounded-2xl"><MapPin className="h-4 w-4 mr-2" />Add Route</Button></DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>Create Route</DialogTitle></DialogHeader>
              <form onSubmit={routeForm.handleSubmit(d => routeMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1"><Label>Route Name</Label><Input className="h-11 rounded-2xl" {...routeForm.register('routeName')} placeholder="North Route" /></div>
                <div className="space-y-1">
                  <Label>Bus</Label>
                  <Select onValueChange={v => routeForm.setValue('busId', v)}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select bus" /></SelectTrigger>
                    <SelectContent>{buses.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.busNumber} — {b.driverName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={routeMutation.isPending}>Create Route</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={busOpen} onOpenChange={setBusOpen}>
            <DialogTrigger asChild><Button className="h-12 rounded-2xl"><Plus className="h-4 w-4 mr-2" />Add Bus</Button></DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>Add Bus</DialogTitle></DialogHeader>
              <form onSubmit={busForm.handleSubmit(d => busMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Bus Number</Label><Input className="h-11 rounded-2xl" {...busForm.register('busNumber')} placeholder="BUS-001" /></div>
                  <div className="space-y-1"><Label>Capacity</Label><Input className="h-11 rounded-2xl" type="number" {...busForm.register('capacity')} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Driver Name</Label><Input className="h-11 rounded-2xl" {...busForm.register('driverName')} /></div>
                  <div className="space-y-1"><Label>Driver Phone</Label><Input className="h-11 rounded-2xl" {...busForm.register('driverPhone')} /></div>
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={busMutation.isPending}>Add Bus</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="buses" className="space-y-4">
        <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70"><TabsTrigger className="rounded-2xl px-5 py-2.5" value="buses"><Bus className="h-4 w-4 mr-2" />Buses</TabsTrigger><TabsTrigger className="rounded-2xl px-5 py-2.5" value="routes"><MapPin className="h-4 w-4 mr-2" />Routes</TabsTrigger></TabsList>
        <TabsContent value="buses"><DataTable data={buses} columns={busColumns} searchKey="busNumber" isLoading={isLoading} /></TabsContent>
        <TabsContent value="routes"><DataTable data={routes} columns={routeColumns} searchKey="routeName" /></TabsContent>
      </Tabs>
    </div>
  )
}
