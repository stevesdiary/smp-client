import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, BookOpen, Users, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { Course } from '@/types'
import { ModuleHero } from '@/components/shared/ModuleHero'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  level: z.string().optional(),
  duration: z.coerce.number().optional().transform(v => v === undefined || isNaN(v as number) ? undefined : Number(v)),
  teacherId: z.string().min(1, 'Required'),
})
type FormData = z.infer<typeof schema>

function CourseForm({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/courses', data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course created'); onSuccess() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input className="h-11 rounded-2xl" {...register('title')} placeholder="Introduction to Mathematics" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input className="h-11 rounded-2xl" {...register('description')} placeholder="Course description..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Level</Label>
          <Select onValueChange={(v) => setValue('level', v)}>
            <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Duration (hours)</Label>
          <Input className="h-11 rounded-2xl" type="number" {...register('duration')} placeholder="40" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Teacher</Label>
        <Select onValueChange={(v) => setValue('teacherId', v)}>
          <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select teacher" /></SelectTrigger>
          <SelectContent>
            {teachers.map((t: any) => (
              <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
      </div>
      <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Course'}
      </Button>
    </form>
  )
}

function CourseCard({ course }: { course: Course }) {
  const qc = useQueryClient()
  const publishMutation = useMutation({
    mutationFn: () => api.put(`/courses/${course.id}`, { isPublished: !course.isPublished }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course updated') },
  })

  return (
    <div className="transition-transform duration-200 ease-out hover:-translate-y-0.5">
      <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 transition-shadow hover:shadow-xl dark:border-white/10 dark:bg-card/85">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
            <Badge variant={course.isPublished ? 'success' : 'secondary'} className="shrink-0">
              {course.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          {course.description && <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {course.level && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.level}</span>}
            {course.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}h</span>}
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course._count?.enrollments ?? 0} enrolled</span>
          </div>
          <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={() => publishMutation.mutate()}>
            {course.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CoursesPage() {
  const [open, setOpen] = useState(false)

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(r => r.data),
  })
  const publishedCourses = courses.filter((course) => course.isPublished).length
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.enrollments ?? 0), 0)

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Digital learning"
        title="Manage course publishing from a stronger content operations surface."
        description="Course creation and publish state still use the current course endpoints while the screen now follows the richer interface language."
        stats={[
          { label: 'Courses', value: courses.length, detail: 'Course records currently available.' },
          { label: 'Published', value: publishedCourses, detail: 'Courses already visible as published.' },
          { label: 'Enrollments', value: totalEnrollments, detail: 'Aggregate course enrollments across the catalog.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Courses</h1>
          <p className="text-muted-foreground">{courses.length} courses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-2xl px-5"><Plus className="h-4 w-4 mr-2" />New Course</Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
            <CourseForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-[28px]" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      )}
    </div>
  )
}
