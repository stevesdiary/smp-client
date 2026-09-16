import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Pencil, Plus, Trash2, Users, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'
import { formatDate, getInitials } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Notice, UserRole } from '@/types'

const audienceRoles: UserRole[] = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT']
const publisherRoles: UserRole[] = ['ADMIN', 'PRINCIPAL', 'TEACHER']

const schema = z.object({
  title: z.string().min(1, 'Required'),
  content: z.string().min(1, 'Required'),
})
type NoticeForm = z.infer<typeof schema>

function formatAuthor(notice: Notice) {
  const name = [notice.author?.firstName, notice.author?.lastName].filter(Boolean).join(' ').trim()
  if (name) return name
  return notice.author?.email || 'School staff'
}

function formatAudience(targetRoles: UserRole[]) {
  return targetRoles.length === 0 ? ['All roles'] : targetRoles
}

export default function NoticesPage() {
  const [open, setOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [targetRoles, setTargetRoles] = useState<UserRole[]>([])
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const canManage = publisherRoles.includes(role)

  const { data: notices = [], isLoading } = useQuery<Notice[]>({
    queryKey: ['notices'],
    queryFn: () => api.get('/notices').then((response) => response.data),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NoticeForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' },
  })

  const saveMutation = useMutation({
    mutationFn: (data: NoticeForm) => {
      const payload = { ...data, targetRoles }
      return editingNotice
        ? api.put(`/notices/${editingNotice.id}`, payload)
        : api.post('/notices', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      toast.success(editingNotice ? 'Notice updated' : 'Notice published')
      closeDialog()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notices/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice removed')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const authorCount = useMemo(() => new Set(notices.map((n) => n.author?.id || n.authorId)).size, [notices])
  const broadcastCount = useMemo(() => notices.filter((n) => (n.targetRoles ?? []).length === 0).length, [notices])

  function closeDialog() {
    setOpen(false)
    setEditingNotice(null)
    setTargetRoles([])
    reset({ title: '', content: '' })
  }
  function openCreate() {
    setEditingNotice(null)
    setTargetRoles([])
    reset({ title: '', content: '' })
    setOpen(true)
  }
  function openEdit(notice: Notice) {
    setEditingNotice(notice)
    setTargetRoles(notice.targetRoles ?? [])
    reset({ title: notice.title, content: notice.content })
    setOpen(true)
  }
  function toggleRole(targetRole: UserRole) {
    setTargetRoles((current) =>
      current.includes(targetRole) ? current.filter((r) => r !== targetRole) : [...current, targetRole]
    )
  }
  function handleDelete(notice: Notice) {
    if (!window.confirm(`Delete "${notice.title}"?`)) return
    deleteMutation.mutate(notice.id)
  }

  const tiles = [
    { label: 'Notices', value: notices.length, icon: Bell, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Authors', value: authorCount, icon: Users, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Broadcast', value: broadcastCount, icon: Megaphone, tone: 'bg-primary-container/10 text-primary' },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">School updates</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Notices &amp; Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">{canManage ? 'Publish targeted announcements for staff, families and learners.' : 'Review notices addressed to your role.'}</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(next) => { if (!next) { closeDialog(); return } setOpen(true) }}>
            <DialogTrigger asChild>
              <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> New Notice</button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingNotice ? 'Edit Notice' : 'Publish Notice'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input {...register('title')} placeholder="Mid-term break" />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Content</Label>
                  <textarea className="min-h-32 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition-colors focus-visible:ring-2 focus-visible:ring-secondary-container/30" {...register('content')} />
                  {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Audience</Label>
                    <button type="button" onClick={() => setTargetRoles([])} className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${targetRoles.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>All roles</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {audienceRoles.map((targetRole) => (
                      <button key={targetRole} type="button" onClick={() => toggleRole(targetRole)} className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors ${targetRoles.includes(targetRole) ? 'bg-primary text-primary-foreground' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>{targetRole}</button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Leave every role off to broadcast to all signed-in users.</p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || saveMutation.isPending}>{editingNotice ? 'Save Notice' : 'Publish Notice'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-3 gap-6">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className="font-mono text-2xl font-black text-on-surface">{t.value}</p></div>
          </div>
        ))}
      </section>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface-container-low" />)}</div>
      ) : notices.length === 0 ? (
        <div className="rounded-3xl bg-surface-container-lowest p-14 text-center shadow-soft">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed/50 text-primary"><Bell className="h-6 w-6" strokeWidth={1.5} /></div>
          <p className="font-semibold text-on-surface">No notices yet</p>
          <p className="mt-1 text-sm text-muted-foreground">{canManage ? 'Publish the first notice to start the communication feed.' : 'New notices targeted to your role will appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed/50 text-[12px] font-bold text-primary">{getInitials(notice.author?.firstName, notice.author?.lastName)}</span>
                  <div className="min-w-0">
                    <h2 className="font-headline text-lg font-bold text-on-surface">{notice.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {formatAuthor(notice)}{notice.author?.role?.name ? ` · ${notice.author.role.name}` : ''} · {formatDate(notice.createdAt)}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => openEdit(notice)} className="flex items-center gap-1.5 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-high"><Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /> Edit</button>
                    <button type="button" onClick={() => handleDelete(notice)} className="flex items-center gap-1.5 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/40"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete</button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {formatAudience(notice.targetRoles).map((audience) => (
                  <span key={audience} className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 text-[11px] font-bold capitalize text-on-secondary-fixed">
                    <Users className="h-3 w-3" strokeWidth={2} /> {audience}
                  </span>
                ))}
              </div>

              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-on-surface-variant">{notice.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
