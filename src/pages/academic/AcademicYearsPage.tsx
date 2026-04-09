import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, ChevronDown, ChevronRight, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ModuleHero } from '@/components/shared/ModuleHero'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { AcademicYear, Term } from '@/types'

const yearSchema = z.object({
  name: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
})
type YearForm = z.infer<typeof yearSchema>

const termSchema = z.object({
  name: z.string().min(1, 'Required'),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
})
type TermForm = z.infer<typeof termSchema>

function TermRow({ term }: { term: Term }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <div>
          <span className="font-medium">{term.name}</span>
          <span className="ml-3 text-sm text-muted-foreground">
            {formatDate(term.startDate)} → {formatDate(term.endDate)}
          </span>
        </div>
      </div>
      {term.isCurrent && (
        <Badge className="rounded-full bg-primary/15 px-3 text-xs text-primary">Current</Badge>
      )}
    </div>
  )
}

function AcademicYearCard({
  year,
  expanded,
  onToggle,
}: {
  year: AcademicYear
  expanded: boolean
  onToggle: () => void
}) {
  const [addTermOpen, setAddTermOpen] = useState(false)
  const qc = useQueryClient()

  const { data: terms = [], isLoading: termsLoading } = useQuery<Term[]>({
    queryKey: ['terms', year.id],
    queryFn: () => api.get(`/terms?academicYearId=${year.id}`).then(r => r.data),
    enabled: expanded,
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/academic-years/${year.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['academic-years'] }); toast.success('Deleted') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TermForm>({
    resolver: zodResolver(termSchema),
  })

  const termMutation = useMutation({
    mutationFn: (data: TermForm) => api.post('/terms', { ...data, academicYearId: year.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['terms', year.id] })
      toast.success('Term created')
      setAddTermOpen(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/90">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/70 transition hover:bg-secondary"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{year.name}</CardTitle>
                {year.isCurrent && (
                  <Badge className="rounded-full bg-primary/15 px-3 text-xs text-primary">
                    <Star className="mr-1 h-2.5 w-2.5" />Current
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatDate(year.startDate)} → {formatDate(year.endDate)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={addTermOpen} onOpenChange={setAddTermOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl px-3 text-xs">
                  <Plus className="mr-1.5 h-3 w-3" />Add Term
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[28px]">
                <DialogHeader>
                  <DialogTitle>Add Term — {year.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(d => termMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Term Name</Label>
                    <Input className="h-11 rounded-2xl" {...register('name')} placeholder="First Term" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Start Date</Label>
                      <Input className="h-11 rounded-2xl" type="date" {...register('startDate')} />
                      {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>End Date</Label>
                      <Input className="h-11 rounded-2xl" type="date" {...register('endDate')} />
                      {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                    </div>
                  </div>
                  <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Term'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost" size="icon" className="h-9 w-9 rounded-xl"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {termsLoading
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-2xl" />)
              : terms.length === 0
                ? (
                  <div className="rounded-2xl border border-dashed border-border/80 p-4 text-center text-sm text-muted-foreground">
                    No terms yet — click "Add Term" to create the first one.
                  </div>
                )
                : terms.map(term => <TermRow key={term.id} term={term} />)
            }
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function AcademicYearsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const qc = useQueryClient()

  const { data: years = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<YearForm>({
    resolver: zodResolver(yearSchema),
  })

  const createMutation = useMutation({
    mutationFn: (data: YearForm) => api.post('/academic-years', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Academic year created')
      setCreateOpen(false)
      reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const currentYear = years.find(y => y.isCurrent)

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Academic calendar"
        title="Structure the school year into manageable academic periods."
        description="Create academic years and nest terms within them. Mark one as current to activate it across attendance, grades, and timetables."
        stats={[
          { label: 'Academic years', value: years.length, detail: 'Total academic years configured.' },
          { label: 'Current year', value: currentYear?.name ?? 'None set', detail: 'The active year across all modules.' },
          { label: 'Status', value: currentYear ? 'Active' : 'Setup needed', detail: 'Set a current year to unlock full functionality.' },
        ]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-5">
                <Plus className="mr-2 h-4 w-4" />New Academic Year
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>Create Academic Year</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Year Name</Label>
                  <Input className="h-11 rounded-2xl" {...register('name')} placeholder="2024/2025" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input className="h-11 rounded-2xl" type="date" {...register('startDate')} />
                    {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>End Date</Label>
                    <Input className="h-11 rounded-2xl" type="date" {...register('endDate')} />
                    {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                  </div>
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Academic Year'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[28px]" />)}
        </div>
      ) : years.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-border bg-secondary/30 p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-semibold">No academic years yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first academic year above to begin configuring the school calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {years.map(year => (
            <AcademicYearCard
              key={year.id}
              year={year}
              expanded={expanded.has(year.id)}
              onToggle={() => toggleExpand(year.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
