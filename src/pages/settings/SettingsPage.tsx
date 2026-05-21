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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  if (isLoading) return (
    <Card>
      <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading…</CardContent>
    </Card>
  )

  const dirty = form !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          <CardTitle>School Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>School Name</Label>
            <Input value={current?.schoolName ?? ''} onChange={(e) => update('schoolName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>School Code</Label>
            <Input value={current?.schoolCode ?? ''} onChange={(e) => update('schoolCode', e.target.value.toUpperCase())} maxLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={current?.country ?? ''} onChange={(e) => update('country', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>School Type</Label>
            <Select value={current?.schoolType ?? ''} onValueChange={(v) => update('schoolType', v)}>
              <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>
                {SCHOOL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' + ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {current?.gradingSystem?.bands && (
          <div className="space-y-2">
            <Label>Grading Bands</Label>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Grade</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Min %</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Max %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {current.gradingSystem.bands.map((band, i) => (
                    <tr key={band.grade}>
                      <td className="px-4 py-2.5 font-medium">{band.grade}</td>
                      <td className="px-4 py-2.5">
                        <Input type="number" className="h-8 w-20 rounded-lg text-xs" value={band.min} onChange={(e) => updateBand(i, 'min', +e.target.value)} />
                      </td>
                      <td className="px-4 py-2.5">
                        <Input type="number" className="h-8 w-20 rounded-lg text-xs" value={band.max} onChange={(e) => updateBand(i, 'max', +e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dirty && (
          <Button onClick={() => mutation.mutate(form!)} disabled={mutation.isPending}>
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function GeneralTab({ isAdmin }: { isAdmin: boolean }) {
  const { dark, toggle } = useThemeStore()
  const { user, logout } = useAuthStore()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.role?.name}</p>
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
              <p className="text-sm text-muted-foreground">Toggle dark / light theme</p>
            </div>
            <Button variant="outline" size="icon-sm" onClick={toggle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}>
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, school, and preferences.</p>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">
              <Settings2 className="h-4 w-4" />General
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Shield className="h-4 w-4" />Audit Log
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralTab isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogSection />
          </TabsContent>
        </Tabs>
      ) : (
        <GeneralTab isAdmin={false} />
      )}
    </div>
  )
}
