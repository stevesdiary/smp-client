import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'

interface AuditUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  role?: { name: string }
}

interface AuditEntry {
  id: string
  action: string
  entity?: string
  entityId?: string
  meta?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
  user: AuditUser
}

interface AuditResponse {
  data: AuditEntry[]
  total: number
  page: number
  limit: number
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function userName(u: AuditUser) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return name || u.email || 'Unknown'
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success-light text-success',
  update: 'bg-info-light text-info dark:bg-info-light dark:text-info',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function actionColor(action: string) {
  const verb = action.split('.').pop() ?? ''
  return ACTION_COLORS[verb] ?? 'bg-secondary text-secondary-foreground'
}

export function AuditLogSection() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const limit = 25

  // Simple debounce
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout>>()
  function onSearch(val: string) {
    setSearch(val)
    clearTimeout(timer)
    setTimer(setTimeout(() => { setDebouncedSearch(val); setPage(1) }, 400))
  }

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (debouncedSearch) params.set('action', debouncedSearch)
      return api.get(`/audit-logs?${params}`).then((r) => r.data)
    },
  })

  const logs = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Audit Log</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Track critical actions by admins, teachers, and staff.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by action (e.g. students, delete, settings)…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No audit logs found.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/50">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{userName(log.user)}</span>
                    {log.user.role?.name && (
                      <Badge variant="secondary" className="rounded-full text-[10px]">{log.user.role.name}</Badge>
                    )}
                    <Badge className={`rounded-full text-[10px] ${actionColor(log.action)}`}>{log.action}</Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    {log.entity && <span>{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</span>}
                    {log.ipAddress && <span>{log.ipAddress}</span>}
                    <span>{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">{total} entries</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" aria-label="Previous page" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-xs">{page} / {totalPages}</span>
              <Button variant="outline" aria-label="Next page" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
