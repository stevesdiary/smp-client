import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getApiErrorMessage } from '@/lib/utils'
import api from '@/lib/api'
import { ModuleHero } from '@/components/shared/ModuleHero'

const schema = z.object({ name: z.string().min(1), type: z.string().min(1), description: z.string().optional(), instructor: z.string().optional(), maxCapacity: z.coerce.number().optional() })
type FormData = z.infer<typeof schema>

const typeColors: Record<string, string> = {
  Sports: 'bg-green-100 text-green-800',
  Arts: 'bg-purple-100 text-purple-800',
  Music: 'bg-blue-100 text-blue-800',
  Clubs: 'bg-orange-100 text-orange-800',
}

export default function SportsPage() {
  const [open, setOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const qc = useQueryClient()

  const { data: activities = [], isLoading } = useQuery({ queryKey: ['activities'], queryFn: () => api.get('/sports/activities').then(r => r.data) })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/sports/activities', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activity created'); setOpen(false); reset() },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })

  const [enrollStudentId, setEnrollStudentId] = useState('')
  const enrollMutation = useMutation({
    mutationFn: () => api.post('/sports/enrollments', { activityId: selectedActivity, studentId: enrollStudentId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); toast.success('Student enrolled'); setEnrollOpen(false) },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })
  const totalEnrollments = activities.reduce((sum: number, activity: any) => sum + (activity._count?.enrollments ?? 0), 0)

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Campus life"
        title="Run sports and club participation from a sharper activity surface."
        description="Activities and enrollments remain powered by the same sports endpoints while the page now matches the richer product direction."
        stats={[
          { label: 'Activities', value: activities.length, detail: 'Programs currently available for enrollment.' },
          { label: 'Enrollments', value: totalEnrollments, detail: 'Total learners already assigned to activities.' },
          { label: 'Students', value: students.length, detail: 'Students available for enrollment actions.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Sports & Activities</h1><p className="text-muted-foreground">{activities.length} activities</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="h-4 w-4 mr-2" />New Activity</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Create Activity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Name</Label><Input className="h-11 rounded-2xl" {...register('name')} placeholder="Football" /></div>
                <div className="space-y-1"><Label>Type</Label><Input className="h-11 rounded-2xl" {...register('type')} placeholder="Sports, Arts, Music..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Instructor</Label><Input className="h-11 rounded-2xl" {...register('instructor')} /></div>
                <div className="space-y-1"><Label>Max Capacity</Label><Input className="h-11 rounded-2xl" type="number" {...register('maxCapacity')} /></div>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input className="h-11 rounded-2xl" {...register('description')} /></div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Activity'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="rounded-[28px]">
          <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select onValueChange={setEnrollStudentId}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="h-11 w-full rounded-2xl" onClick={() => enrollMutation.mutate()} disabled={!enrollStudentId || enrollMutation.isPending}>Enroll</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-[28px]" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a: any) => (
            <Card key={a.id} className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-card/85">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[a.type] ?? 'bg-gray-100 text-gray-700'}`}>{a.type}</span>
                </div>
              </CardHeader>
              <CardContent>
                {a.instructor && <p className="text-sm text-muted-foreground mb-2">Instructor: {a.instructor}</p>}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />{a._count?.enrollments ?? 0}{a.maxCapacity ? `/${a.maxCapacity}` : ''} enrolled
                  </span>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setSelectedActivity(a.id); setEnrollOpen(true) }}>
                    <Trophy className="h-3 w-3 mr-1" />Enroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
