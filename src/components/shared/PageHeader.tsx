import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface PageStat {
  label: string
  value: string | number
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  stats?: PageStat[]
  actions?: ReactNode
}

/**
 * PageHeader — replaces ModuleHero.
 * Light, minimal, no gradient. Provides page title, optional stats and actions.
 */
export function PageHeader({ eyebrow, title, description, stats, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-border" aria-hidden>·</span>
                )}
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-xs font-semibold">
                  {stat.value}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
