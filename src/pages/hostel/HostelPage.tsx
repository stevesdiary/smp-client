import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2, BedDouble, Users, DoorOpen, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SearchSelect } from '@/components/ui/search-select'
import { PageHeader } from '@/components/shared/PageHeader'
import api from '@/lib/api'

const roomSchema = z.object({ roomNumber: z.string().min(1), building: z.string().min(1), floor: z.coerce.number(), capacity: z.coerce.number().min(1), type: z.string().min(1) })
const assignSchema = z.object({ roomId: z.string().min(1), studentId: z.string().min(1), startDate: z.string().min(1) })
type RoomForm = z.infer<typeof roomSchema>
type AssignForm = z.infer<typeof assignSchema>

function occTone(pct: number) {
  if (pct >= 100) return { bar: 'bg-error', chip: 'bg-error-container text-error-on', label: 'Full' }
  if (pct >= 80) return { bar: 'bg-secondary', chip: 'bg-secondary-fixed text-on-secondary-fixed', label: 'Filling' }
  return { bar: 'bg-primary', chip: 'bg-primary-fixed/60 text-primary', label: 'Available' }
}

export default function HostelPage() {
  const [roomOpen, setRoomOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const qc = useQueryClient()

  const { data: rooms = [], isLoading } = useQuery<any[]>({ queryKey: ['hostel-rooms'], queryFn: () => api.get('/hostel/rooms').then(r => r.data) })
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const roomForm = useForm<RoomForm>({ resolver: zodResolver(roomSchema) as any })
  const assignForm = useForm<AssignForm>({ resolver: zodResolver(assignSchema) })

  const roomMutation = useMutation({
    mutationFn: (data: RoomForm) => api.post('/hostel/rooms', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hostel-rooms'] }); toast.success('Room created'); setRoomOpen(false); roomForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const assignMutation = useMutation({
    mutationFn: (data: AssignForm) => api.post('/hostel/assignments', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hostel-rooms'] }); toast.success('Student assigned'); setAssignOpen(false); assignForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const { totalBeds, occupiedBeds, availableRooms } = useMemo(() => {
    const totalBeds = rooms.reduce((s, r) => s + (r.capacity ?? 0), 0)
    const occupiedBeds = rooms.reduce((s, r) => s + (r.occupied ?? 0), 0)
    const availableRooms = rooms.filter(r => (r.occupied ?? 0) < (r.capacity ?? 0)).length
    return { totalBeds, occupiedBeds, availableRooms }
  }, [rooms])

  // Group rooms by building for the "Hostel Blocks" view
  const blocks = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const r of rooms) {
      const key = r.building || 'Unassigned'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return Array.from(map.entries()).map(([building, list]) => {
      const cap = list.reduce((s, r) => s + (r.capacity ?? 0), 0)
      const occ = list.reduce((s, r) => s + (r.occupied ?? 0), 0)
      return { building, list, cap, occ, pct: cap ? Math.round((occ / cap) * 100) : 0 }
    })
  }, [rooms])

  const tiles = [
    { label: 'Rooms', value: rooms.length, icon: DoorOpen, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Occupied Beds', value: `${occupiedBeds}/${totalBeds}`, icon: BedDouble, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Available Rooms', value: availableRooms, icon: Building2, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Boarders', value: occupiedBeds, icon: Users, tone: 'bg-primary-fixed/40 text-primary' },
  ]

  const vacantRooms = rooms.filter(r => (r.occupied ?? 0) < (r.capacity ?? 0))

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Accommodation"
          title="Hostel & Boarding"
          description="Rooms, blocks and student assignments."
          className="flex-1 px-0 py-0 pb-0 border-none"
        />
        <div className="flex items-center gap-3">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"><UserPlus className="h-4 w-4" strokeWidth={1.5} /> Assign Student</button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Assign Student to Room</DialogTitle></DialogHeader>
              <form onSubmit={assignForm.handleSubmit(d => assignMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5"><Label>Room</Label>
                  <SearchSelect value={assignForm.watch('roomId')} onChange={v => assignForm.setValue('roomId', v, { shouldValidate: true })}
                    options={vacantRooms.map(r => ({ id: r.id, label: `${r.roomNumber} · ${r.building}`, sub: `${r.occupied ?? 0}/${r.capacity} beds` }))}
                    placeholder="Select room" searchPlaceholder="Search rooms…" emptyText="No rooms with free beds" />
                </div>
                <div className="space-y-1.5"><Label>Student</Label>
                  <SearchSelect value={assignForm.watch('studentId')} onChange={v => assignForm.setValue('studentId', v, { shouldValidate: true })}
                    options={students.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentId || s.studentCode }))}
                    placeholder="Select student" searchPlaceholder="Search students…" emptyText="No students" />
                </div>
                <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" {...assignForm.register('startDate')} /></div>
                <Button type="submit" className="w-full" disabled={assignMutation.isPending}>Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> Add Room</button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Room</DialogTitle></DialogHeader>
              <form onSubmit={roomForm.handleSubmit(d => roomMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Room Number</Label><Input {...roomForm.register('roomNumber')} placeholder="A101" /></div>
                  <div className="space-y-1.5"><Label>Building</Label><Input {...roomForm.register('building')} placeholder="Block A" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label>Floor</Label><Input type="number" {...roomForm.register('floor')} defaultValue={1} /></div>
                  <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" {...roomForm.register('capacity')} defaultValue={2} /></div>
                  <div className="space-y-1.5"><Label>Type</Label><Input {...roomForm.register('type')} placeholder="Double" /></div>
                </div>
                <Button type="submit" className="w-full" disabled={roomMutation.isPending}>Create Room</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className="font-mono text-2xl font-black text-on-surface">{t.value}</p></div>
          </div>
        ))}
      </section>

      {/* Hostel blocks */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Hostel Blocks</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-surface-container-low" />)}
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft"><p className="text-sm font-semibold text-on-surface">No rooms yet</p><p className="mt-1 text-xs text-muted-foreground">Add a room to open a block.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blocks.map(b => {
              const tone = occTone(b.pct)
              return (
                <div key={b.building} className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white"><Building2 className="h-5 w-5" strokeWidth={1.5} /></div>
                      <div>
                        <p className="font-bold text-on-surface">{b.building}</p>
                        <p className="text-xs text-muted-foreground">{b.list.length} rooms</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${tone.chip}`}>{tone.label}</span>
                  </div>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground">Occupancy</span>
                    <span className="font-mono font-bold text-on-surface">{b.occ}/{b.cap}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className={`h-full rounded-full ${tone.bar} transition-all`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Rooms table */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">All Rooms</h2>
        <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-8 py-5">Room</th><th className="px-6 py-5">Building</th><th className="px-6 py-5 text-center">Floor</th><th className="px-6 py-5">Type</th><th className="px-6 py-5">Occupancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
                ) : rooms.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No rooms</p><p className="mt-1 text-xs text-muted-foreground">Create a room to get started.</p></td></tr>
                ) : rooms.map(r => {
                  const cap = r.capacity ?? 0
                  const occ = r.occupied ?? 0
                  const pct = cap ? Math.round((occ / cap) * 100) : 0
                  const tone = occTone(pct)
                  return (
                    <tr key={r.id} className="transition-colors hover:bg-surface-container-low/40">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><DoorOpen className="h-4 w-4" strokeWidth={1.5} /></div>
                          <p className="font-mono font-bold text-on-surface">{r.roomNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface">{r.building}</td>
                      <td className="px-6 py-5 text-center font-mono text-sm text-muted-foreground">{r.floor}</td>
                      <td className="px-6 py-5 text-sm text-on-surface">{r.type}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="font-mono text-sm font-bold text-on-surface">{occ}/{cap}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone.chip}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
