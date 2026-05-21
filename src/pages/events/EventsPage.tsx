import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
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

const typeColors: Record<string, string> = {
  Sports: 'bg-success-light text-success dark:bg-green-900 dark:text-green-200',
  Cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Academic: 'bg-info-light text-info dark:bg-blue-900 dark:text-blue-200',
  Meeting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

export default function EventsPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: () => api.get('/events').then(r => r.data) })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/events', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Event created'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="School calendar"
        title="Events"
        description="Create and review school events."
        stats={[
          { label: 'Total', value: events.length },
          { label: 'Upcoming', value: events.filter((e: any) => new Date(e.startDate) >= new Date()).length },
        ]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Event</Button></DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1"><Label>Title</Label><Input className="h-11 rounded-2xl" {...register('title')} />{errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}</div>
              <div className="space-y-1"><Label>Type</Label><Input className="h-11 rounded-2xl" {...register('type')} placeholder="Sports, Cultural, Academic..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Start Date</Label><Input className="h-11 rounded-2xl" type="datetime-local" {...register('startDate')} /></div>
                <div className="space-y-1"><Label>End Date</Label><Input className="h-11 rounded-2xl" type="datetime-local" {...register('endDate')} /></div>
              </div>
              <div className="space-y-1"><Label>Venue</Label><Input className="h-11 rounded-2xl" {...register('venue')} placeholder="School Hall" /></div>
              <div className="space-y-1"><Label>Description</Label><Input className="h-11 rounded-2xl" {...register('description')} /></div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Event'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : events.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No events yet</p>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <Card key={event.id} className="rounded-xl transition-shadow hover:shadow-xl">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[event.type] ?? 'bg-gray-100 text-gray-700'}`}>{event.type}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(event.startDate)}</span>
                    {event.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>}
                  </div>
                  {event.description && <p className="text-sm text-muted-foreground mt-1 truncate">{event.description}</p>}
                </div>
                <div className="hidden items-center text-warning lg:flex">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
