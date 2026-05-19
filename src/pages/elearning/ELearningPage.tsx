import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CircleHelp,
  ExternalLink,
  PlayCircle,
  Plus,
  Timer,
  Video,
} from 'lucide-react'
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
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { RecordedLessonPlayer } from '@/components/elearning/RecordedLessonPlayer'
import { formatDate } from '@/lib/utils'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'
import { detectVideoSource } from '@/lib/video'
import { useAuthStore } from '@/store/authStore'
import type { Lesson, Quiz, RecordedCourse } from '@/types'

const liveClassSchema = z.object({
  title: z.string().min(1),
  teacherId: z.string().min(1),
  scheduledAt: z.string().min(1),
  duration: z.coerce.number().min(1),
  platform: z.string().min(1),
  meetingUrl: z.string().optional(),
})

type LiveClassForm = z.infer<typeof liveClassSchema>

const statusVariant: Record<string, any> = {
  SCHEDULED: 'secondary',
  LIVE: 'success',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
}

function updateRecordedCoursesProgress(
  courses: RecordedCourse[] | undefined,
  lessonId: string,
  payload: {
    enrollment: { progress: number; status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'; completedAt?: string | null }
    lessonProgress: { completed: boolean; timeSpent: number; lastAccessed?: string | null }
  },
) {
  if (!courses) {
    return courses
  }

  return courses.map((course) => ({
    ...course,
    enrollmentProgress: course.modules.some((module) => module.lessons?.some((lesson) => lesson.id === lessonId))
      ? payload.enrollment.progress
      : course.enrollmentProgress,
    enrollmentStatus: course.modules.some((module) => module.lessons?.some((lesson) => lesson.id === lessonId))
      ? payload.enrollment.status
      : course.enrollmentStatus,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons?.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              progress: payload.lessonProgress,
            }
          : lesson,
      ),
    })),
  }))
}

