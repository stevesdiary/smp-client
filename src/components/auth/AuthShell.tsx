import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  sideTitle: string
  sideDescription: string
  icon: ReactNode
  highlights: string[]
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  icon,
  highlights,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-6rem] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-200/10" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[40px] border border-white/50 bg-white/75-xl dark:bg-card/70 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-8 text-white lg:p-10">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/12">
                {icon}
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight">EDUPLUS</p>
                <p className="text-sm text-white/70">Unified school operating system</p>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.24em] text-white">
                {eyebrow}
              </Badge>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-semibold leading-tight lg:text-5xl">{sideTitle}</h1>
                <p className="max-w-lg text-sm leading-6 text-white/78 lg:text-base">{sideDescription}</p>
              </div>
            </div>

            <div className="mt-10 grid gap-3">
              {highlights.map((highlight) => (
                <div key={highlight} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                  <p className="text-sm text-white/82">{highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center p-5 lg:p-8">
          <div className="w-full rounded-xl bg-background/88 p-6 dark:bg-background/80 lg:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
            </div>

            {children}

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
