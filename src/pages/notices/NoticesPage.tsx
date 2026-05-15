import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ModuleHero } from '@/components/shared/ModuleHero'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoticeForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      content: '',
    },
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

  const latestNotice = notices[0]
  const authorCount = new Set(notices.map((notice) => notice.author?.id || notice.authorId)).size

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
    reset({
      title: notice.title,
      content: notice.content,
    })
    setOpen(true)
  }

  function toggleRole(targetRole: UserRole) {
    setTargetRoles((current) =>
      current.includes(targetRole)
        ? current.filter((roleValue) => roleValue !== targetRole)
        : [...current, targetRole]
    )
  }

  function handleDelete(notice: Notice) {
    if (!window.confirm(`Delete "${notice.title}"?`)) {
      return
    }
    deleteMutation.mutate(notice.id)
  }

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="School updates"
        title="Publish and track notices from a dedicated communication surface."
        description={
          canManage
            ? 'Create targeted announcements for staff, families, and learners without leaving the main workspace.'
            : 'Review notices addressed to your role from one cleaner communication feed.'
        }
        stats={[
          { label: 'Visible', value: notices.length, detail: 'Notices currently available in this workspace.' },
          { label: 'Authors', value: authorCount, detail: 'People who have published notices here.' },
          { label: 'Access', value: canManage ? 'Publish' : 'Read only', detail: canManage ? 'You can create, edit, and remove notices.' : 'You can review notices targeted to your role.' },
        ]}
        actions={canManage ? (
          <div>
            <Dialog open={open} onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                closeDialog()
                return
              }
              setOpen(true)
            }}>
              <DialogTrigger asChild>
                <Button className="h-12 rounded-2xl px-5" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  New Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[28px]">
                <DialogHeader>
                  <DialogTitle>{editingNotice ? 'Edit Notice' : 'Publish Notice'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input className="h-11 rounded-2xl" {...register('title')} />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label>Content</Label>
                    <textarea
                      className="min-h-32 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      {...register('content')}
                    />
                    {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Audience</Label>
                      <Button
                        type="button"
                        variant={targetRoles.length === 0 ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setTargetRoles([])}
                      >
                        All roles
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {audienceRoles.map((targetRole) => (
                        <Button
                          key={targetRole}
                          type="button"
                          variant={targetRoles.includes(targetRole) ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => toggleRole(targetRole)}
                        >
                          {targetRole}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave all roles selected off to broadcast to every signed-in user.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-2xl"
                    disabled={isSubmitting || saveMutation.isPending}
                  >
                    {editingNotice ? 'Save Notice' : 'Publish Notice'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : undefined}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notices</h1>
          <p className="text-muted-foreground">
            {latestNotice ? `Latest update ${formatDate(latestNotice.createdAt)}` : 'No notices published yet.'}
          </p>
        </div>
        <Badge className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
          {role}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-[28px]" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <Card className="rounded-[28px] border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">No notices yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {canManage ? 'Publish the first notice to start the school communication feed.' : 'New notices targeted to your role will appear here.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-card/85">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{notice.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {formatAuthor(notice)}{notice.author?.role?.name ? ` · ${notice.author.role.name}` : ''} · {formatDate(notice.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formatAudience(notice.targetRoles).map((audience) => (
                        <Badge key={audience} variant="secondary" className="rounded-full">
                          <Users className="mr-1 h-3 w-3" />
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(notice)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full text-destructive hover:text-destructive"
                        onClick={() => handleDelete(notice)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>

                <p className="whitespace-pre-line text-sm leading-6 text-foreground/90">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
