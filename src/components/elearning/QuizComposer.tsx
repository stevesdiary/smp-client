import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  AcademicYear,
  QuizCreatePayload,
  QuizGradeSinkType,
  QuizPlacement,
  QuizQuestion,
  Subject,
  Term,
} from '@/types'

type QuizComposerProps = {
  value: QuizCreatePayload
  onChange: (next: QuizCreatePayload) => void
  academicYears?: AcademicYear[]
  terms?: Term[]
  subjects?: Subject[]
  lessonSubject?: Subject | null
  showPlacement?: boolean
  lockedPlacement?: QuizPlacement
  hideCoreFields?: boolean
}

function defaultQuestion(index: number): QuizQuestion {
  return {
    id: `q_${index + 1}`,
    prompt: '',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'a', label: 'Option A' },
      { id: 'b', label: 'Option B' },
    ],
    correctAnswer: 'a',
    points: 1,
  }
}

function coerceOptionalNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function QuizComposer({
  value,
  onChange,
  academicYears = [],
  terms = [],
  subjects = [],
  lessonSubject = null,
  showPlacement = false,
  lockedPlacement,
  hideCoreFields = false,
}: QuizComposerProps) {
  const placement = lockedPlacement ?? value.placement
  const isAcademic = placement === 'ACADEMIC'
  const requiresAcademicMeta = isAcademic || value.gradeSinkType !== 'NONE'

  const setValue = <K extends keyof QuizCreatePayload>(key: K, next: QuizCreatePayload[K]) => {
    const merged = { ...value, placement, [key]: next }

    if (placement === 'LESSON') {
      merged.subjectId = lessonSubject?.id
      merged.academicYearId = value.gradeSinkType === 'NONE' ? undefined : lessonSubject?.academicYearId
    }

    onChange(merged)
  }

  const updateQuestion = (index: number, next: QuizQuestion) => {
    onChange({
      ...value,
      placement,
      questions: value.questions.map((question, questionIndex) => (questionIndex === index ? next : question)),
    })
  }

  return (
    <div className="space-y-5">
      {showPlacement ? (
        <div className="space-y-2">
          <Label>Quiz placement</Label>
          <Select value={placement} onValueChange={(next) => onChange({ ...value, placement: next as QuizPlacement })}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Select placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LESSON">Course lesson</SelectItem>
              <SelectItem value="ACADEMIC">Standalone academic assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {hideCoreFields ? (
        <div className="space-y-2">
          <Label>Sink type</Label>
          <Select value={value.gradeSinkType ?? 'NONE'} onValueChange={(next) => setValue('gradeSinkType', next as QuizGradeSinkType)}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue placeholder="Select sink" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Practice only</SelectItem>
              <SelectItem value="ASSIGNMENT">Gradebook assignment</SelectItem>
              <SelectItem value="EXAMINATION">Examination result</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Quiz title</Label>
              <Input className="h-11 rounded-2xl" value={value.title} onChange={(event) => setValue('title', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sink type</Label>
              <Select value={value.gradeSinkType ?? 'NONE'} onValueChange={(next) => setValue('gradeSinkType', next as QuizGradeSinkType)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select sink" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Practice only</SelectItem>
                  <SelectItem value="ASSIGNMENT">Gradebook assignment</SelectItem>
                  <SelectItem value="EXAMINATION">Examination result</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              className="min-h-[110px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={value.description ?? ''}
              onChange={(event) => setValue('description', event.target.value)}
              placeholder="Short introduction or instructions for students"
            />
          </div>
        </>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Duration (min)</Label>
          <Input
            className="h-11 rounded-2xl"
            type="number"
            min={1}
            value={value.durationMinutes ?? ''}
            onChange={(event) => setValue('durationMinutes', coerceOptionalNumber(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Attempt limit</Label>
          <Input
            className="h-11 rounded-2xl"
            type="number"
            min={1}
            value={value.attemptLimit ?? ''}
            onChange={(event) => setValue('attemptLimit', coerceOptionalNumber(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Pass mark</Label>
          <Input
            className="h-11 rounded-2xl"
            type="number"
            min={0}
            max={100}
            value={value.passMark ?? 70}
            onChange={(event) => setValue('passMark', Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Questions</Label>
          <div className="flex h-11 items-center rounded-2xl border border-input px-4 text-sm text-muted-foreground">
            {value.questions.length} configured
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Open from</Label>
          <Input
            className="h-11 rounded-2xl"
            type="datetime-local"
            value={value.availableFrom ?? ''}
            onChange={(event) => setValue('availableFrom', event.target.value || undefined)}
          />
        </div>
        <div className="space-y-2">
          <Label>Close at</Label>
          <Input
            className="h-11 rounded-2xl"
            type="datetime-local"
            value={value.availableUntil ?? ''}
            onChange={(event) => setValue('availableUntil', event.target.value || undefined)}
          />
        </div>
      </div>

      {requiresAcademicMeta ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Academic year</Label>
            {placement === 'LESSON' && lessonSubject?.academicYearId ? (
              <div className="flex h-11 items-center rounded-2xl border border-input px-4 text-sm text-muted-foreground">
                {academicYears.find((year) => year.id === lessonSubject.academicYearId)?.name ?? 'Inherited from course subject'}
              </div>
            ) : (
              <Select value={value.academicYearId} onValueChange={(next) => setValue('academicYearId', next)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Term</Label>
            <Select value={value.termId} onValueChange={(next) => setValue('termId', next)}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms
                  .filter((term) => !value.academicYearId || term.academicYearId === value.academicYearId)
                  .map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            {placement === 'LESSON' && lessonSubject ? (
              <div className="flex h-11 items-center rounded-2xl border border-input px-4 text-sm text-muted-foreground">
                {lessonSubject.name}
              </div>
            ) : (
              <Select value={value.subjectId} onValueChange={(next) => setValue('subjectId', next)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter((subject) => !value.academicYearId || subject.academicYearId === value.academicYearId)
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Questions</h3>
            <p className="text-sm text-muted-foreground">Objective-only v1: multiple choice and true/false.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() =>
              onChange({
                ...value,
                placement,
                questions: [...value.questions, defaultQuestion(value.questions.length)],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add question
          </Button>
        </div>

        <div className="space-y-4">
          {value.questions.map((question, questionIndex) => (
            <div key={`${question.id}-${questionIndex}`} className="rounded-3xl border border-border/70 bg-secondary/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 gap-4 md:grid-cols-[140px,1fr]">
                  <div className="space-y-2">
                    <Label>Question ID</Label>
                    <Input
                      className="h-11 rounded-2xl"
                      value={question.id}
                      onChange={(event) => updateQuestion(questionIndex, { ...question, id: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prompt</Label>
                    <Input
                      className="h-11 rounded-2xl"
                      value={question.prompt}
                      onChange={(event) => updateQuestion(questionIndex, { ...question, prompt: event.target.value })}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:text-destructive"
                  onClick={() =>
                    onChange({
                      ...value,
                      placement,
                      questions: value.questions.filter((_, index) => index !== questionIndex),
                    })
                  }
                  disabled={value.questions.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(next) =>
                      updateQuestion(
                        questionIndex,
                        next === 'TRUE_FALSE'
                          ? {
                              id: question.id,
                              prompt: question.prompt,
                              type: 'TRUE_FALSE',
                              correctAnswer: true,
                              points: question.points,
                            }
                          : {
                              id: question.id,
                              prompt: question.prompt,
                              type: 'MULTIPLE_CHOICE',
                              options: [
                                { id: 'a', label: 'Option A' },
                                { id: 'b', label: 'Option B' },
                              ],
                              correctAnswer: 'a',
                              points: question.points,
                            },
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">Multiple choice</SelectItem>
                      <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    className="h-11 rounded-2xl"
                    type="number"
                    min={1}
                    value={question.points}
                    onChange={(event) => updateQuestion(questionIndex, { ...question, points: Number(event.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Correct answer</Label>
                  {question.type === 'TRUE_FALSE' ? (
                    <Select
                      value={String(Boolean(question.correctAnswer))}
                      onValueChange={(next) => updateQuestion(questionIndex, { ...question, correctAnswer: next === 'true' })}
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={String(question.correctAnswer ?? '')}
                      onValueChange={(next) => updateQuestion(questionIndex, { ...question, correctAnswer: next })}
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        {(question.options ?? []).map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.id.toUpperCase()} · {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {question.type === 'MULTIPLE_CHOICE' ? (
                <div className="mt-4 space-y-3">
                  {(question.options ?? []).map((option, optionIndex) => (
                    <div key={`${option.id}-${optionIndex}`} className="grid gap-3 md:grid-cols-[100px,1fr,auto]">
                      <div className="space-y-2">
                        <Label>Option ID</Label>
                        <Input
                          className="h-11 rounded-2xl"
                          value={option.id}
                          onChange={(event) =>
                            updateQuestion(questionIndex, {
                              ...question,
                              options: (question.options ?? []).map((item, itemIndex) =>
                                itemIndex === optionIndex ? { ...item, id: event.target.value } : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Option label</Label>
                        <Input
                          className="h-11 rounded-2xl"
                          value={option.label}
                          onChange={(event) =>
                            updateQuestion(questionIndex, {
                              ...question,
                              options: (question.options ?? []).map((item, itemIndex) =>
                                itemIndex === optionIndex ? { ...item, label: event.target.value } : item,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl text-destructive hover:text-destructive"
                          onClick={() =>
                            updateQuestion(questionIndex, {
                              ...question,
                              options: (question.options ?? []).filter((_, itemIndex) => itemIndex !== optionIndex),
                            })
                          }
                          disabled={(question.options ?? []).length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      updateQuestion(questionIndex, {
                        ...question,
                        options: [
                          ...(question.options ?? []),
                          {
                            id: String.fromCharCode(97 + (question.options?.length ?? 0)),
                            label: `Option ${String.fromCharCode(65 + (question.options?.length ?? 0))}`,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add option
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
