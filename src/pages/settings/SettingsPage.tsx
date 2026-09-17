import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Moon, Sun, LogOut, Save, Building2, GraduationCap, UserCircle, Palette } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import { getInitials } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { AuditLogSection } from './AuditLogSection'
import api from '@/lib/api'

type SchoolSettings = {
  schoolName?: string; schoolCode?: string; country?: string; schoolType?: string
  gradingSystem?: { mode: string; bands: { grade: string; min: number; max: number }[] }
  [key: string]: unknown
}
const SCHOOL_TYPES = ['PRIMARY', 'SECONDARY', 'PRIMARY_SECONDARY'] as const

function Section({ icon: Icon, title, desc, children }: { icon: typeof Building2; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
        <div>
          <h2 className="font-headline text-lg font-extrabold text-on-surface">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function InstitutionSettings() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery<SchoolSettings>({ queryKey: ['school-settings'], queryFn: () => api.get('/settings').then(r => r.data) })
  const [form, setForm] = useState<SchoolSettings | null>(null)
  const current = form ?? settings
  const dirty = form !== null

  const mutation = useMutation({
    mutationFn: (data: SchoolSettings) => api.put('/settings', data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['school-settings'], data); setForm(null); toast.success('School settings saved') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  })
  const update = (field: string, value: unknown) => setForm(prev => ({ ...(prev ?? settings ?? {}), [field]: value }))
  const updateBand = (i: number, field: 'min' | 'max', value: number) => {
    const bands = [...(current?.gradingSystem?.bands ?? [])]
    bands[i] = { ...bands[i], [field]: value }
    update('gradingSystem', { ...(current?.gradingSystem ?? { mode: 'percentage' }), bands })
  }

  if (isLoading) return <div className="h-40 animate-pulse rounded-3xl bg-surface-container-low" />

  return (
    <>
      {dirty && (
        <div className="flex items-center justify-between rounded-2xl bg-secondary-fixed/40 px-5 py-3">
          <p className="text-sm font-bold text-on-secondary-fixed">You have unsaved changes.</p>
          <button onClick={() => mutation.mutate(form!)} disabled={mutation.isPending} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
            <Save className="h-4 w-4" strokeWidth={1.5} /> {mutation.isPending ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      )}

      <Section icon={Building2} title="Institution Identity" desc="Your school's name, code, and profile.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Official School Name</Label><Input value={current?.schoolName ?? ''} onChange={e => update('schoolName', e.target.value)} placeholder="St. Augustine's Premier Academy" /></div>
          <div className="space-y-1.5"><Label>School Code</Label><Input value={current?.schoolCode ?? ''} onChange={e => update('schoolCode', e.target.value.toUpperCase())} maxLength={6} className="font-mono" placeholder="GWD" /></div>
          <div className="space-y-1.5"><Label>Country</Label><Input value={current?.country ?? ''} onChange={e => update('country', e.target.value)} placeholder="Nigeria" /></div>
          <div className="space-y-1.5">
            <Label>School Type</Label>
            <Select value={current?.schoolType ?? ''} onValueChange={v => update('schoolType', v)}>
              <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>{SCHOOL_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' + ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {current?.gradingSystem?.bands && (
        <Section icon={GraduationCap} title="Grading Scheme" desc="Percentage bands used across report cards.">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-5 py-3 text-left">Grade</th>
                  <th className="px-5 py-3 text-left">Min %</th>
                  <th className="px-5 py-3 text-left">Max %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {current.gradingSystem.bands.map((band, i) => (
                  <tr key={band.grade}>
                    <td className="px-5 py-3"><span className="inline-flex min-w-[2rem] justify-center rounded-lg bg-surface-container-high px-2.5 py-1 text-xs font-bold text-primary">{band.grade}</span></td>
                    <td className="px-5 py-3"><input type="number" value={band.min} onChange={e => updateBand(i, 'min', +e.target.value)} className="h-9 w-20 rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20" /></td>
                    <td className="px-5 py-3"><input type="number" value={band.max} onChange={e => updateBand(i, 'max', +e.target.value)} className="h-9 w-20 rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const role = getUserRole(user)
  const isAdmin = role === 'ADMIN'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Institutional settings"
        title="General Settings"
        description="Manage your school identity, grading, and account preferences."
      />

      {isAdmin && <InstitutionSettings />}

      {/* Profile + Appearance */}
      <div className="grid gap-8 md:grid-cols-2">
        <Section icon={UserCircle} title="Your Profile">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">{getInitials(user?.firstName, user?.lastName)}</div>
            <div className="min-w-0">
              <p className="truncate font-bold text-on-surface">{user?.firstName} {user?.lastName}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <span className="mt-1 inline-flex rounded-full bg-primary-fixed/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-container">{user?.role?.name ?? role}</span>
            </div>
          </div>
        </Section>

        <Section icon={Palette} title="Appearance">
          <div className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3">
            <div>
              <p className="text-sm font-bold text-on-surface">Dark mode</p>
              <p className="text-xs text-muted-foreground">Toggle the interface theme</p>
            </div>
            <button
              onClick={toggle}
              role="switch" aria-checked={dark} aria-label="Toggle dark mode"
              className={`relative flex h-8 w-14 items-center rounded-full px-1 transition-colors ${dark ? 'bg-primary' : 'bg-surface-container-high'}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-transform ${dark ? 'translate-x-6' : 'translate-x-0'}`}>
                {dark ? <Moon className="h-3.5 w-3.5" strokeWidth={2} /> : <Sun className="h-3.5 w-3.5" strokeWidth={2} />}
              </span>
            </button>
          </div>
          <button onClick={logout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-error-container bg-error-container/30 py-2.5 text-sm font-bold text-error-on transition-colors hover:bg-error-container/50">
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
          </button>
        </Section>
      </div>

      {isAdmin && (
        <Section icon={Building2} title="Recent Configuration Audit" desc="Changes made to school configuration.">
          <AuditLogSection />
        </Section>
      )}
    </div>
  )
}