function StudentRecordedLessons() {
  const qc = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  const { data: recordedCourses = [], isLoading } = useQuery<RecordedCourse[]>({
    queryKey: ['recorded-courses'],
    queryFn: () => api.get('/elearning/recorded-courses').then((response) => response.data),
  })

  useEffect(() => {
    if (!recordedCourses.length) {
      setSelectedCourseId(null)
      setSelectedLessonId(null)
      return
    }

    const selectedCourseStillExists = recordedCourses.some((course) => course.id === selectedCourseId)
    const course = selectedCourseStillExists
      ? recordedCourses.find((item) => item.id === selectedCourseId)
      : recordedCourses[0]

    if (!course) return

    const allLessons = course.modules.flatMap((module) => module.lessons ?? [])
    const selectedLessonStillExists = allLessons.some((lesson) => lesson.id === selectedLessonId)

    setSelectedCourseId(course.id)
    setSelectedLessonId(selectedLessonStillExists ? selectedLessonId : allLessons[0]?.id ?? null)
  }, [recordedCourses, selectedCourseId, selectedLessonId])

  const selectedCourse = recordedCourses.find((course) => course.id === selectedCourseId) ?? null
  const selectedLesson = selectedCourse?.modules.flatMap((module) => module.lessons ?? []).find((lesson) => lesson.id === selectedLessonId) ?? null
  const totalLessons = recordedCourses.reduce((sum, course) => sum + course.modules.reduce((moduleSum, module) => moduleSum + (module.lessons?.length ?? 0), 0), 0)
  const completedLessons = recordedCourses.reduce(
    (sum, course) => sum + course.modules.reduce((moduleSum, module) => moduleSum + (module.lessons?.filter((lesson) => lesson.progress?.completed).length ?? 0), 0),
    0,
  )

  const syncProgressMutation = useMutation({
    mutationFn: ({ lessonId, watchedSeconds }: { lessonId: string; watchedSeconds: number }) =>
      api.post(`/elearning/lessons/${lessonId}/progress`, { watchedSeconds }).then((response) => response.data),
    onSuccess: (data, variables) => {
      qc.setQueryData<RecordedCourse[]>(['recorded-courses'], (current) =>
        updateRecordedCoursesProgress(current, variables.lessonId, data),
      )
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to sync lesson progress')
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <Skeleton className="h-[560px] rounded-xl" />
        <Skeleton className="h-[560px] rounded-xl" />
      </div>
    )
  }

  if (!recordedCourses.length || !selectedCourse || !selectedLesson) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium">No recorded lessons are available yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">You will see published course recordings here once your teacher adds them and you are enrolled.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
      <aside className="space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Recorded Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a course and lesson to continue learning.</p>
        </div>

        <div className="space-y-3">
          {recordedCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => {
                setSelectedCourseId(course.id)
                setSelectedLessonId(course.modules.flatMap((module) => module.lessons ?? [])[0]?.id ?? null)
              }}
              className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                course.id === selectedCourseId
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border/70 bg-secondary/20 hover:border-primary/25 hover:bg-secondary/35'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{course.title}</p>
                  {course.level ? <p className="mt-1 text-xs text-muted-foreground">{course.level}</p> : null}
                </div>
                <Badge variant="outline">{Math.round(course.enrollmentProgress)}%</Badge>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
          <p className="text-sm font-medium">{selectedCourse.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.description || 'No course description provided.'}</p>
          <div className="mt-4 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, selectedCourse.enrollmentProgress))}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Course progress: {Math.round(selectedCourse.enrollmentProgress)}%</p>
          <p className="mt-2 text-xs text-muted-foreground">{completedLessons} of {totalLessons} recorded lessons completed.</p>
        </div>
      </aside>

      <div className="space-y-6">
        <section className="rounded-xl border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={selectedLesson.progress?.completed ? 'success' : 'secondary'}>
                  {selectedLesson.progress?.completed ? 'Completed' : 'In progress'}
                </Badge>
                <span className="text-sm text-muted-foreground">{detectVideoSource(selectedLesson.videoUrl || '').provider.toUpperCase()}</span>
              </div>
              <h2 className="text-2xl font-semibold">{selectedLesson.title}</h2>
              {selectedLesson.content ? <p className="max-w-3xl text-sm text-muted-foreground">{selectedLesson.content}</p> : null}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>{selectedLesson.duration} min</span>
                <span>Watched {selectedLesson.progress?.timeSpent ?? 0} min</span>
                {selectedLesson.videoUrl ? (
                  <a href={selectedLesson.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    Source link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <RecordedLessonPlayer
              lesson={selectedLesson}
              onSync={async (watchedSeconds) => {
                await syncProgressMutation.mutateAsync({ lessonId: selectedLesson.id, watchedSeconds })
              }}
            />
          </div>
        </section>

        <section className="rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Lesson Queue</h3>
          </div>
          <div className="mt-4 space-y-5">
            {selectedCourse.modules.map((module) => (
              <div key={module.id} className="space-y-3">
                <div>
                  <p className="font-medium">{module.title}</p>
                  {module.description ? <p className="text-sm text-muted-foreground">{module.description}</p> : null}
                </div>
                <div className="space-y-2">
                  {module.lessons?.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        lesson.id === selectedLessonId
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border/70 bg-secondary/20 hover:border-primary/25'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-sm text-muted-foreground">{lesson.duration} min</p>
                      </div>
                      <Badge variant={lesson.progress?.completed ? 'success' : 'outline'}>
                        {lesson.progress?.completed ? 'Done' : `${lesson.progress?.timeSpent ?? 0} min`}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StudentQuizWorkspace({
  quiz,
  tabLabel,
}: {
  quiz: Quiz | null
  tabLabel: string
}) {
  const qc = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})

  const { data: quizDetail, isLoading } = useQuery<Quiz>({
    queryKey: ['student-quiz', quiz?.id],
    queryFn: () => api.get(`/elearning/quizzes/${quiz?.id}`).then((response) => response.data),
    enabled: Boolean(quiz?.id),
  })

  const { data: attempts = [] } = useQuery({
    queryKey: ['student-quiz-attempts', quiz?.id],
    queryFn: () => api.get(`/elearning/quizzes/${quiz?.id}/attempts`).then((response) => response.data),
    enabled: Boolean(quiz?.id),
  })

  useEffect(() => {
    if (!quizDetail?.activeAttempt?.answers?.length) {
      setAnswers({})
      return
    }

    const mapped = Object.fromEntries(
      quizDetail.activeAttempt.answers.map((answer) => [answer.questionId, answer.answer]),
    )
    setAnswers(mapped)
  }, [quizDetail?.activeAttempt?.id])

  const startQuizMutation = useMutation({
    mutationFn: (quizId: string) => api.post(`/elearning/quizzes/${quizId}/start`).then((response) => response.data),
    onSuccess: async (_, quizId) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['student-quizzes'] }),
        qc.invalidateQueries({ queryKey: ['student-quiz', quizId] }),
        qc.invalidateQueries({ queryKey: ['student-quiz-attempts', quizId] }),
      ])
      toast.success('Quiz attempt started')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to start quiz'),
  })

  const submitQuizMutation = useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: { answers: Array<{ questionId: string; answer: string | boolean }> } }) =>
      api.post(`/elearning/quizzes/${quizId}/submit`, payload).then((response) => response.data),
    onSuccess: async (_, variables) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['student-quizzes'] }),
        qc.invalidateQueries({ queryKey: ['student-quiz', variables.quizId] }),
        qc.invalidateQueries({ queryKey: ['student-quiz-attempts', variables.quizId] }),
      ])
      toast.success('Quiz submitted')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to submit quiz'),
  })

  if (!quiz) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium">Select a {tabLabel.toLowerCase()} to continue.</p>
      </div>
    )
  }

  if (isLoading || !quizDetail) {
    return <Skeleton className="h-[520px] rounded-xl" />
  }

  const activeAttempt = quizDetail.activeAttempt
  const resultsReleased = quizDetail.resultsReleased
  const latestAttempt = quizDetail.latestAttempt

  return (
    <section className="space-y-5 rounded-xl border p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={quizDetail.status === 'PUBLISHED' ? 'success' : quizDetail.status === 'CLOSED' ? 'outline' : 'secondary'}>
            {quizDetail.status}
          </Badge>
          <Badge variant="outline">{quizDetail.gradeSinkType === 'NONE' ? 'Practice' : quizDetail.gradeSinkType}</Badge>
          {quizDetail.resultsReleased ? <Badge variant="success">Results released</Badge> : <Badge variant="secondary">Results hidden until close</Badge>}
        </div>
        <h2 className="text-2xl font-semibold">{quizDetail.title}</h2>
        {quizDetail.description ? <p className="max-w-3xl text-sm text-muted-foreground">{quizDetail.description}</p> : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {quizDetail.course?.title ? <span>Course: {quizDetail.course.title}</span> : null}
          {quizDetail.subject?.name ? <span>Subject: {quizDetail.subject.name}</span> : null}
          <span>{quizDetail.questionCount} questions</span>
          {quizDetail.durationMinutes ? <span>{quizDetail.durationMinutes} min timer</span> : null}
          {quizDetail.attemptLimit ? <span>{quizDetail.attemptsCount ?? 0}/{quizDetail.attemptLimit} attempts used</span> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-secondary/15 p-4 text-sm text-muted-foreground">
        {activeAttempt ? (
          <div className="flex flex-wrap items-center gap-3">
            <Timer className="h-4 w-4 text-primary" />
            <span>Attempt #{activeAttempt.attemptNumber} in progress</span>
            {activeAttempt.deadlineAt ? <span>Deadline: {formatDate(activeAttempt.deadlineAt)}</span> : null}
          </div>
        ) : quizDetail.isAvailable ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>The quiz is open. Start an attempt when ready.</span>
            <Button className="rounded-xl" onClick={() => startQuizMutation.mutate(quizDetail.id)} disabled={startQuizMutation.isPending}>
              {startQuizMutation.isPending ? 'Starting...' : 'Start quiz'}
            </Button>
          </div>
        ) : (
          <span>
            {quizDetail.status === 'CLOSED'
              ? 'This quiz has been closed.'
              : quizDetail.availableFrom
                ? `Opens ${formatDate(quizDetail.availableFrom)}`
                : 'This quiz is not available right now.'}
          </span>
        )}
      </div>

      {quizDetail.questions?.length ? (
        <div className="space-y-4">
          {quizDetail.questions.map((question, index) => (
            <div key={question.id} className="rounded-3xl border border-border/70 bg-secondary/15 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{index + 1}. {question.prompt}</p>
                <Badge variant="outline">{question.points} pt</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {(question.options ?? []).map((option) => (
                  <label key={`${question.id}-${option.id}`} className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 text-sm">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={String(answers[question.id] ?? '') === option.id}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: question.type === 'TRUE_FALSE' ? option.id === 'true' : option.id }))}
                      disabled={!activeAttempt}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {activeAttempt ? (
            <Button
              className="h-11 w-full rounded-2xl"
              onClick={() =>
                submitQuizMutation.mutate({
                  quizId: quizDetail.id,
                  payload: {
                    answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
                  },
                })
              }
              disabled={submitQuizMutation.isPending}
            >
              {submitQuizMutation.isPending ? 'Submitting...' : 'Submit quiz'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {latestAttempt?.completedAt && !resultsReleased ? (
        <div className="rounded-3xl border border-border/70 bg-secondary/15 px-4 py-3 text-sm text-muted-foreground">
          Your latest attempt has been received. Results will remain hidden until the quiz closes.
        </div>
      ) : null}

      {resultsReleased ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Attempt history</h3>
          <div className="space-y-3">
            {attempts.map((attempt: any) => (
              <div key={attempt.id} className="rounded-3xl border border-border/70 bg-secondary/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Attempt #{attempt.attemptNumber}</Badge>
                    <Badge variant={attempt.passed ? 'success' : 'destructive'}>
                      {attempt.score ?? 0}% {attempt.passed ? 'Passed' : 'Not passed'}
                    </Badge>
                  </div>
                  {attempt.officialScoreApplied ? <Badge variant="secondary">Official latest score</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submitted {attempt.completedAt ? formatDate(attempt.completedAt) : 'In progress'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StudentQuizHub() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)

  const { data: quizzes = [], isLoading } = useQuery<Quiz[]>({
    queryKey: ['student-quizzes'],
    queryFn: () => api.get('/elearning/quizzes').then((response) => response.data),
  })

  useEffect(() => {
    if (!quizzes.length) {
      setSelectedQuizId(null)
      return
    }

    if (!selectedQuizId || !quizzes.some((quiz) => quiz.id === selectedQuizId)) {
      setSelectedQuizId(quizzes[0].id)
    }
  }, [quizzes, selectedQuizId])

  const courseQuizzes = quizzes.filter((quiz) => quiz.placement === 'LESSON')
  const academicQuizzes = quizzes.filter((quiz) => quiz.placement === 'ACADEMIC')
  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) ?? null

  const renderQuizList = (items: Quiz[]) => (
    <div className="space-y-3">
      {items.map((quiz) => (
        <button
          key={quiz.id}
          type="button"
          onClick={() => setSelectedQuizId(quiz.id)}
          className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
            quiz.id === selectedQuizId
              ? 'border-primary/40 bg-primary/10'
              : 'border-border/70 bg-secondary/20 hover:border-primary/25 hover:bg-secondary/35'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{quiz.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {quiz.course?.title ?? quiz.subject?.name ?? 'Quiz'}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={quiz.isAvailable ? 'success' : quiz.status === 'CLOSED' ? 'outline' : 'secondary'}>
                {quiz.isAvailable ? 'Open' : quiz.status}
              </Badge>
              {quiz.resultsReleased && quiz.latestAttempt?.score !== null ? (
                <Badge variant={quiz.latestAttempt?.passed ? 'success' : 'destructive'}>
                  {Math.round(quiz.latestAttempt?.score ?? 0)}%
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{quiz.questionCount} questions</span>
            {quiz.durationMinutes ? <span>{quiz.durationMinutes} min</span> : null}
            {quiz.attemptsCount !== undefined ? <span>{quiz.attemptsCount} attempts logged</span> : null}
          </div>
        </button>
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="course" className="space-y-6">
      <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
        <TabsTrigger className="rounded-2xl px-5 py-2.5" value="course">
          <CircleHelp className="mr-2 h-4 w-4" />
          Course quizzes
        </TabsTrigger>
        <TabsTrigger className="rounded-2xl px-5 py-2.5" value="academic">
          <Timer className="mr-2 h-4 w-4" />
          Academic assessments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="course">
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <aside className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold">Course quizzes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lesson-linked quizzes from your enrolled courses.</p>
            <div className="mt-4">
              {courseQuizzes.length ? renderQuizList(courseQuizzes) : (
                <div className="rounded-3xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                  No course quizzes are available yet.
                </div>
              )}
            </div>
          </aside>
          <StudentQuizWorkspace quiz={selectedQuiz?.placement === 'LESSON' ? selectedQuiz : courseQuizzes[0] ?? null} tabLabel="course quiz" />
        </div>
      </TabsContent>

      <TabsContent value="academic">
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <aside className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold">Academic assessments</h2>
            <p className="mt-1 text-sm text-muted-foreground">Standalone timed assessments assigned through your class subject enrollments.</p>
            <div className="mt-4">
              {academicQuizzes.length ? renderQuizList(academicQuizzes) : (
                <div className="rounded-3xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                  No academic assessments are available yet.
                </div>
              )}
            </div>
          </aside>
          <StudentQuizWorkspace quiz={selectedQuiz?.placement === 'ACADEMIC' ? selectedQuiz : academicQuizzes[0] ?? null} tabLabel="academic assessment" />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function StudentLearningHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Digital learning"
        title="E-Learning"
        description="Watch lessons, take quizzes, and track your academic progress."
      />

      <Tabs defaultValue="recorded" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recorded">
            <Video className="mr-2 h-4 w-4" />
            Recorded lessons
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <CircleHelp className="mr-2 h-4 w-4" />
            Quizzes & assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recorded">
          <StudentRecordedLessons />
        </TabsContent>
        <TabsContent value="quizzes">
          <StudentQuizHub />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ELearningPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const isStudent = role === 'STUDENT'

  const { data: liveClasses = [], isLoading } = useQuery({
    queryKey: ['live-classes'],
    queryFn: () => api.get('/elearning/live-classes').then((response) => response.data),
    enabled: !isStudent,
  })
  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.get('/elearning/submissions').then((response) => response.data),
    enabled: !isStudent,
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((response) => response.data),
    enabled: !isStudent,
  })

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<LiveClassForm>({
    resolver: zodResolver(liveClassSchema) as any,
  })

  const mutation = useMutation({
    mutationFn: (data: LiveClassForm) => api.post('/elearning/live-classes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-classes'] })
      toast.success('Class scheduled')
      setOpen(false)
      reset()
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed'),
  })

  const liveNow = liveClasses.filter((liveClass: any) => liveClass.status === 'LIVE').length

  const classColumns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'platform', header: 'Platform' },
    { accessorKey: 'scheduledAt', header: 'Scheduled', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'duration', header: 'Duration', cell: ({ getValue }) => `${getValue()} min` },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <Badge variant={statusVariant[getValue() as string]}>{getValue() as string}</Badge> },
    {
      id: 'join',
      cell: ({ row }) =>
        row.original.meetingUrl ? (
          <a href={row.original.meetingUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="rounded-xl">
              <ExternalLink className="mr-1 h-3 w-3" />
              Join
            </Button>
          </a>
        ) : null,
    },
  ]

  const submissionColumns: ColumnDef<any>[] = [
    { accessorKey: 'studentId', header: 'Student' },
    { accessorKey: 'submittedAt', header: 'Submitted', cell: ({ getValue }) => formatDate(getValue() as string) },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string
        return <Badge variant={status === 'GRADED' ? 'success' : status === 'LATE' ? 'destructive' : 'secondary'}>{status}</Badge>
      },
    },
    { accessorKey: 'grade', header: 'Grade', cell: ({ getValue }) => getValue() ?? '—' },
  ]

  if (isStudent) {
    return <StudentLearningHub />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live learning"
        title="E-Learning"
        description="Coordinate live classes and track learner submissions."
        stats={[
          { label: 'Live classes', value: liveClasses.length },
          { label: 'Live now', value: liveNow },
          { label: 'Submissions', value: submissions.length },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
        <h2 className="text-lg font-semibold">Live Classes</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-xl px-5">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Class
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle>Schedule Live Class</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input className="h-11 rounded-2xl" {...register('title')} placeholder="Math Live Session" />
              </div>
              <div className="space-y-1">
                <Label>Teacher</Label>
                <Select onValueChange={(value) => setValue('teacherId', value)}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Date & Time</Label>
                  <Input className="h-11 rounded-2xl" type="datetime-local" {...register('scheduledAt')} />
                </div>
                <div className="space-y-1">
                  <Label>Duration (min)</Label>
                  <Input className="h-11 rounded-2xl" type="number" {...register('duration')} defaultValue={60} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Platform</Label>
                  <Select onValueChange={(value) => setValue('platform', value)}>
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zoom">Zoom</SelectItem>
                      <SelectItem value="Google Meet">Google Meet</SelectItem>
                      <SelectItem value="Teams">Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Meeting URL</Label>
                  <Input className="h-11 rounded-2xl" {...register('meetingUrl')} placeholder="https://..." />
                </div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling...' : 'Schedule'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70">
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="live">
            <Video className="mr-2 h-4 w-4" />
            Live Classes
          </TabsTrigger>
          <TabsTrigger className="rounded-2xl px-5 py-2.5" value="submissions">Submissions</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          <DataTable data={liveClasses} columns={classColumns} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="submissions">
          <DataTable data={submissions} columns={submissionColumns} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
