import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardEdit, Save, TrendingUp, AlertTriangle, Award } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/ui/search-select'
import api from '@/lib/api'
import type { Student, Grade } from '@/types'

type SubjectRow = { id: string; name: string; code?: string; classId?: string }
type Assignment = { id: string; title: string; maxScore: number; subjectId: string }

function gradeBand(pct: number): { letter: string; cls: string } {
  if (pct >= 70) return { letter: 'A', cls: 'bg-primary-fixed text-on-secondary-fixed' }
  if (pct >= 60) return { letter: 'B', cls: 'bg-surface-container-high text-on-surface' }
  if (pct >= 50) return { letter: 'C', cls: 'bg-secondary-fixed text-on-secondary-fixed' }
  if (pct >= 45) return { letter: 'D', cls: 'bg-secondary-fixed text-on-secondary-fixed' }
  return { letter: 'F', cls: 'bg-error-container text-error-on' }
}
function initials(f?: string, l?: string) { return `${f?.[0] ?? ''}${l?.[0] ?? ''}`.toUpperCase() || '?' }
const cellKey = (studentId: string, assignmentId: string) => `${studentId}|${assignmentId}`

export default function ScoreEntryPage() {
  const [subjectId, setSubjectId] = useState('')
  const [edits, setEdits] = useState<Record<string, string>>({})
  const qc = useQueryClient()

  const { data: subjects = [] } = useQuery<SubjectRow[]>({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then(r => r.data) })
  const subject = subjects.find(s => s.id === subjectId)
  const classId = subject?.classId

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students', 'class', classId],
    queryFn: () => api.get('/students', { params: { classId, limit: 200 } }).then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? [])),
    enabled: !!classId,
  })
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ['gradebook', 'assignments', subjectId],
    queryFn: () => api.get('/gradebook/assignments', { params: { subjectId } }).then(r => (r.data as Assignment[]).filter(a => a.subjectId === subjectId)),
    enabled: !!subjectId,
  })
  // Existing grades for these students, filtered to this subject.
  const { data: existing = {} } = useQuery<Record<string, number>>({
    queryKey: ['gradebook', 'existing', subjectId, students.map(s => s.id).join(',')],
    queryFn: async () => {
      const perStudent = await Promise.all(students.map(s =>
        api.get(`/gradebook/grades/student/${s.id}`).then(r => r.data as Grade[]).catch(() => [] as Grade[])))
      const map: Record<string, number> = {}
      perStudent.flat().forEach(g => {
        if (g.subjectId === subjectId && g.assignmentId) map[cellKey(g.studentId, g.assignmentId)] = g.score
      })
      return map
    },
    enabled: !!subjectId && students.length > 0,
  })

  const valueOf = (studentId: string, a: Assignment) => {
    const key = cellKey(studentId, a.id)
    return edits[key] !== undefined ? edits[key] : (existing[key] !== undefined ? String(existing[key]) : '')
  }
  const numOf = (studentId: string, a: Assignment) => {
    const v = valueOf(studentId, a)
    return v === '' ? null : Number(v)
  }

  const maxTotal = assignments.reduce((s, a) => s + (a.maxScore || 0), 0)
  const rows = students.map(st => {
    let total = 0; let any = false
    assignments.forEach(a => { const n = numOf(st.id, a); if (n != null && !Number.isNaN(n)) { total += n; any = true } })
    const pct = maxTotal > 0 && any ? Math.round((total / maxTotal) * 100) : null
    return { st, total: any ? total : null, pct }
  })
  const scored = rows.filter(r => r.pct != null)
  const classAvg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.pct as number), 0) / scored.length) : null
  const highest = scored.length ? Math.max(...scored.map(r => r.pct as number)) : null
  const unscored = rows.length - scored.length

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(edits)
        .filter(([, v]) => v !== '' && !Number.isNaN(Number(v)))
        .map(([key, v]) => {
          const [studentId, assignmentId] = key.split('|')
          const a = assignments.find(x => x.id === assignmentId)
          return { studentId, subjectId, assignmentId, score: Number(v), maxScore: a?.maxScore ?? 100 }
        })
        .filter(r => r.score >= 0 && r.score <= (assignments.find(a => a.id === r.assignmentId)?.maxScore ?? 100))
      if (records.length === 0) { toast.error('No valid scores to save'); return }
      await api.post('/gradebook/grades/bulk', records)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebook'] })
      setEdits({})
      toast.success('Marks saved')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to save marks'),
  })

  const dirty = Object.keys(edits).length > 0

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Gradebook</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Assessment Score Entry</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter and publish student marks, subject by subject.</p>
        </div>
        {subjectId && assignments.length > 0 && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} /> {saveMutation.isPending ? 'Saving…' : 'Publish Marks'}
          </button>
        )}
      </div>

      {/* Subject picker */}
      <section className="rounded-3xl bg-surface-container-low p-5">
        <div className="max-w-sm">
          <Label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</Label>
          <SearchSelect
            value={subjectId}
            onChange={(v) => { setSubjectId(v); setEdits({}) }}
            options={subjects.map(s => ({ id: s.id, label: s.name, sub: s.code }))}
            placeholder="Choose a subject…"
            searchPlaceholder="Search subjects…"
            emptyText="No subjects"
          />
        </div>
      </section>

      {!subjectId ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary"><ClipboardEdit className="h-7 w-7" strokeWidth={1.5} /></span>
          <h2 className="font-headline text-lg font-bold text-on-surface">Choose a subject</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick a subject above to enter scores for its class.</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <p className="text-sm font-semibold text-on-surface">No assessments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create an assessment for this subject in the Gradebook, then enter scores here.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <p className="text-sm font-semibold text-on-surface">No students enrolled</p>
          <p className="mt-1 text-xs text-muted-foreground">This subject's class has no enrolled students.</p>
        </div>
      ) : (
        <>
          {/* Score grid */}
          <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-5">Student</th>
                    {assignments.map(a => (
                      <th key={a.id} className="px-4 py-5 text-center">
                        <span className="block truncate normal-case tracking-normal text-on-surface">{a.title}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">/ {a.maxScore}</span>
                      </th>
                    ))}
                    <th className="px-4 py-5 text-center">Total<span className="block font-mono text-[10px] normal-case tracking-normal text-muted-foreground">/ {maxTotal}</span></th>
                    <th className="px-6 py-5 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {rows.map(({ st, total, pct }) => {
                    const g = pct != null ? gradeBand(pct) : null
                    return (
                      <tr key={st.id} className="transition-colors hover:bg-surface-container-low/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed/50 text-[11px] font-bold text-primary-container">{initials(st.firstName, st.lastName)}</div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-on-surface">{st.firstName} {st.lastName}</p>
                              <p className="truncate font-mono text-[10px] text-muted-foreground">{st.studentId ?? st.studentCode ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        {assignments.map(a => {
                          const v = valueOf(st.id, a)
                          const n = v === '' ? null : Number(v)
                          const invalid = n != null && (Number.isNaN(n) || n < 0 || n > a.maxScore)
                          return (
                            <td key={a.id} className="px-3 py-3 text-center">
                              <input
                                type="number" min={0} max={a.maxScore} inputMode="numeric"
                                value={v}
                                onChange={(e) => setEdits(prev => ({ ...prev, [cellKey(st.id, a.id)]: e.target.value }))}
                                aria-label={`${st.firstName} ${st.lastName} — ${a.title}`}
                                className={`h-10 w-16 rounded-lg border bg-surface-container-low text-center font-mono text-sm outline-none transition focus:ring-2 focus:ring-primary/20 ${
                                  invalid ? 'border-error bg-error-container/40 text-error-on' : 'border-outline-variant/30 text-on-surface'
                                }`}
                              />
                            </td>
                          )
                        })}
                        <td className="px-4 py-4 text-center font-mono text-sm font-extrabold text-primary-container">{total != null ? total : '—'}</td>
                        <td className="px-6 py-4 text-center">
                          {g ? <span className={`inline-flex min-w-[2rem] justify-center rounded-lg px-2.5 py-1 text-xs font-bold ${g.cls}`}>{g.letter}</span> : <span className="text-sm text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface px-6 py-4">
              <p className="text-sm text-muted-foreground">Showing <span className="font-bold text-on-surface">{students.length}</span> students · {assignments.length} assessment{assignments.length === 1 ? '' : 's'}</p>
              {dirty && <p className="text-xs font-bold text-secondary">Unsaved changes</p>}
            </div>
          </section>

          {/* Summary cards */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-white shadow-soft-lg">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide"><TrendingUp className="h-3.5 w-3.5" strokeWidth={2} /> Grading summary</span>
              <h3 className="font-headline text-lg font-extrabold">{subject?.name} performance</h3>
              <div className="mt-4 flex gap-8">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-primary-fixed">Class avg</p><p className="font-mono text-2xl font-black">{classAvg != null ? `${classAvg}%` : '—'}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-primary-fixed">Highest</p><p className="font-mono text-2xl font-black">{highest != null ? `${highest}%` : '—'}</p></div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed/40 text-primary"><Award className="h-6 w-6" strokeWidth={1.5} /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scored</p><p className="font-mono text-2xl font-black text-on-surface">{scored.length}<span className="text-sm text-muted-foreground"> / {students.length}</span></p></div>
            </div>
            <div className={`flex items-center gap-4 rounded-3xl p-6 shadow-soft ${unscored > 0 ? 'bg-secondary-fixed/40' : 'bg-surface-container-lowest'}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${unscored > 0 ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-primary-fixed/40 text-primary'}`}><AlertTriangle className="h-6 w-6" strokeWidth={1.5} /></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending entry</p><p className="font-mono text-2xl font-black text-on-surface">{unscored}</p></div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
