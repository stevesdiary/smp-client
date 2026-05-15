import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Plus, Pencil, FileText, ClipboardCheck, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/shared/DataTable'
import { ModuleHero } from '@/components/shared/ModuleHero'
import { CsvUploadDialog } from '@/components/shared/CsvUploadDialog'
import { QuizComposer } from '@/components/elearning/QuizComposer'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { fetchAllGradesByStudent } from '@/lib/moduleQueries'
import type {
  AcademicYear,
  Quiz,
  QuizCreatePayload,
  StaffQuizSubmitPayload,
  Student,
  Subject,
  Term,
} from '@/types'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  score: z.coerce.number().min(0),
  maxScore: z.coerce.number().min(1),
  remarks: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function emptyAcademicQuizDraft(): QuizCreatePayload {
  return {
    placement: 'ACADEMIC',
    title: '',
    description: '',
    durationMinutes: 30,
    attemptLimit: 1,
    passMark: 70,
    gradeSinkType: 'ASSIGNMENT',
    questions: [
      {
        id: 'q_1',
        prompt: '',
        type: 'MULTIPLE_CHOICE',
        options: [
          { id: 'a', label: 'Option A' },
          { id: 'b', label: 'Option B' },
        ],
        correctAnswer: 'a',
        points: 1,
      },
    ],
  }
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function draftFromQuiz(quiz: Quiz): QuizCreatePayload {
  return {
    placement: 'ACADEMIC',
    title: quiz.title,
    description: quiz.description ?? '',
    durationMinutes: quiz.durationMinutes ?? 30,
    attemptLimit: quiz.attemptLimit ?? 1,
    passMark: quiz.passMark,
    gradeSinkType: quiz.gradeSinkType,
    academicYearId: quiz.academicYearId ?? undefined,
    termId: quiz.termId ?? undefined,
    subjectId: quiz.subjectId ?? undefined,
    availableFrom: toDateTimeLocalValue(quiz.availableFrom),
    availableUntil: toDateTimeLocalValue(quiz.availableUntil),
    questions: (quiz.questions ?? []).map((question) => ({
      ...question,
      correctAnswer:
        question.type === 'TRUE_FALSE'
          ? Boolean(question.correctAnswer)
          : String(question.correctAnswer ?? ''),
    })),
  }
}

// ─── Assignments Tab ─────────────────────────────────────────────────────────

const assignmentSchema = z.object({
  termId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  academicYearId: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  maxScore: z.coerce.number().min(1),
  weight: z.coerce.number().optional(),
  dueDate: z.string().optional(),
})
type AssignmentForm = z.infer<typeof assignmentSchema>

function AssignmentsTab({ students, subjects, academicYears, terms }: { students: Student[]; subjects: Subject[]; academicYears: AcademicYear[]; terms: Term[] }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['gradebook', 'assignments'],
    queryFn: () => api.get('/gradebook/assignments').then(r => r.data),
  })

  const form = useForm<AssignmentForm>({ resolver: zodResolver(assignmentSchema) as any })

  const createMutation = useMutation({
    mutationFn: (data: AssignmentForm) => api.post('/gradebook/assignments', { ...data, maxScore: Number(data.maxScore), weight: data.weight ? Number(data.weight) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gradebook', 'assignments'] }); toast.success('Assignment created'); setOpen(false); form.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Title' },
    { id: 'subject', header: 'Subject', cell: ({ row }) => row.original.subject?.name ?? '—' },
    { accessorKey: 'maxScore', header: 'Max Score' },
    { accessorKey: 'weight', header: 'Weight', cell: ({ getValue }) => getValue() ?? '—' },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : '—' },
    { id: 'grades', header: 'Graded', cell: ({ row }) => row.original._count?.grades ?? 0 },
  ]

  return (
    <TabsContent value="assignments" className="space-y-4">
      <div className="flex justify-end gap-2">
        <CsvUploadDialog
          title="Upload Grades CSV"
          uploadUrl="/gradebook/grades/upload-csv"
          templateUrl="/gradebook/grades/csv-template"
          templateFileName="grades-template.csv"
          invalidateKeys={[['gradebook', 'all-by-student'], ['gradebook', 'assignments']]}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />New Assignment</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1"><Label>Title</Label><Input className="h-11 rounded-2xl" {...form.register('title')} placeholder="Midterm Test" /></div>
              <div className="space-y-1"><Label>Description</Label><Input className="h-11 rounded-2xl" {...form.register('description')} placeholder="Optional" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Select onValueChange={v => form.setValue('subjectId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1">
                  <Label>Term</Label>
                  <Select onValueChange={v => form.setValue('termId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Max Score</Label><Input className="h-11 rounded-2xl" type="number" defaultValue={100} {...form.register('maxScore')} /></div>
                <div className="space-y-1"><Label>Weight</Label><Input className="h-11 rounded-2xl" type="number" {...form.register('weight')} placeholder="10" /></div>
                <div className="space-y-1"><Label>Due Date</Label><Input className="h-11 rounded-2xl" type="date" {...form.register('dueDate')} /></div>
              </div>
              <div className="space-y-1">
                <Label>Academic Year</Label>
                <Select onValueChange={v => form.setValue('academicYearId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (current)' : ''}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Assignment'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={assignments} columns={columns} searchKey="title" isLoading={isLoading} />
    </TabsContent>
  )
}

// ─── Examinations Tab ────────────────────────────────────────────────────────

const examSchema = z.object({
  termId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  academicYearId: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  examDate: z.string().min(1, 'Required'),
  duration: z.coerce.number().optional(),
  maxScore: z.coerce.number().min(1),
  passingScore: z.coerce.number().optional(),
  room: z.string().optional(),
})
type ExamForm = z.infer<typeof examSchema>

const examResultSchema2 = z.object({
  examinationId: z.string().min(1, 'Required'),
  studentId: z.string().min(1, 'Required'),
  score: z.coerce.number().min(0),
  grade: z.string().optional(),
  remarks: z.string().optional(),
})
type ExamResultForm = z.infer<typeof examResultSchema2>

function ExaminationsTab({ students, subjects, academicYears, terms }: { students: Student[]; subjects: Subject[]; academicYears: AcademicYear[]; terms: Term[] }) {
  const [examOpen, setExamOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const qc = useQueryClient()

  const { data: exams = [], isLoading: examsLoading } = useQuery<any[]>({
    queryKey: ['gradebook', 'examinations'],
    queryFn: () => api.get('/gradebook/exam-results').then(r => r.data).catch(() => []),
  })

  const { data: examList = [] } = useQuery<any[]>({
    queryKey: ['gradebook', 'exam-list'],
    queryFn: async () => {
      // Fetch exams by getting results grouped — or just list from assignments endpoint context
      // The backend doesn't have a GET /gradebook/examinations, so we'll use exam-results
      const results = await api.get('/gradebook/exam-results').then(r => r.data)
      return results
    },
  })

  const examForm = useForm<ExamForm>({ resolver: zodResolver(examSchema) as any })
  const resultForm = useForm<ExamResultForm>({ resolver: zodResolver(examResultSchema2) as any })

  const createExamMutation = useMutation({
    mutationFn: (data: ExamForm) => api.post('/gradebook/examinations', { ...data, maxScore: Number(data.maxScore), duration: data.duration ? Number(data.duration) : undefined, passingScore: data.passingScore ? Number(data.passingScore) : undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gradebook'] }); toast.success('Examination created'); setExamOpen(false); examForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const recordResultMutation = useMutation({
    mutationFn: (data: ExamResultForm) => api.post('/gradebook/exam-results', { ...data, score: Number(data.score) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gradebook'] }); toast.success('Result recorded'); setResultOpen(false); resultForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const resultColumns: ColumnDef<any>[] = [
    { id: 'exam', header: 'Examination', cell: ({ row }) => row.original.examination?.name ?? '—' },
    { id: 'student', header: 'Student', cell: ({ row }) => row.original.student ? `${row.original.student.firstName} ${row.original.student.lastName}` : '—' },
    { accessorKey: 'score', header: 'Score' },
    { accessorKey: 'grade', header: 'Grade', cell: ({ getValue }) => {
      const g = getValue() as string
      if (!g) return '—'
      const variant = g === 'A' ? 'success' : g === 'B' ? 'success' : g === 'C' ? 'warning' : 'destructive'
      return <Badge variant={variant}>{g}</Badge>
    }},
    { accessorKey: 'remarks', header: 'Remarks', cell: ({ getValue }) => (getValue() as string) || '—' },
  ]

  return (
    <TabsContent value="exams" className="space-y-4">
      <div className="flex justify-end gap-2">
        <CsvUploadDialog
          title="Upload Exam Results CSV"
          uploadUrl="/gradebook/exam-results/upload-csv"
          templateUrl="/gradebook/exam-results/csv-template"
          templateFileName="exam-results-template.csv"
          invalidateKeys={[['gradebook']]}
        />
        <Dialog open={resultOpen} onOpenChange={setResultOpen}>
          <DialogTrigger asChild><Button variant="outline" className="h-12 rounded-2xl"><Plus className="mr-2 h-4 w-4" />Record Result</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Record Exam Result</DialogTitle></DialogHeader>
            <form onSubmit={resultForm.handleSubmit(d => recordResultMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1"><Label>Examination ID</Label><Input className="h-11 rounded-2xl" {...resultForm.register('examinationId')} placeholder="Paste examination UUID" /></div>
              <div className="space-y-1">
                <Label>Student</Label>
                <Select onValueChange={v => resultForm.setValue('studentId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Score</Label><Input className="h-11 rounded-2xl" type="number" {...resultForm.register('score')} /></div>
                <div className="space-y-1"><Label>Grade</Label><Input className="h-11 rounded-2xl" {...resultForm.register('grade')} placeholder="A" /></div>
                <div className="space-y-1"><Label>Remarks</Label><Input className="h-11 rounded-2xl" {...resultForm.register('remarks')} /></div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={recordResultMutation.isPending}>{recordResultMutation.isPending ? 'Saving...' : 'Record Result'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={examOpen} onOpenChange={setExamOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />New Exam</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Create Examination</DialogTitle></DialogHeader>
            <form onSubmit={examForm.handleSubmit(d => createExamMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1"><Label>Exam Name</Label><Input className="h-11 rounded-2xl" {...examForm.register('name')} placeholder="Term 1 Final Exam" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Subject</Label>
                  <Select onValueChange={v => examForm.setValue('subjectId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-1">
                  <Label>Term</Label>
                  <Select onValueChange={v => examForm.setValue('termId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Exam Date</Label><Input className="h-11 rounded-2xl" type="date" {...examForm.register('examDate')} /></div>
                <div className="space-y-1"><Label>Duration (min)</Label><Input className="h-11 rounded-2xl" type="number" {...examForm.register('duration')} placeholder="120" /></div>
                <div className="space-y-1"><Label>Room</Label><Input className="h-11 rounded-2xl" {...examForm.register('room')} placeholder="Hall 1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Max Score</Label><Input className="h-11 rounded-2xl" type="number" defaultValue={100} {...examForm.register('maxScore')} /></div>
                <div className="space-y-1"><Label>Passing Score</Label><Input className="h-11 rounded-2xl" type="number" {...examForm.register('passingScore')} placeholder="40" /></div>
              </div>
              <div className="space-y-1">
                <Label>Academic Year</Label>
                <Select onValueChange={v => examForm.setValue('academicYearId', v)}><SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (current)' : ''}</SelectItem>)}</SelectContent></Select>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={createExamMutation.isPending}>{createExamMutation.isPending ? 'Creating...' : 'Create Examination'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={exams} columns={resultColumns} isLoading={examsLoading} />
    </TabsContent>
  )
}

// ─── Report Cards Tab ────────────────────────────────────────────────────────

function ReportCardsTab({ students, terms }: { students: Student[]; terms: Term[] }) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')

  const { data: reportCard, isLoading, isFetching } = useQuery<{ subjects: any[]; overallAverage: number }>({
    queryKey: ['gradebook', 'report-card', selectedStudent, selectedTerm],
    queryFn: () => api.get(`/gradebook/report-card/${selectedStudent}/term/${selectedTerm}`).then(r => r.data),
    enabled: !!selectedStudent && !!selectedTerm,
  })

  return (
    <TabsContent value="report-cards" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1 flex-1 max-w-xs">
          <Label>Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 max-w-xs">
          <Label>Term</Label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select term" /></SelectTrigger>
            <SelectContent>{terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {!selectedStudent || !selectedTerm ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-medium">Select a student and term</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose a student and term above to generate their report card.</p>
        </div>
      ) : isLoading || isFetching ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/50" />)}</div>
      ) : reportCard && reportCard.subjects.length > 0 ? (
        <div className="space-y-6">
          {/* Overall average */}
          <div className="rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Average</p>
                <p className="text-4xl font-semibold">{Math.round(reportCard.overallAverage)}%</p>
              </div>
              <Badge variant={reportCard.overallAverage >= 70 ? 'success' : reportCard.overallAverage >= 50 ? 'warning' : 'destructive'} className="text-lg px-4 py-2">
                {reportCard.overallAverage >= 70 ? 'A' : reportCard.overallAverage >= 60 ? 'B' : reportCard.overallAverage >= 50 ? 'C' : reportCard.overallAverage >= 40 ? 'D' : 'F'}
              </Badge>
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="space-y-3">
            {reportCard.subjects.map((subj: any) => (
              <div key={subj.subjectId} className="rounded-[20px] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card/85">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{subj.subjectName}</p>
                    <p className="text-sm text-muted-foreground">{subj.grades.length} assessment{subj.grades.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">{Math.round(subj.average)}%</p>
                    <Badge variant={subj.average >= 70 ? 'success' : subj.average >= 50 ? 'warning' : 'destructive'}>
                      {subj.average >= 70 ? 'A' : subj.average >= 60 ? 'B' : subj.average >= 50 ? 'C' : subj.average >= 40 ? 'D' : 'F'}
                    </Badge>
                  </div>
                </div>
                {subj.grades.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {subj.grades.map((g: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{g.assignmentTitle}</span>
                        <span className="font-medium">{g.score}/{g.maxScore} ({Math.round(g.percentage)}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/50 p-12 text-center">
          <p className="font-medium">No grades found</p>
          <p className="mt-1 text-sm text-muted-foreground">This student has no recorded grades for the selected term.</p>
        </div>
      )}
    </TabsContent>
  )
}

export default function GradesPage() {
  const [open, setOpen] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [quizDraft, setQuizDraft] = useState<QuizCreatePayload>(emptyAcademicQuizDraft())
  const qc = useQueryClient()

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['gradebook', 'all-by-student'],
    queryFn: fetchAllGradesByStudent,
  })
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then((r) => r.data) })
  const { data: subjects = [] } = useQuery<Subject[]>({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then((r) => r.data) })
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({ queryKey: ['academic-years'], queryFn: () => api.get('/academic-years').then((r) => r.data) })
  const { data: terms = [] } = useQuery<Term[]>({ queryKey: ['terms'], queryFn: () => api.get('/terms').then((r) => r.data) })
  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery<Quiz[]>({
    queryKey: ['quizzes', 'academic'],
    queryFn: () => api.get('/elearning/quizzes', { params: { placement: 'ACADEMIC' } }).then((response) => response.data),
  })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const gradeMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/gradebook/grades', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebook', 'all-by-student'] })
      toast.success('Grade recorded')
      setOpen(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const createAssessmentMutation = useMutation({
    mutationFn: (payload: QuizCreatePayload) => api.post('/elearning/quizzes', payload).then((response) => response.data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quizzes', 'academic'] })
      toast.success('Assessment draft created')
      setAssessmentOpen(false)
      setEditingQuiz(null)
      setQuizDraft(emptyAcademicQuizDraft())
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create assessment'),
  })

  const updateAssessmentMutation = useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: QuizCreatePayload }) =>
      api.put(`/elearning/quizzes/${quizId}`, payload).then((response) => response.data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quizzes', 'academic'] })
      toast.success('Assessment updated')
      setAssessmentOpen(false)
      setEditingQuiz(null)
      setQuizDraft(emptyAcademicQuizDraft())
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update assessment'),
  })

  const publishAssessmentMutation = useMutation({
    mutationFn: (quizId: string) => api.post(`/elearning/quizzes/${quizId}/publish`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quizzes', 'academic'] })
      toast.success('Assessment published')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to publish assessment'),
  })

  const closeAssessmentMutation = useMutation({
    mutationFn: (quizId: string) => api.post(`/elearning/quizzes/${quizId}/close`),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quizzes', 'academic'] })
      toast.success('Assessment closed')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to close assessment'),
  })

  const averagePercent = grades.length > 0
    ? Math.round(grades.reduce((sum: number, grade: any) => sum + ((grade.score / grade.maxScore) * 100), 0) / grades.length)
    : 0

  const assessmentAverage = useMemo(() => {
    const scores = assessments
      .map((assessment) => assessment.latestOfficialScoreSummary?.averageScore)
      .filter((score): score is number => typeof score === 'number')

    if (!scores.length) return null
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }, [assessments])

  const columns: ColumnDef<any>[] = [
    { id: 'student', header: 'Student', cell: ({ row }) => `${row.original.student?.firstName ?? ''} ${row.original.student?.lastName ?? ''}` },
    { id: 'subject', header: 'Subject', cell: ({ row }) => row.original.subject?.name ?? '—' },
    { id: 'assignment', header: 'Assignment', cell: ({ row }) => row.original.assignment?.title ?? 'Manual' },
    { id: 'score', header: 'Score', cell: ({ row }) => `${row.original.score}/${row.original.maxScore}` },
    {
      id: 'pct',
      header: '%',
      cell: ({ row }) => {
        const pct = Math.round((row.original.score / row.original.maxScore) * 100)
        return <Badge variant={pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'destructive'}>{pct}%</Badge>
      },
    },
    { accessorKey: 'gradedAt', header: 'Date', cell: ({ getValue }) => formatDate(getValue() as string) },
  ]

  const assessmentColumns: ColumnDef<Quiz>[] = [
    { accessorKey: 'title', header: 'Assessment' },
    { id: 'subject', header: 'Subject', cell: ({ row }) => row.original.subject?.name ?? '—' },
    { id: 'sink', header: 'Sink', cell: ({ row }) => row.original.gradeSinkType },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as Quiz['status']
        return <Badge variant={status === 'PUBLISHED' ? 'success' : status === 'CLOSED' ? 'outline' : 'secondary'}>{status}</Badge>
      },
    },
    {
      id: 'window',
      header: 'Window',
      cell: ({ row }) => {
        const openAt = row.original.availableFrom ? formatDate(row.original.availableFrom) : 'Open'
        const closeAt = row.original.availableUntil ? formatDate(row.original.availableUntil) : 'No close'
        return `${openAt} -> ${closeAt}`
      },
    },
    {
      id: 'latestSummary',
      header: 'Latest score summary',
      cell: ({ row }) => {
        const summary = row.original.latestOfficialScoreSummary
        if (!summary?.latestAttempts) return 'No completed attempts'
        return `${Math.round(summary.averageScore ?? 0)}% avg / ${summary.passed} passed`
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setEditingQuiz(row.original)
              setQuizDraft(draftFromQuiz(row.original))
              setAssessmentOpen(true)
            }}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Edit
          </Button>
          {row.original.status === 'DRAFT' ? (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => publishAssessmentMutation.mutate(row.original.id)}>
              Publish
            </Button>
          ) : null}
          {row.original.status === 'PUBLISHED' ? (
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => closeAssessmentMutation.mutate(row.original.id)}>
              Close
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Gradebook"
        title="Record performance and launch official digital assessments from one command surface."
        description="Manual grade entry stays available while academic quizzes now create official assignment or examination sinks inside the same LMS."
        stats={[
          { label: 'Grade records', value: grades.length, detail: 'Manual and synced grade entries currently visible.' },
          { label: 'Assessments', value: assessments.length, detail: 'Standalone academic quizzes configured from gradebook.' },
          { label: 'Assessment avg', value: assessmentAverage !== null ? `${assessmentAverage}%` : '—', detail: 'Average of latest official quiz attempts.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gradebook</h1>
          <p className="text-muted-foreground">{grades.length} grade records · {assessments.length} academic assessments</p>
        </div>
      </div>

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="grades">Grades</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="assignments"><ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />Assignments</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="exams"><FileText className="mr-1.5 h-3.5 w-3.5" />Examinations</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="report-cards"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Report Cards</TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <div className="flex justify-end gap-2">
            <CsvUploadDialog
              title="Upload Grades CSV"
              uploadUrl="/gradebook/grades/upload-csv"
              templateUrl="/gradebook/grades/csv-template"
              templateFileName="grades-template.csv"
              invalidateKeys={[['gradebook', 'all-by-student']]}
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />Record Grade</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[28px]">
                <DialogHeader><DialogTitle>Record Grade</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit((data) => gradeMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Student</Label>
                    <Select onValueChange={(value) => setValue('studentId', value)}>
                      <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.firstName} {student.lastName}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Subject</Label>
                    <Select onValueChange={(value) => setValue('subjectId', value)}>
                      <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>{subjects.map((subject) => <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Score</Label><Input className="h-11 rounded-2xl" type="number" {...register('score')} /></div>
                    <div className="space-y-1"><Label>Max Score</Label><Input className="h-11 rounded-2xl" type="number" {...register('maxScore')} defaultValue={100} /></div>
                  </div>
                  <div className="space-y-1"><Label>Remarks</Label><Input className="h-11 rounded-2xl" {...register('remarks')} placeholder="Optional" /></div>
                  <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Grade'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DataTable data={grades} columns={columns} isLoading={isLoading} />
        </TabsContent>

        <AssignmentsTab students={students} subjects={subjects} academicYears={academicYears} terms={terms} />
        <ExaminationsTab students={students} subjects={subjects} academicYears={academicYears} terms={terms} />
        <ReportCardsTab students={students} terms={terms} />

        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog
              open={assessmentOpen}
              onOpenChange={(next) => {
                setAssessmentOpen(next)
                if (!next) {
                  setEditingQuiz(null)
                  setQuizDraft(emptyAcademicQuizDraft())
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl px-5"><Plus className="mr-2 h-4 w-4" />New Assessment</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[28px]">
                <DialogHeader>
                  <DialogTitle>{editingQuiz ? 'Edit academic assessment' : 'Create academic assessment'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  <QuizComposer
                    value={quizDraft}
                    onChange={setQuizDraft}
                    academicYears={academicYears}
                    terms={terms}
                    subjects={subjects}
                    lockedPlacement="ACADEMIC"
                  />
                  <Button
                    className="h-11 w-full rounded-2xl"
                    onClick={async () => {
                      if (editingQuiz) {
                        await updateAssessmentMutation.mutateAsync({ quizId: editingQuiz.id, payload: quizDraft })
                        return
                      }
                      await createAssessmentMutation.mutateAsync(quizDraft)
                    }}
                    disabled={createAssessmentMutation.isPending || updateAssessmentMutation.isPending}
                  >
                    {editingQuiz
                      ? (updateAssessmentMutation.isPending ? 'Saving...' : 'Save assessment')
                      : (createAssessmentMutation.isPending ? 'Creating...' : 'Create assessment')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-secondary/15 px-5 py-4 text-sm text-muted-foreground">
            Latest-attempt scoring is active for graded quizzes. Students see results only after the assessment is closed.
          </div>

          <DataTable data={assessments} columns={assessmentColumns} isLoading={assessmentsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
