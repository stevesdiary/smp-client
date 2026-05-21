import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarRange, Clock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import api from '@/lib/api'
import type { Class, Teacher, AcademicYear } from '@/types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SCHOOL_DAYS = [1, 2, 3, 4, 5]

type TimetableEntry = {
  id: string
  classId: string
  subjectId: string
  subject?: { id: string; name: string }
  teacherId: string
  teacher?: Teacher
  academicYearId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
}

type SubjectOption = { id: string; name: string; classId?: string }

const schema = z.object({
  subjectId: z.string().min(1, 'Select a subject'),
  teacherId: z.string().min(1, 'Select a teacher'),
  academicYearId: z.string().min(1, 'Select an academic year'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  room: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const DAY_TONE: Record<number, string> = {
  1: 'bg-chart-1/15 text-teal-800 dark:text-teal-200',
  2: 'bg-chart-2/15 text-amber-800 dark:text-amber-200',
  3: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  4: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
  5: 'bg-chart-4/15 text-rose-800 dark:text-rose-200',
}

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const qc = useQueryClient()

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  })
  const { data: subjects = [] } = useQuery<SubjectOption[]>({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data),
  })
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data),
  })
  const { data: entries = [], isLoading } = useQuery<TimetableEntry[]>({
    queryKey: ['timetable', 'class', selectedClassId],
    queryFn: () => api.get(`/timetable/class/${selectedClassId}`).then(r => r.data),
    enabled: !!selectedClassId,
  })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/timetable', { ...data, classId: selectedClassId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable', 'class', selectedClassId] })
      toast.success('Period added')
      setCreateOpen(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/timetable/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class', selectedClassId] }),
    onError: () => toast.error('Failed to delete'),
  })

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const classSubjects = subjects.filter(s => !s.classId || s.classId === selectedClassId)
  const daysWithPeriods = SCHOOL_DAYS.filter(d => entries.some(e => e.dayOfWeek === d)).length

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Class timetable"
        title="Timetable"
        description="Build and view the weekly schedule for each class."
        stats={[
          { label: 'Classes', value: classes.length },
          { label: 'Periods', value: selectedClassId ? entries.length : '—' },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a class…" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedClassId && (
              <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) reset() }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />Add Period
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Add Period — {selectedClass?.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                    <div className="space-y-1">
                      <Label>Subject</Label>
                      <Select onValueChange={v => setValue('subjectId', v)}>
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Teacher</Label>
                      <Select onValueChange={v => setValue('teacherId', v)}>
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Academic Year</Label>
                      <Select onValueChange={v => setValue('academicYearId', v)}>
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map(y => (
                            <SelectItem key={y.id} value={y.id}>
                              {y.name}{y.isCurrent ? ' (current)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.academicYearId && <p className="text-xs text-destructive">{errors.academicYearId.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Day of Week</Label>
                      <Select onValueChange={v => setValue('dayOfWeek', parseInt(v))}>
                        <SelectTrigger className="h-11 rounded-2xl">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCHOOL_DAYS.map(d => (
                            <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.dayOfWeek && <p className="text-xs text-destructive">{errors.dayOfWeek.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Start Time</Label>
                        <Input className="h-11 rounded-2xl" type="time" {...register('startTime')} />
                        {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>End Time</Label>
                        <Input className="h-11 rounded-2xl" type="time" {...register('endTime')} />
                        {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Room <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input className="h-11 rounded-2xl" {...register('room')} placeholder="Room 12A" />
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Add Period'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />

      {!selectedClassId ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-12 text-center">
          <CalendarRange className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-semibold">Select a class to view its timetable</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a class from the dropdown above to see or build its weekly schedule.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {SCHOOL_DAYS.map(d => <Skeleton key={d} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {SCHOOL_DAYS.map(day => {
            const dayEntries = entries
              .filter(e => e.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            return (
              <div key={day} className="space-y-3">
                <div className={`rounded-2xl px-4 py-2 text-center text-sm font-semibold ${DAY_TONE[day]}`}>
                  {DAY_NAMES[day]}
                </div>
                {dayEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    No periods
                  </div>
                ) : (
                  dayEntries.map(entry => (
                    <Card
                      key={entry.id}
                      className="rounded-[20px] shadow shadow-slate-900/5"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{entry.subject?.name ?? '—'}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {entry.teacher
                                ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
                                : '—'}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {entry.startTime} – {entry.endTime}
                            </div>
                            {entry.room && (
                              <Badge variant="outline" className="mt-2 rounded-full text-[10px]">
                                {entry.room}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 shrink-0 rounded-lg"
                            onClick={() => deleteMutation.mutate(entry.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
