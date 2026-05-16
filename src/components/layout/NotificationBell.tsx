import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ['notifications-count'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=20').then((r) => r.data),
    enabled: open,
  })

  const markRead = useMutation({
    mutationFn: (ids: string[]) => api.post('/notifications/mark-read', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const count = countData?.count ?? 0

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" aria-label="Notifications" size="icon" className="relative rounded-xl" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-chart-2 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition hover:bg-secondary/50 ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!n.read) markRead.mutate([n.id])
                    if (n.link) window.location.href = n.link
                    setOpen(false)
                  }}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation()
                        markRead.mutate([n.id])
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
