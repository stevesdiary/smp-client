import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Moon, Sun, LogOut, School, Save, Settings2, Shield } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import { getInitials } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuditLogSection } from './AuditLogSection'
import api from '@/lib/api'

type SchoolSettings = {
  schoolName?: string
  schoolCode?: string
  country?: string
  schoolType?: string
  gradingSystem?: {
    mode: string
    bands: { grade: string; min: number; max: number }[]
  }
  [key: string]: unknown
}

const SCHOOL_TYPES = ['PRIMARY', 'SECONDARY', 'PRIMARY_SECONDARY'] as const

function SchoolSettingsSection() {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery<SchoolSettings>({
    queryKey: ['school-settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  })

  const [form, setForm] = useState<SchoolSettings | null>(null)
  const current = form ?? settings

  const mutation = useMutation({
    mutationFn: (data: SchoolSettings) => api.put('/settings', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(['school-settings'], data)
      setForm(null)
      toast.success('School settings saved')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  })

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...(prev ?? settings ?? {}), [field]: value }))
  }

  function updateBand(index: number, field: 'min' | 'max', value: number) {
    const bands = [...(current?.gradingSystem?.bands ?? [])]
    bands[index] = { ...bands[index], [field]: value }
    update('gradingSystem', { ...(current?.gradingSystem ?? { mode: 'percentage' }), bands })
  }

  if (isLoading) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Loading…</CardContent></Card>

  const dirty = form !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          <CardTitle>School Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>School Name</Label>
            <Input value={current?.schoolName ?? ''} onChange={(e) => update('schoolName', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>School Code</Label>
            <Input value={current?.schoolCode ?? ''} onChange={(e) => update('schoolCode', e.target.value.toUpperCase())} maxLength={6} />
          </div>
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={current?.country ?? ''} onChange={(e) => update('country', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>School Type</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={current?.schoolType ?? ''}
              onChange={(e) => update('schoolType', e.target.value)}
            >
              <option value="">Select…</option>
              {SCHOOL_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' + ')}</option>
              ))}
            </select>
          </div>
        </div>

        {current?.gradingSystem?.bands && (
          <div className="space-y-2">
            <Label>Grading Bands</Label>
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Grade</th>
                    <th className="px-3 py-2 text-left font-medium">Min %</th>
                    <th className="px-3 py-2 text-left font-medium">Max %</th>
                  </tr>
                </thead>
                <tbody>
                  {current.gradingSystem.bands.map((band, i) => (
                    <tr key={band.grade} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{band.grade}</td>
                      <td className="px-3 py-2">
                        <Input type="number" className="h-8 w-20" value={band.min} onChange={(e) => updateBand(i, 'min', +e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" className="h-8 w-20" value={band.max} onChange={(e) => updateBand(i, 'max', +e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dirty && (
          <Button onClick={() => mutation.mutate(form!)} disabled={mutation.isPending} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

type Tab = 'general' | 'audit'

function GeneralTab({ isAdmin }: { isAdmin: boolean }) {
  const { dark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.role?.name}</p>
          </div>
        </CardContent>
      </Card>

      {isAdmin && <SchoolSettingsSection />}

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
            </div>
            <Button variant="outline" size="icon" onClick={toggle}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const isAdmin = role === 'ADMIN'
  const [tab, setTab] = useState<Tab>('general')

  const tabs: { key: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { key: 'general', label: 'General', icon: <Settings2 className="h-4 w-4" /> },
    { key: 'audit', label: 'Audit Log', icon: <Shield className="h-4 w-4" />, adminOnly: true },
  ]

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {visibleTabs.length > 1 && (
        <div className="flex gap-1 rounded-2xl bg-secondary/60 p-1">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'general' && <GeneralTab isAdmin={isAdmin} />}
      {tab === 'audit' && isAdmin && <AuditLogSection />}
    </div>
  )
}
