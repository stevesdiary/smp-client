import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

type ModuleHeroStat = {
  label: string
  value: string | number
  detail: string
}

interface ModuleHeroProps {
  eyebrow: string
  title: string
  description: string
  stats: ModuleHeroStat[]
  actions?: ReactNode
}

export function ModuleHero({ eyebrow, title, description, stats, actions }: ModuleHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
        <div className="space-y-4">
          <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
            {eyebrow}
          </Badge>
          <div>
            <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">{description}</p>
          </div>
          {actions}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-white/70">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
