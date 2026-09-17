import { useQuery } from '@tanstack/react-query'
import { Sparkles, Brain, AlertCircle, Lightbulb, UserCheck, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

type InsightData = {
  strengths: string
  concerns: string
  parentRecommendations: string[]
  teacherRecommendations: string[]
}

export type InsightResponse = {
  studentId: string
  studentName: string
  generatedAt: string
  cached: boolean
  data: InsightData
}

export function StudentAIInsights({ studentId }: { studentId: string }) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery<InsightResponse>({
    queryKey: ['student-insights', studentId],
    queryFn: () => api.get(`/ai/students/${studentId}/insights`).then(r => r.data),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-primary-fixed/20 to-surface-container-lowest p-6 shadow-soft animate-pulse lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="h-6 w-48 rounded bg-surface-container-highest" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-surface-container-high" />
          <div className="h-4 w-5/6 rounded bg-surface-container-high" />
          <div className="h-4 w-4/6 rounded bg-surface-container-high" />
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="rounded-3xl border border-error-container bg-surface-container-lowest p-6 shadow-soft lg:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">AI Insights are currently unavailable.</p>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="rounded-lg bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-highest disabled:opacity-50"
        >
          {isRefetching ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    )
  }

  const { strengths, concerns, parentRecommendations, teacherRecommendations } = data.data

  return (
    <section className="rounded-3xl bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-6 shadow-soft lg:p-8 border border-primary-fixed/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Brain className="h-32 w-32" />
      </div>
      
      <div className="mb-6 flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" strokeWidth={2} />
            <h2 className="font-headline text-xl font-extrabold text-on-surface">AI Insights</h2>
            {data.cached && (
              <span className="ml-2 rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Cached</span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-outline">
            Generated automatically based on recent academic and attendance data.
          </p>
        </div>
        <button 
          onClick={() => api.get(`/ai/students/${studentId}/insights?refresh=true`).then(() => refetch())} 
          disabled={isRefetching}
          className="flex items-center gap-1.5 rounded-xl bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
          title="Regenerate Insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} strokeWidth={2} />
          {isRefetching ? 'Updating...' : 'Update'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 relative z-10">
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary-fixed/20 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary-container">
              <Lightbulb className="h-4 w-4" strokeWidth={2} /> Key Strengths
            </h3>
            <p className="text-sm leading-relaxed text-on-surface">{strengths}</p>
          </div>
          <div className="rounded-2xl bg-error-container/20 p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-destructive">
              <AlertCircle className="h-4 w-4" strokeWidth={2} /> Areas of Concern
            </h3>
            <p className="text-sm leading-relaxed text-on-surface">{concerns}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-container p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-on-surface">
              <UserCheck className="h-4 w-4" strokeWidth={2} /> Teacher Recommendations
            </h3>
            <ul className="space-y-2">
              {teacherRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="leading-tight">{rec}</span>
                </li>
              ))}
              {teacherRecommendations.length === 0 && (
                <li className="text-sm text-muted-foreground italic">No recommendations.</li>
              )}
            </ul>
          </div>
          
          <div className="rounded-2xl bg-secondary-container/20 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-secondary">
              <UserCheck className="h-4 w-4" strokeWidth={2} /> Parent Recommendations
            </h3>
            <ul className="space-y-2">
              {parentRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  <span className="leading-tight">{rec}</span>
                </li>
              ))}
              {parentRecommendations.length === 0 && (
                <li className="text-sm text-muted-foreground italic">No recommendations.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
