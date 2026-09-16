import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2, Upload, BookOpen, FilterX, Layers3, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchSelect } from '@/components/ui/search-select'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import api from '@/lib/api'
import type { Class, Teacher, AcademicYear } from '@/types'

type SubjectRow = {
  id: string; name: string; code?: string
  classId?: string; class?: Class
  teacherId?: string; teacher?: Teacher
  academicYearId?: string; academicYear?: AcademicYear
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  code: z.string().optional(),
  classId: z.string().min(1, 'Select a class'),
  academicYearId: z.string().min(1, 'Select an academic year'),
  teacherId: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function initials(t?: { firstName?: string; lastName?: string }) {
  if (!t) return '?'
  return `${t.firstName?.[0] ?? ''}${t.lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function SubjectsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectRow | undefined>()
  const [fClass, setFClass] = useState('all')
  const [fYear, setFYear] = useState('all')
  const [fTeacher, setFTeacher] = useState('all')
  const qc = useQueryClient()

  const { data: subjects = [], isLoading } = useQuery<SubjectRow[]>({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data) })
  const { data: classes = [] } = useQuery<Class[]>({ queryKey: ['classes'], queryFn: () => api.get('/classes').then(r => r.data) })
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ['teachers'], queryFn: () => api.get('/teachers').then(r => r.data) })
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({ queryKey: ['academic-years'], queryFn: () => api.get('/academic-years').then(r => r.data) })

  // Resolve relations from the loaded lookups (robust whether or not the
  // /subjects response embeds them).
  const classById = new Map(classes.map(c => [c.id, c]))
  const teacherById = new Map(teachers.map(t => [t.id, t]))
  const yearById = new Map(academicYears.map(y => [y.id, y]))
  const classOf = (s: SubjectRow) => s.class ?? (s.classId ? classById.get(s.classId) : undefined)
  const teacherOf = (s: SubjectRow) => s.teacher ?? (s.teacherId ? teacherById.get(s.teacherId) : undefined)
  const yearOf = (s: SubjectRow) => s.academicYear ?? (s.academicYearId ? yearById.get(s.academicYearId) : undefined)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing
      ? { name: editing.name, code: editing.code ?? '', classId: editing.classId ?? '', academicYearId: editing.academicYearId ?? '', teacherId: editing.teacherId ?? '' }
      : undefined,
  })
  const closeDialog = () => { setOpen(false); reset(); setEditing(undefined) }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (editing) {
        await api.put(`/subjects/${editing.id}`, { name: data.name, code: data.code })
        if (data.teacherId && data.teacherId !== editing.teacherId) {
          await api.put(`/subjects/${editing.id}/assign-teacher`, { teacherId: data.teacherId })
        }
      } else {
        await api.post('/subjects', {
          name: data.name, code: data.code, classId: data.classId,
          academicYearId: data.academicYearId, teacherId: data.teacherId || undefined,
        })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success(editing ? 'Subject updated' : 'Subject created'); closeDialog() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject deleted') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const filtered = subjects.filter(s =>
    (fClass === 'all' || s.classId === fClass) &&
    (fYear === 'all' || s.academicYearId === fYear) &&
    (fTeacher === 'all' || s.teacherId === fTeacher))
  const hasFilters = fClass !== 'all' || fYear !== 'all' || fTeacher !== 'all'
  const clearFilters = () => { setFClass('all'); setFYear('all'); setFTeacher('all') }

  const assignedCount = subjects.filter(s => teacherOf(s)).length
  const classCount = new Set(subjects.map(s => s.classId).filter(Boolean)).size

  const filterTrigger = 'h-10 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-sm'

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Academic registry</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Subject Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure and assign faculty to academic subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvUploadDialog
            title="Upload Subjects CSV" uploadUrl="/subjects/upload-csv" templateUrl="/subjects/csv-template"
            templateFileName="subjects-template.csv" invalidateKeys={[['subjects']]}
            trigger={<button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"><Upload className="h-4 w-4" strokeWidth={1.5} /> CSV Upload</button>}
          />
          <Dialog open={open} onOpenChange={v => { if (!v) closeDialog(); else setOpen(true) }}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95">
                <Plus className="h-4 w-4" strokeWidth={2} /> Add Subject
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'Add New Subject'}</DialogTitle></DialogHeader>
              <p className="-mt-2 text-sm text-muted-foreground">Enter details to register a subject in the curriculum.</p>
              <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Subject Name</Label><Input {...register('name')} placeholder="Further Mathematics" />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
                  <div className="space-y-1.5"><Label>Code <span className="text-xs text-muted-foreground">(optional)</span></Label><Input {...register('code')} placeholder="MATH-101" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Select defaultValue={editing?.classId} onValueChange={v => setValue('classId', v)} disabled={!!editing}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.classId && <p className="text-xs text-destructive">{errors.classId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Academic Year</Label>
                    <Select defaultValue={editing?.academicYearId} onValueChange={v => setValue('academicYearId', v)} disabled={!!editing}>
                      <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (current)' : ''}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.academicYearId && <p className="text-xs text-destructive">{errors.academicYearId.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Assign Teacher <span className="text-xs text-muted-foreground">(optional)</span></Label>
                  <SearchSelect
                    value={watch('teacherId') ?? editing?.teacherId}
                    onChange={v => setValue('teacherId', v)}
                    options={teachers.map(t => ({ id: t.id, label: `${t.firstName} ${t.lastName}`, sub: t.subject }))}
                    placeholder="Search teacher by name" searchPlaceholder="Search teachers…" emptyText="No teachers"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editing ? 'Update Subject' : 'Save Subject'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary tiles */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: 'Total Subjects', value: subjects.length, icon: BookOpen, tone: 'bg-primary-container/10 text-primary' },
          { label: 'With Teacher', value: assignedCount, icon: UserCheck, tone: 'bg-secondary-container/10 text-secondary' },
          { label: 'Across Classes', value: classCount, icon: Layers3, tone: 'bg-primary-fixed/40 text-primary' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tone}`}><s.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p><p className="font-mono text-2xl font-black text-on-surface">{s.value}</p></div>
          </div>
        ))}
      </section>

      {/* Quick filters */}
      <section className="rounded-3xl bg-surface-container-low p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Filters</span>
          <Select value={fClass} onValueChange={setFClass}>
            <SelectTrigger className={`${filterTrigger} w-44`}><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fYear} onValueChange={setFYear}>
            <SelectTrigger className={`${filterTrigger} w-48`}><SelectValue placeholder="Academic Year" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Years</SelectItem>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fTeacher} onValueChange={setFTeacher}>
            <SelectTrigger className={`${filterTrigger} w-48`}><SelectValue placeholder="Teacher" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Teachers</SelectItem>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent>
          </Select>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:underline">
              <FilterX className="h-4 w-4" strokeWidth={1.5} /> Clear All Filters
            </button>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Subject Name</th>
                <th className="px-6 py-5">Class</th>
                <th className="px-6 py-5">Assigned Teacher</th>
                <th className="px-6 py-5">Academic Year</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center">
                  <p className="text-sm font-semibold text-on-surface">No subjects found</p>
                  <p className="mt-1 text-xs text-muted-foreground">{hasFilters ? 'No subjects match these filters.' : 'Add your first subject to the curriculum.'}</p>
                </td></tr>
              ) : (
                filtered.map(s => {
                  const cls = classOf(s); const t = teacherOf(s); const yr = yearOf(s)
                  return (
                    <tr key={s.id} className="group transition-colors hover:bg-surface-container-low/40">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed/50 text-primary"><BookOpen className="h-4 w-4" strokeWidth={1.5} /></div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-on-surface">{s.name}</p>
                            {s.code && <p className="truncate font-mono text-[11px] text-muted-foreground">{s.code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {cls ? <span className="inline-flex items-center rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">{cls.name}</span> : <span className="text-sm text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-5">
                        {t ? (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-on-surface">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-primary-container">{initials(t)}</span>
                            {t.firstName} {t.lastName}
                          </span>
                        ) : <span className="rounded-full border border-outline-variant/40 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-muted-foreground">{yr?.name ?? '—'}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => { setEditing(s); setOpen(true) }} aria-label={`Edit ${s.name}`} className="rounded-lg p-2 text-outline transition-all hover:bg-primary/5 hover:text-primary"><Pencil className="h-4 w-4" strokeWidth={1.5} /></button>
                          <button onClick={() => deleteMutation.mutate(s.id)} aria-label={`Delete ${s.name}`} className="rounded-lg p-2 text-outline transition-all hover:bg-destructive/5 hover:text-destructive"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
