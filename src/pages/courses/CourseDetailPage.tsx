import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CircleHelp,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuizComposer } from '@/components/elearning/QuizComposer'
import api from '@/lib/api'
import { detectVideoSource } from '@/lib/video'
import type {
  AcademicYear,
  Course,
  CourseModule,
  Lesson,
  Quiz,
  QuizCreatePayload,
  QuizUpdatePayload,
  Term,
} from '@/types'

const moduleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type ModuleFormValues = z.infer<typeof moduleSchema>
type LessonType = 'VIDEO' | 'QUIZ'

type LessonDraft = {
  type: LessonType
  title: string
  content: string
  videoUrl: string
  duration: number
  quiz: QuizCreatePayload
}

type LessonEditorState =
  | { open: false }
  | {
      open: true
      mode: 'create' | 'edit'
      moduleId: string
      lesson?: Lesson
      quiz?: Quiz | null
      draft: LessonDraft
    }

function emptyQuizDraft(): QuizCreatePayload {
  return {
    placement: 'LESSON',
    title: '',
    description: '',
    durationMinutes: 20,
    attemptLimit: 1,
    passMark: 70,
    gradeSinkType: 'NONE',
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

function makeLessonDraft(lesson?: Lesson, quiz?: Quiz | null): LessonDraft {
  const type = lesson?.type === 'QUIZ' ? 'QUIZ' : 'VIDEO'
  return {
    type,
    title: lesson?.title ?? '',
    content: lesson?.content ?? '',
    videoUrl: lesson?.videoUrl ?? '',
    duration: lesson?.duration ?? 10,
    quiz: quiz
      ? {
          placement: 'LESSON',
          lessonId: lesson?.id,
          title: quiz.title,
          description: quiz.description ?? '',
          durationMinutes: quiz.durationMinutes ?? 20,
          attemptLimit: quiz.attemptLimit ?? 1,
          passMark: quiz.passMark,
          availableFrom: toDateTimeLocalValue(quiz.availableFrom),
          availableUntil: toDateTimeLocalValue(quiz.availableUntil),
          gradeSinkType: quiz.gradeSinkType,
          termId: quiz.termId ?? undefined,
          academicYearId: quiz.academicYearId ?? undefined,
          subjectId: quiz.subjectId ?? undefined,
          questions: (quiz.questions ?? []).map((question) => ({
            ...question,
            correctAnswer:
              question.type === 'TRUE_FALSE'
                ? Boolean(question.correctAnswer)
                : String(question.correctAnswer ?? ''),
          })),
        }
      : emptyQuizDraft(),
  }
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function ModuleDialog({
  title,
  initialValues,
  open,
  onOpenChange,
  onSubmit,
  trigger,
}: {
  title: string
  initialValues: ModuleFormValues
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ModuleFormValues) => Promise<void>
  trigger: React.ReactNode
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: initialValues,
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      reset(initialValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values)
            handleOpenChange(false)
          })}
        >
          <div className="space-y-2">
            <Label>Module title</Label>
            <Input className="h-11 rounded-2xl" {...register('title')} />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="min-h-[110px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('description')}
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save module'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LessonDialog({
  state,
  course,
  academicYears,
  terms,
  onOpenChange,
  onSubmit,
}: {
  state: LessonEditorState
  course: Course
  academicYears: AcademicYear[]
  terms: Term[]
  onOpenChange: (next: LessonEditorState) => void
  onSubmit: (draft: LessonDraft, context: { mode: 'create' | 'edit'; moduleId: string; lesson?: Lesson; quiz?: Quiz | null }) => Promise<void>
}) {
  if (!state.open) {
    return null
  }

  const draft = state.draft
  const videoPreview = detectVideoSource(draft.videoUrl || '')
  const hasCourseSubject = Boolean(course.subjectId)
  const quizLesson = draft.type === 'QUIZ'
  const gradedWithoutSubject = quizLesson && draft.quiz.gradeSinkType !== 'NONE' && !hasCourseSubject

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => onOpenChange(open ? state : { open: false })}
    >
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{state.mode === 'create' ? 'Add lesson' : 'Edit lesson'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[180px,1fr]">
            <div className="space-y-2">
              <Label>Lesson type</Label>
              <Select
                value={draft.type}
                onValueChange={(next) =>
                  onOpenChange({
                    ...state,
                    draft: {
                      ...draft,
                      type: next as LessonType,
                    },
                  })
                }
                disabled={state.mode === 'edit'}
              >
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Recorded video</SelectItem>
                  <SelectItem value="QUIZ">Quiz lesson</SelectItem>
                </SelectContent>
              </Select>
              {state.mode === 'edit' ? <p className="text-xs text-muted-foreground">Lesson type is fixed after creation.</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Lesson title</Label>
              <Input
                className="h-11 rounded-2xl"
                value={draft.title}
                onChange={(event) =>
                  onOpenChange({
                    ...state,
                    draft: {
                      ...draft,
                      title: event.target.value,
                      quiz: quizLesson
                        ? { ...draft.quiz, title: event.target.value }
                        : draft.quiz,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{quizLesson ? 'Lesson intro / instructions' : 'Description / lesson notes'}</Label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={draft.content}
              onChange={(event) =>
                onOpenChange({
                  ...state,
                  draft: {
                    ...draft,
                    content: event.target.value,
                    quiz: quizLesson
                      ? { ...draft.quiz, description: event.target.value }
                      : draft.quiz,
                  },
                })
              }
            />
          </div>

          {quizLesson ? (
            <>
              {gradedWithoutSubject ? (
                <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  This course has no linked subject. Keep the quiz as practice-only or link the course to a subject before choosing assignment/examination grading.
                </div>
              ) : null}
              <QuizComposer
                value={{ ...draft.quiz, placement: 'LESSON', title: draft.title, description: draft.content }}
                onChange={(next) =>
                  onOpenChange({
                    ...state,
                    draft: {
                      ...draft,
                      quiz: { ...next, placement: 'LESSON', title: draft.title, description: draft.content },
                    },
                  })
                }
                lessonSubject={course.subject ?? null}
                academicYears={academicYears}
                terms={terms}
                hideCoreFields
                lockedPlacement="LESSON"
              />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-[1fr,180px]">
                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    value={draft.videoUrl}
                    placeholder="https://..."
                    onChange={(event) =>
                      onOpenChange({
                        ...state,
                        draft: {
                          ...draft,
                          videoUrl: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    type="number"
                    min={1}
                    value={draft.duration}
                    onChange={(event) =>
                      onOpenChange({
                        ...state,
                        draft: {
                          ...draft,
                          duration: Number(event.target.value) || 1,
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="rounded-3xl border border-border/70 bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
                Video source detected: <span className="font-medium text-foreground">{videoPreview.provider.toUpperCase()}</span>
              </div>
            </>
          )}

          <Button
            className="h-11 w-full rounded-2xl"
            disabled={!draft.title.trim() || gradedWithoutSubject}
            onClick={async () => {
              await onSubmit(draft, {
                mode: state.mode,
                moduleId: state.moduleId,
                lesson: state.lesson,
                quiz: state.quiz,
              })
              onOpenChange({ open: false })
            }}
          >
            Save lesson
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [createModuleOpen, setCreateModuleOpen] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [lessonEditor, setLessonEditor] = useState<LessonEditorState>({ open: false })

  const courseId = id ?? ''

  const { data: course, isLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((response) => response.data),
    enabled: Boolean(courseId),
  })

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then((response) => response.data),
  })

  const { data: terms = [] } = useQuery<Term[]>({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then((response) => response.data),
  })

  const invalidateCourse = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['course', courseId] }),
      qc.invalidateQueries({ queryKey: ['courses'] }),
      qc.invalidateQueries({ queryKey: ['quizzes'] }),
    ])
  }

  const createModuleMutation = useMutation({
    mutationFn: (payload: ModuleFormValues) => api.post(`/courses/${courseId}/modules`, payload).then((response) => response.data),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Module created')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create module'),
  })

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, payload }: { moduleId: string; payload: Partial<ModuleFormValues> }) =>
      api.put(`/courses/${courseId}/modules/${moduleId}`, payload).then((response) => response.data),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Module updated')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update module'),
  })

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => api.delete(`/courses/${courseId}/modules/${moduleId}`),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Module deleted')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete module'),
  })

  const reorderModulesMutation = useMutation({
    mutationFn: (moduleIds: string[]) => api.put(`/courses/${courseId}/modules/reorder`, { moduleIds }),
    onSuccess: async () => {
      await invalidateCourse()
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to reorder modules'),
  })

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, payload }: { moduleId: string; payload: any }) =>
      api.post(`/courses/${courseId}/modules/${moduleId}/lessons`, payload).then((response) => response.data),
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create lesson'),
  })

  const updateLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonId, payload }: { moduleId: string; lessonId: string; payload: any }) =>
      api.put(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, payload).then((response) => response.data),
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update lesson'),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      api.delete(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Lesson deleted')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to delete lesson'),
  })

  const reorderLessonsMutation = useMutation({
    mutationFn: ({ moduleId, lessonIds }: { moduleId: string; lessonIds: string[] }) =>
      api.put(`/courses/${courseId}/modules/${moduleId}/lessons/reorder`, { lessonIds }),
    onSuccess: async () => {
      await invalidateCourse()
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to reorder lessons'),
  })

  const createQuizMutation = useMutation({
    mutationFn: (payload: QuizCreatePayload) => api.post('/elearning/quizzes', payload).then((response) => response.data),
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to create quiz'),
  })

  const updateQuizMutation = useMutation({
    mutationFn: ({ quizId, payload }: { quizId: string; payload: QuizUpdatePayload }) =>
      api.put(`/elearning/quizzes/${quizId}`, payload).then((response) => response.data),
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to update quiz'),
  })

  const publishQuizMutation = useMutation({
    mutationFn: (quizId: string) => api.post(`/elearning/quizzes/${quizId}/publish`).then((response) => response.data),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Quiz published')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to publish quiz'),
  })

  const closeQuizMutation = useMutation({
    mutationFn: (quizId: string) => api.post(`/elearning/quizzes/${quizId}/close`).then((response) => response.data),
    onSuccess: async () => {
      await invalidateCourse()
      toast.success('Quiz closed')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Failed to close quiz'),
  })

  const moveModule = (moduleId: string, direction: -1 | 1) => {
    if (!course?.modules) return
    const currentIndex = course.modules.findIndex((module) => module.id === moduleId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= course.modules.length) return

    const moduleIds = [...course.modules.map((module) => module.id)]
    ;[moduleIds[currentIndex], moduleIds[nextIndex]] = [moduleIds[nextIndex], moduleIds[currentIndex]]
    reorderModulesMutation.mutate(moduleIds)
  }

  const moveLesson = (module: CourseModule, lessonId: string, direction: -1 | 1) => {
    if (!module.lessons?.length) return
    const currentIndex = module.lessons.findIndex((lesson) => lesson.id === lessonId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= module.lessons.length) return

    const lessonIds = [...module.lessons.map((lesson) => lesson.id)]
    ;[lessonIds[currentIndex], lessonIds[nextIndex]] = [lessonIds[nextIndex], lessonIds[currentIndex]]
    reorderLessonsMutation.mutate({ moduleId: module.id, lessonIds })
  }

  const openCreateLesson = (moduleId: string, type: LessonType) => {
    setLessonEditor({
      open: true,
      mode: 'create',
      moduleId,
      draft: {
        ...makeLessonDraft(),
        type,
      },
    })
  }

  const openEditLesson = (moduleId: string, lesson: Lesson) => {
    const quiz = lesson.quizzes?.[0] ?? null
    setLessonEditor({
      open: true,
      mode: 'edit',
      moduleId,
      lesson,
      quiz,
      draft: makeLessonDraft(lesson, quiz),
    })
  }

  const saveLesson = async (
    draft: LessonDraft,
    context: { mode: 'create' | 'edit'; moduleId: string; lesson?: Lesson; quiz?: Quiz | null },
  ) => {
    const normalizedQuizPayload: QuizCreatePayload = {
      ...draft.quiz,
      placement: 'LESSON',
      title: draft.title.trim(),
      description: draft.content.trim() || undefined,
      availableFrom: draft.quiz.availableFrom || undefined,
      availableUntil: draft.quiz.availableUntil || undefined,
    }

    if (context.mode === 'create') {
      if (draft.type === 'VIDEO') {
        await createLessonMutation.mutateAsync({
          moduleId: context.moduleId,
          payload: {
            type: 'VIDEO',
            title: draft.title.trim(),
            content: draft.content.trim() || undefined,
            videoUrl: draft.videoUrl.trim(),
            duration: draft.duration,
          },
        })
        await invalidateCourse()
        toast.success('Recorded lesson created')
        return
      }

      const lesson = await createLessonMutation.mutateAsync({
        moduleId: context.moduleId,
        payload: {
          type: 'QUIZ',
          title: draft.title.trim(),
          content: draft.content.trim() || undefined,
        },
      })

      await createQuizMutation.mutateAsync({
        ...normalizedQuizPayload,
        lessonId: lesson.id,
      })

      await invalidateCourse()
      toast.success('Quiz lesson created')
      return
    }

    if (!context.lesson) return

    if (draft.type === 'VIDEO') {
      await updateLessonMutation.mutateAsync({
        moduleId: context.moduleId,
        lessonId: context.lesson.id,
        payload: {
          title: draft.title.trim(),
          content: draft.content.trim() || undefined,
          videoUrl: draft.videoUrl.trim(),
          duration: draft.duration,
        },
      })
      await invalidateCourse()
      toast.success('Lesson updated')
      return
    }

    await updateLessonMutation.mutateAsync({
      moduleId: context.moduleId,
      lessonId: context.lesson.id,
      payload: {
        title: draft.title.trim(),
        content: draft.content.trim() || undefined,
      },
    })

    if (context.quiz) {
      await updateQuizMutation.mutateAsync({
        quizId: context.quiz.id,
        payload: normalizedQuizPayload,
      })
    } else {
      await createQuizMutation.mutateAsync({
        ...normalizedQuizPayload,
        lessonId: context.lesson.id,
      })
    }

    await invalidateCourse()
    toast.success('Quiz lesson updated')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-56 rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <div className="rounded-xl border border-border/70 bg-card p-6">
          <h1 className="text-xl font-semibold">Course not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <LessonDialog
        state={lessonEditor}
        course={course}
        academicYears={academicYears}
        terms={terms}
        onOpenChange={setLessonEditor}
        onSubmit={saveLesson}
      />

      <div className="space-y-3">
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <div className="rounded-xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{course.title}</h1>
                <Badge variant={course.isPublished ? 'success' : 'secondary'}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              {course.description ? <p className="max-w-3xl text-sm text-muted-foreground">{course.description}</p> : null}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {course.level ? <span>{course.level}</span> : null}
                {course.duration ? <span>{course.duration}h total course duration</span> : null}
                <span>{course.modules?.length ?? 0} modules</span>
                {course.subject ? <span>Subject: {course.subject.name}</span> : <span>No subject linked</span>}
              </div>
            </div>

            <ModuleDialog
              title="Create module"
              initialValues={{ title: '', description: '' }}
              open={createModuleOpen}
              onOpenChange={setCreateModuleOpen}
              onSubmit={async (values) => {
                await createModuleMutation.mutateAsync(values)
              }}
              trigger={
                <Button className="h-10 rounded-xl px-5">
                  <Plus className="mr-2 h-4 w-4" />
                  Add module
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {course.modules?.length ? course.modules.map((module, moduleIndex) => {
          const isEditingModule = editingModuleId === module.id
          const lessons = module.lessons ?? []

          return (
            <section key={module.id} className="rounded-[30px] border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Module {module.order}</Badge>
                    <h2 className="text-lg font-semibold">{module.title}</h2>
                  </div>
                  {module.description ? <p className="text-sm text-muted-foreground">{module.description}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => moveModule(module.id, -1)} disabled={moduleIndex === 0 || reorderModulesMutation.isPending}>
                    <ArrowUp className="mr-2 h-3.5 w-3.5" />
                    Up
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => moveModule(module.id, 1)} disabled={moduleIndex === (course.modules?.length ?? 0) - 1 || reorderModulesMutation.isPending}>
                    <ArrowDown className="mr-2 h-3.5 w-3.5" />
                    Down
                  </Button>

                  <ModuleDialog
                    title="Edit module"
                    initialValues={{ title: module.title, description: module.description || '' }}
                    open={isEditingModule}
                    onOpenChange={(open) => setEditingModuleId(open ? module.id : null)}
                    onSubmit={async (values) => {
                      await updateModuleMutation.mutateAsync({ moduleId: module.id, payload: values })
                    }}
                    trigger={
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    }
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete module "${module.title}" and its lessons?`)) {
                        deleteModuleMutation.mutate(module.id)
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </Button>

                  <Button size="sm" className="rounded-xl" onClick={() => openCreateLesson(module.id, 'VIDEO')}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Video lesson
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openCreateLesson(module.id, 'QUIZ')}>
                    <CircleHelp className="mr-2 h-3.5 w-3.5" />
                    Quiz lesson
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {lessons.length ? lessons.map((lesson, lessonIndex) => {
                  const quiz = lesson.quizzes?.[0] ?? null
                  const isQuizLesson = lesson.type === 'QUIZ'

                  return (
                    <div key={lesson.id} className="rounded-3xl border border-border/70 bg-secondary/25 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">Lesson {lesson.order}</Badge>
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                              {isQuizLesson ? <CircleHelp className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                              {lesson.title}
                            </span>
                            <Badge variant={isQuizLesson ? 'outline' : 'secondary'}>
                              {lesson.type}
                            </Badge>
                            {quiz ? (
                              <Badge variant={quiz.status === 'PUBLISHED' ? 'success' : quiz.status === 'CLOSED' ? 'outline' : 'secondary'}>
                                {quiz.status}
                              </Badge>
                            ) : null}
                          </div>
                          {lesson.content ? <p className="text-sm text-muted-foreground">{lesson.content}</p> : null}
                          {isQuizLesson && quiz ? (
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span>{quiz.questionCount} questions</span>
                              <span>{quiz.gradeSinkType === 'NONE' ? 'Practice quiz' : quiz.gradeSinkType}</span>
                              {quiz.availableFrom ? <span>Opens {new Date(quiz.availableFrom).toLocaleString()}</span> : null}
                              {quiz.availableUntil ? <span>Closes {new Date(quiz.availableUntil).toLocaleString()}</span> : null}
                            </div>
                          ) : null}
                          {!isQuizLesson ? (
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span>{lesson.duration} min</span>
                              <span>{detectVideoSource(lesson.videoUrl || '').provider.toUpperCase()}</span>
                              {lesson.videoUrl ? (
                                <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                                  Open source URL
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => moveLesson(module, lesson.id, -1)} disabled={lessonIndex === 0 || reorderLessonsMutation.isPending}>
                            <ArrowUp className="mr-2 h-3.5 w-3.5" />
                            Up
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => moveLesson(module, lesson.id, 1)} disabled={lessonIndex === lessons.length - 1 || reorderLessonsMutation.isPending}>
                            <ArrowDown className="mr-2 h-3.5 w-3.5" />
                            Down
                          </Button>

                          {isQuizLesson && quiz?.status === 'DRAFT' ? (
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => publishQuizMutation.mutate(quiz.id)} disabled={publishQuizMutation.isPending}>
                              Publish
                            </Button>
                          ) : null}
                          {isQuizLesson && quiz?.status === 'PUBLISHED' ? (
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => closeQuizMutation.mutate(quiz.id)} disabled={closeQuizMutation.isPending}>
                              Close
                            </Button>
                          ) : null}

                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEditLesson(module.id, lesson)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
                                deleteLessonMutation.mutate({ moduleId: module.id, lessonId: lesson.id })
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="rounded-3xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
                    No lessons in this module yet.
                  </div>
                )}
              </div>
            </section>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-sm text-muted-foreground">
            This course has no modules yet. Create the first module to start adding video and quiz lessons.
          </div>
        )}
      </div>
    </div>
  )
}
