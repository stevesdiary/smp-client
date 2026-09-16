import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarRange, Plus, Trash2, Printer, AlertTriangle, Layers3, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchSelect } from '@/components/ui/search-select'
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

// A small rotating accent so subjects are visually distinguishable in the grid.
const ACCENTS = ['border-l-primary', 'border-l-secondary-container', 'border-l-[#7efba4]', 'border-l-[#93d5a7]', 'border-l-outline']
function accentFor(subjectId: string) {
  let h = 0
  for (let i = 0; i < subjectId.length; i++) h = (h * 31 + subjectId.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

function SummaryTile({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof Clock; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-mono text-2xl font-black text-on-surface">{value}</p>
      </div>
    </div>
  )
}

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const qc = useQueryClient()

  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(r => r.data) })
  const { data: subjects = [] } = useQuery<SubjectOption[]>({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data) })
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(r => r.data) })
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({ queryKey: ['academic-years'], queryFn: () => api.get('/academic-years').then(r => r.data) })
  const { data: entries = [], isLoading } = useQuery<TimetableEntry[]>({
    queryKey: ['timetable', 'class', selectedClassId],
    queryFn: () => api.get(`/timetables/class/${selectedClassId}`).then(r => r.data),
    enabled: !!selectedClassId,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/timetables', { ...data, classId: selectedClassId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable', 'class', selectedClassId] }); toast.success('Period added'); setCreateOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/timetables/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable', 'class', selectedClassId] }); toast.success('Period removed') },
    onError: () => toast.error('Failed to delete'),
  })

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const classSubjects = subjects.filter(s => !s.classId || s.classId === selectedClassId)

  // Build the grid: distinct time slots (rows) × school days (columns)
  const slotKeys = Array.from(new Set(entries.map(e => `${e.startTime}|${e.endTime}`)))
    .sort((a, b) => a.localeCompare(b))
  const cellFor = (slotKey: string, day: number) =>
    entries.filter(e => `${e.startTime}|${e.endTime}` === slotKey && e.dayOfWeek === day)
  const conflicts = slotKeys.reduce((n, sk) => n + SCHOOL_DAYS.filter(d => cellFor(sk, d).length > 1).length, 0)
  const subjectsScheduled = new Set(entries.map(e => e.subjectId)).size

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Academic registry</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Timetable Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Build and resolve the weekly schedule, class by class.</p>
        </div>
        {selectedClassId && entries.length > 0 && (
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high">
            <Printer className="h-4 w-4" strokeWidth={1.5} /> Export to PDF
          </button>
        )}
      </div>

      {/* Filter / action bar */}
      <section className="rounded-3xl bg-surface-container-low p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[220px]">
            <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="h-11 w-full rounded-xl border-outline-variant/30 bg-surface-container-lowest">
                <SelectValue placeholder="Select a class…" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedClassId && (
            <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) reset() }}>
              <DialogTrigger asChild>
                <button className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95">
                  <Plus className="h-4 w-4" strokeWidth={2} /> Add Period
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add Period — {selectedClass?.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <SearchSelect
                      value={watch('subjectId')}
                      onChange={v => setValue('subjectId', v, { shouldValidate: true })}
                      options={classSubjects.map(s => ({ id: s.id, label: s.name }))}
                      placeholder="Select subject" searchPlaceholder="Search subjects…" emptyText="No subjects"
                    />
                    {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teacher</Label>
                    <SearchSelect
                      value={watch('teacherId')}
                      onChange={v => setValue('teacherId', v, { shouldValidate: true })}
                      options={teachers.map(t => ({ id: t.id, label: `${t.firstName} ${t.lastName}`, sub: t.subject }))}
                      placeholder="Select teacher" searchPlaceholder="Search teachers…" emptyText="No teachers"
                    />
                    {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Academic Year</Label>
                    <Select onValueChange={v => setValue('academicYearId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (current)' : ''}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.academicYearId && <p className="text-xs text-destructive">{errors.academicYearId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Day of Week</Label>
                    <Select onValueChange={v => setValue('dayOfWeek', parseInt(v))}>
                      <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                      <SelectContent>{SCHOOL_DAYS.map(d => <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.dayOfWeek && <p className="text-xs text-destructive">{errors.dayOfWeek.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" {...register('startTime')} />{errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}</div>
                    <div className="space-y-1.5"><Label>End Time</Label><Input type="time" {...register('endTime')} />{errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Room <span className="text-xs text-muted-foreground">(optional)</span></Label>
                    <Input {...register('room')} placeholder="Room 12A" />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add Period'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>

      {/* Grid */}
      {!selectedClassId ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
            <CalendarRange className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="font-headline text-lg font-bold text-on-surface">Select a class</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a class above to view or build its weekly schedule.</p>
        </div>
      ) : isLoading ? (
        <div className="h-80 animate-pulse rounded-3xl bg-surface-container-low" />
      ) : entries.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <p className="text-sm font-semibold text-on-surface">No periods scheduled</p>
          <p className="mt-1 text-xs text-muted-foreground">Use “Add Period” to start building {selectedClass?.name}'s timetable.</p>
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <SummaryTile label="Periods" value={entries.length} icon={Clock} tone="bg-primary-fixed/40 text-primary" />
            <SummaryTile label="Subjects" value={subjectsScheduled} icon={Layers3} tone="bg-surface-container-high text-primary-container" />
            <SummaryTile label="Conflicts" value={conflicts} icon={AlertTriangle} tone={conflicts > 0 ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-primary-fixed/40 text-primary'} />
          </section>

          {/* Weekly grid */}
          <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="w-24 px-4 py-4 text-left">Time</th>
                    {SCHOOL_DAYS.map(d => <th key={d} className="px-4 py-4 text-left">{DAY_NAMES[d]}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {slotKeys.map(sk => {
                    const [start, end] = sk.split('|')
                    return (
                      <tr key={sk} className="align-top">
                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          <span className="font-mono text-xs font-bold text-primary-container">{start}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">{end}</span>
                        </td>
                        {SCHOOL_DAYS.map(day => {
                          const cell = cellFor(sk, day)
                          const conflict = cell.length > 1
                          if (cell.length === 0) {
                            return <td key={day} className="p-2"><div className="h-full min-h-[64px] rounded-xl border border-dashed border-outline-variant/25" /></td>
                          }
                          return (
                            <td key={day} className="p-2">
                              <div className="space-y-2">
                                {cell.map(entry => (
                                  <div
                                    key={entry.id}
                                    className={`group relative rounded-xl border-l-4 p-3 pr-8 ${
                                      conflict ? 'border-l-[#ba1a1a] bg-[#ffdad6]/30' : `bg-surface-container-low ${accentFor(entry.subjectId)}`
                                    }`}
                                  >
                                    <p className="truncate text-xs font-bold text-on-surface">{entry.subject?.name ?? 'Subject'}</p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : 'Unassigned'}
                                    </p>
                                    {entry.room && <p className="mt-0.5 text-[10px] font-medium text-outline">{entry.room}</p>}
                                    {conflict && (
                                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#93000a]">
                                        <AlertTriangle className="h-3 w-3" strokeWidth={2} /> Double-booked
                                      </span>
                                    )}
                                    <button
                                      onClick={() => deleteMutation.mutate(entry.id)}
                                      aria-label="Remove period"
                                      className="absolute right-1.5 top-1.5 rounded-md p-1 text-outline opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
