import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  BookOpen, Download, Eye, FileText, Plus, Search, Trash2, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EBookReader } from '@/components/library/EBookReader'
import { getUserRole } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import type { EBook } from '@/types'

const uploadSchema = z.object({
  title: z.string().min(1, 'Required'),
  author: z.string().min(1, 'Required'),
  description: z.string().optional(),
  genre: z.string().optional(),
  isbn: z.string().optional(),
  isDownloadable: z.boolean().optional(),
})
type UploadForm = z.infer<typeof uploadSchema>

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ELibraryTab() {
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const canUpload = role === 'ADMIN' || role === 'TEACHER'

  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [readingBook, setReadingBook] = useState<EBook | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('all')
  const qc = useQueryClient()

  const { data: ebooks = [], isLoading } = useQuery<EBook[]>({
    queryKey: ['ebooks'],
    queryFn: () => api.get('/library/ebooks').then((r) => r.data),
  })

  const { data: genres = [] } = useQuery<string[]>({
    queryKey: ['ebook-genres'],
    queryFn: () => api.get('/library/ebooks/genres').then((r) => r.data),
  })

  const form = useForm<UploadForm>({ resolver: zodResolver(uploadSchema), defaultValues: { isDownloadable: true } })

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      if (!selectedFile) throw new Error('No file selected')
      const fd = new FormData()
      fd.append('file', selectedFile)
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') fd.append(k, String(v)) })
      return api.post('/library/ebooks', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ebooks'] })
      qc.invalidateQueries({ queryKey: ['ebook-genres'] })
      toast.success('E-book uploaded')
      setUploadOpen(false)
      form.reset()
      setSelectedFile(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message || 'Upload failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/library/ebooks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ebooks'] })
      toast.success('E-book deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Delete failed'),
  })

  const filtered = ebooks.filter((eb) => {
    const matchesSearch = !searchQuery ||
      eb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eb.author.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = genreFilter === 'all' || eb.genre === genreFilter
    return matchesSearch && matchesGenre
  })

  if (readingBook) {
    return <EBookReader ebook={readingBook} onClose={() => setReadingBook(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-2xl pl-10"
            />
          </div>
          {genres.length > 0 && (
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="h-11 w-40 rounded-2xl">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {canUpload && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 rounded-2xl px-5">
                <Upload className="mr-2 h-4 w-4" />Upload E-Book
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] max-w-lg">
              <DialogHeader><DialogTitle>Upload E-Book</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((d) => uploadMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>File (PDF or EPUB, max 100MB)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.epub,application/pdf,application/epub+zip"
                    className="h-11 rounded-2xl"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Title</Label>
                    <Input className="h-11 rounded-2xl" {...form.register('title')} />
                    {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Author</Label>
                    <Input className="h-11 rounded-2xl" {...form.register('author')} />
                    {form.formState.errors.author && <p className="text-xs text-destructive">{form.formState.errors.author.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input className="h-11 rounded-2xl" {...form.register('description')} placeholder="Optional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Genre</Label>
                    <Input className="h-11 rounded-2xl" {...form.register('genre')} placeholder="e.g. Literature" />
                  </div>
                  <div className="space-y-1">
                    <Label>ISBN</Label>
                    <Input className="h-11 rounded-2xl" {...form.register('isbn')} placeholder="Optional" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="downloadable" defaultChecked {...form.register('isDownloadable')} className="rounded" />
                  <Label htmlFor="downloadable" className="text-sm">Allow downloads</Label>
                </div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={uploadMutation.isPending || !selectedFile}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total e-books</p>
              <p className="text-2xl font-semibold">{ebooks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PDFs</p>
              <p className="text-2xl font-semibold">{ebooks.filter((e) => e.fileType === 'PDF').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Downloadable</p>
              <p className="text-2xl font-semibold">{ebooks.filter((e) => e.isDownloadable).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookshelf grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No e-books found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery || genreFilter !== 'all' ? 'Try adjusting your filters.' : 'Upload your first e-book to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((eb) => (
            <Card
              key={eb.id}
              className="group relative overflow-hidden rounded-[20px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:shadow-xl dark:border-white/10 dark:bg-card/85"
            >
              {/* Cover */}
              <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                {eb.coverUrl ? (
                  <img src={eb.coverUrl} alt={eb.title} className="h-full w-full object-cover" />
                ) : (
                  <BookOpen className="h-12 w-12 text-primary/30" />
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  {eb.fileType === 'PDF' && (
                    <Button size="sm" className="rounded-xl" onClick={() => setReadingBook(eb)}>
                      <Eye className="mr-1 h-3.5 w-3.5" />Read
                    </Button>
                  )}
                  {eb.isDownloadable && (
                    <Button size="sm" variant="secondary" className="rounded-xl" onClick={async () => {
                      const { data } = await api.get(`/library/ebooks/${eb.id}/download`)
                      window.open(data.url, '_blank')
                    }}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Badge className="absolute right-2 top-2 rounded-full bg-black/50 text-[10px] text-white backdrop-blur">
                  {eb.fileType}
                </Badge>
              </div>

              <CardContent className="p-4">
                <h3 className="font-medium leading-tight line-clamp-2">{eb.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{eb.author}</p>
                <div className="mt-3 flex items-center justify-between">
                  {eb.genre && (
                    <Badge variant="outline" className="rounded-full text-[10px]">{eb.genre}</Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">{formatFileSize(eb.fileSize)}</span>
                </div>
                {canUpload && (
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-2 bottom-2 h-8 w-8 rounded-xl opacity-0 transition group-hover:opacity-100"
                    onClick={() => { if (confirm('Delete this e-book?')) deleteMutation.mutate(eb.id) }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
