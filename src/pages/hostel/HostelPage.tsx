import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import api from '@/lib/api'

const roomSchema = z.object({ roomNumber: z.string().min(1), building: z.string().min(1), floor: z.coerce.number(), capacity: z.coerce.number().min(1), type: z.string().min(1) })
const assignSchema = z.object({ roomId: z.string().min(1), studentId: z.string().min(1), startDate: z.string().min(1) })
type RoomForm = z.infer<typeof roomSchema>
type AssignForm = z.infer<typeof assignSchema>

export default function HostelPage() {
  const [roomOpen, setRoomOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const qc = useQueryClient()

  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['hostel-rooms'], queryFn: () => api.get('/hostel/rooms').then(r => r.data) })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

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

  const roomColumns: ColumnDef<any>[] = [
    { accessorKey: 'roomNumber', header: 'Room' },
    { accessorKey: 'building', header: 'Building' },
    { accessorKey: 'floor', header: 'Floor' },
    { accessorKey: 'type', header: 'Type' },
    { id: 'occupancy', header: 'Occupancy', cell: ({ row }) => {
      const pct = Math.round((row.original.occupied / row.original.capacity) * 100)
      return <span>{row.original.occupied}/{row.original.capacity} <Badge variant={pct >= 100 ? 'destructive' : pct >= 80 ? 'warning' : 'success'} className="ml-1">{pct}%</Badge></span>
    }},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Hostel</h1><p className="text-muted-foreground">{rooms.length} rooms</p></div>
        <div className="flex gap-2">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild><Button variant="outline">Assign Student</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Student to Room</DialogTitle></DialogHeader>
              <form onSubmit={assignForm.handleSubmit(d => assignMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Room</Label>
                  <Select onValueChange={v => assignForm.setValue('roomId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                    <SelectContent>{rooms.filter((r: any) => r.occupied < r.capacity).map((r: any) => <SelectItem key={r.id} value={r.id}>{r.roomNumber} — {r.building}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Student</Label>
                  <Select onValueChange={v => assignForm.setValue('studentId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Start Date</Label><Input type="date" {...assignForm.register('startDate')} /></div>
                <Button type="submit" className="w-full" disabled={assignMutation.isPending}>Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Room</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Room</DialogTitle></DialogHeader>
              <form onSubmit={roomForm.handleSubmit(d => roomMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Room Number</Label><Input {...roomForm.register('roomNumber')} placeholder="A101" /></div>
                  <div className="space-y-1"><Label>Building</Label><Input {...roomForm.register('building')} placeholder="Block A" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1"><Label>Floor</Label><Input type="number" {...roomForm.register('floor')} defaultValue={1} /></div>
                  <div className="space-y-1"><Label>Capacity</Label><Input type="number" {...roomForm.register('capacity')} defaultValue={2} /></div>
                  <div className="space-y-1"><Label>Type</Label><Input {...roomForm.register('type')} placeholder="Double" /></div>
                </div>
                <Button type="submit" className="w-full" disabled={roomMutation.isPending}>Create Room</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Tabs defaultValue="rooms">
        <TabsList><TabsTrigger value="rooms"><Building2 className="h-4 w-4 mr-2" />Rooms</TabsTrigger></TabsList>
        <TabsContent value="rooms"><DataTable data={rooms} columns={roomColumns} searchKey="roomNumber" isLoading={isLoading} /></TabsContent>
      </Tabs>
    </div>
  )
}
