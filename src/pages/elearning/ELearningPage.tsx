import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Video, ExternalLink } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { ModuleHero } from '@/components/shared/ModuleHero'

const liveClassSchema = z.object({
  title: z.string().min(1),
  teacherId: z.string().min(1),
  scheduledAt: z.string().min(1),
  duration: z.coerce.number().min(1),
  platform: z.string().min(1),
  meetingUrl: z.string().optional(),
})
type LiveClassForm = z.infer<typeof liveClassSchema>

const statusVariant: Record<string, any> = { SCHEDULED: 'secondary', LIVE: 'success', COMPLETED: 'outline', CANCELLED: 'destructive' }

export default function ELearningPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: liveClasses = [], isLoading } = useQuery({ queryKey: ['live-classes'], queryFn: () => api.get('/elearning/live-classes').then(r => r.data) })
  const { data: submissions = [] } = useQuery({ queryKey: ['submissions'], queryFn: () => api.get('/elearning/submissions').then(r => r.data) })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(r => r.data) })

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<LiveClassForm>({ resolver: zodResolver(liveClassSchema) as any })

  const mutation = useMutation({
    mutationFn: (data: LiveClassForm) => api.post('/elearning/live-classes', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['live-classes'] }); toast.success('Class scheduled'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const liveNow = liveClasses.filter((liveClass: any) => liveClass.status === 'LIVE').length

  const classColumns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'platform', header: 'Platform' },
    { accessorKey: 'scheduledAt', header: 'Scheduled', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'duration', header: 'Duration', cell: ({ getValue }) => `${getValue()} min` },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <Badge variant={statusVariant[getValue() as string]}>{getValue() as string}</Badge> },
    { id: 'join', cell: ({ row }) => row.original.meetingUrl && (
      <a href={row.original.meetingUrl} target="_blank" rel="noreferrer">
        <Button size="sm" variant="outline" className="rounded-xl"><ExternalLink className="h-3 w-3 mr-1" />Join</Button>
      </a>
    )},
  ]

  const submissionColumns: ColumnDef<any>[] = [
    { accessorKey: 'studentId', header: 'Student' },
    { accessorKey: 'submittedAt', header: 'Submitted', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => {
      const s = getValue() as string
      return <Badge variant={s === 'GRADED' ? 'success' : s === 'LATE' ? 'destructive' : 'secondary'}>{s}</Badge>
    }},
    { accessorKey: 'grade', header: 'Grade', cell: ({ getValue }) => getValue() ?? '—' },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Live learning"
        title="Coordinate live classes and submissions from a sharper e-learning surface."
        description="Live sessions and submissions still use the current e-learning APIs while the screen now inherits the richer interface treatment."
        stats={[
          { label: 'Live classes', value: liveClasses.length, detail: 'Scheduled classes currently available.' },
          { label: 'Live now', value: liveNow, detail: 'Classes actively marked as live.' },
          { label: 'Submissions', value: submissions.length, detail: 'Learner submissions currently visible.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">E-Learning</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="h-4 w-4 mr-2" />Schedule Class</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Schedule Live Class</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1"><Label>Title</Label><Input className="h-11 rounded-2xl" {...register('title')} placeholder="Math Live Session" /></div>
              <div className="space-y-1">
                <Label>Teacher</Label>
                <Select onValueChange={v => setValue('teacherId', v)}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Date & Time</Label><Input className="h-11 rounded-2xl" type="datetime-local" {...register('scheduledAt')} /></div>
                <div className="space-y-1"><Label>Duration (min)</Label><Input className="h-11 rounded-2xl" type="number" {...register('duration')} defaultValue={60} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Platform</Label>
                  <Select onValueChange={v => setValue('platform', v)}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Platform" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zoom">Zoom</SelectItem>
                      <SelectItem value="Google Meet">Google Meet</SelectItem>
                      <SelectItem value="Teams">Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Meeting URL</Label><Input className="h-11 rounded-2xl" {...register('meetingUrl')} placeholder="https://..." /></div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Scheduling...' : 'Schedule'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="live"><Video className="h-4 w-4 mr-2" />Live Classes</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="live"><DataTable data={liveClasses} columns={classColumns} isLoading={isLoading} /></TabsContent>
        <TabsContent value="submissions"><DataTable data={submissions} columns={submissionColumns} /></TabsContent>
      </Tabs>
    </div>
  )
}
