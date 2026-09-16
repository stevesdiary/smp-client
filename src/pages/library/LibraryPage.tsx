import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftRight, BookOpen, Laptop, Plus, Search, Library as LibraryIcon, BookMarked } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ELibraryTab } from '@/components/library/ELibraryTab'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'

const bookSchema = z.object({ title: z.string().min(1), author: z.string().min(1), isbn: z.string().optional(), genre: z.string().optional(), totalCopies: z.coerce.number().min(1) })
const borrowSchema = z.object({ bookId: z.string().min(1), borrowerId: z.string().min(1), borrowerType: z.string().min(1), dueDate: z.string().min(1) })
type BookForm = z.infer<typeof bookSchema>
type BorrowForm = z.infer<typeof borrowSchema>

const SPINES = ['bg-primary text-white', 'bg-secondary-container text-on-secondary-fixed', 'bg-primary-container text-white', 'bg-primary-fixed text-primary-container', 'bg-surface-container-highest text-primary-container']
function spineFor(key: string) { let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0; return SPINES[h % SPINES.length] }

export default function LibraryPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [tab, setTab] = useState<'catalog' | 'loans' | 'elibrary'>('catalog')
  const [search, setSearch] = useState('')
  const [fGenre, setFGenre] = useState('all')
  const [fAvail, setFAvail] = useState('all')
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const canManage = role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF'

  const { data: books = [], isLoading } = useQuery<any[]>({ queryKey: ['books'], queryFn: () => api.get('/library/books').then(r => r.data) })
  const { data: transactions = [] } = useQuery<any[]>({ queryKey: ['book-transactions'], queryFn: () => api.get('/library/transactions').then(r => r.data) })
  const { data: students = [] } = useQuery<any[]>({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => (Array.isArray(r.data) ? r.data : r.data?.data ?? [])) })

  const bookForm = useForm<BookForm>({ resolver: zodResolver(bookSchema) as any })
  const borrowForm = useForm<BorrowForm>({ resolver: zodResolver(borrowSchema) })

  const addMutation = useMutation({
    mutationFn: (data: BookForm) => api.post('/library/books', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book added'); setAddOpen(false); bookForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const borrowMutation = useMutation({
    mutationFn: (data: BorrowForm) => api.post('/library/borrow', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); qc.invalidateQueries({ queryKey: ['book-transactions'] }); toast.success('Book checked out'); setBorrowOpen(false); borrowForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })
  const returnMutation = useMutation({
    mutationFn: (transactionId: string) => api.post(`/library/return/${transactionId}`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); qc.invalidateQueries({ queryKey: ['book-transactions'] }); toast.success('Book returned') },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const genres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)))
  const onLoan = transactions.filter(t => t.status === 'BORROWED').length
  const availableCopies = books.reduce((s, b) => s + (b.available ?? 0), 0)
  const q = search.trim().toLowerCase()
  const catalog = books.filter(b =>
    (!q || `${b.title} ${b.author} ${b.isbn ?? ''}`.toLowerCase().includes(q)) &&
    (fGenre === 'all' || b.genre === fGenre) &&
    (fAvail === 'all' || (fAvail === 'available' ? (b.available ?? 0) > 0 : (b.available ?? 0) === 0)))

  const txBadge = (s: string) => s === 'RETURNED' ? 'bg-primary-fixed text-on-secondary-fixed' : s === 'OVERDUE' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-secondary-fixed text-on-secondary-fixed'
  const tabs: { key: typeof tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'catalog', label: 'Catalog', icon: BookOpen },
    ...(canManage ? [{ key: 'loans' as const, label: 'Loans', icon: ArrowLeftRight }] : []),
    { key: 'elibrary', label: 'E-Library', icon: Laptop },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Library operations</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Library Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the collection, checkouts, and returns.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <Dialog open={borrowOpen} onOpenChange={setBorrowOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"><ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} /> New Checkout</button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New Checkout</DialogTitle></DialogHeader>
                <form onSubmit={borrowForm.handleSubmit(d => borrowMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5"><Label>Book</Label>
                    <Select onValueChange={v => borrowForm.setValue('bookId', v)}><SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                      <SelectContent>{books.filter(b => (b.available ?? 0) > 0).map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label>Borrower</Label>
                    <Select onValueChange={v => borrowForm.setValue('borrowerId', v)}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <input type="hidden" {...borrowForm.register('borrowerType')} value="STUDENT" />
                  <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" {...borrowForm.register('dueDate')} /></div>
                  <Button type="submit" className="w-full" disabled={borrowMutation.isPending}>{borrowMutation.isPending ? 'Checking out…' : 'Check Out'}</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> Add New Book</button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Add New Book</DialogTitle></DialogHeader>
                <form onSubmit={bookForm.handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
                  <div className="space-y-1.5"><Label>Title</Label><Input {...bookForm.register('title')} /></div>
                  <div className="space-y-1.5"><Label>Author</Label><Input {...bookForm.register('author')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>ISBN</Label><Input {...bookForm.register('isbn')} /></div>
                    <div className="space-y-1.5"><Label>Category</Label><Input {...bookForm.register('genre')} placeholder="Textbook" /></div>
                  </div>
                  <div className="space-y-1.5"><Label>Copies</Label><Input type="number" defaultValue={1} {...bookForm.register('totalCopies')} /></div>
                  <Button type="submit" className="w-full" disabled={addMutation.isPending}>{addMutation.isPending ? 'Adding…' : 'Add Book'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: 'Total Titles', value: books.length, icon: LibraryIcon, tone: 'bg-primary-container/10 text-primary' },
          { label: 'On Loan', value: onLoan, icon: ArrowLeftRight, tone: 'bg-secondary-container/15 text-secondary' },
          { label: 'Available Copies', value: availableCopies, icon: BookMarked, tone: 'bg-primary-fixed/40 text-primary' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.tone}`}><s.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p><p className="font-mono text-2xl font-black text-on-surface">{s.value}</p></div>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>
            <t.icon className="h-4 w-4" strokeWidth={1.5} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'elibrary' ? (
        <ELibraryTab />
      ) : tab === 'loans' ? (
        <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-8 py-5">Book</th><th className="px-6 py-5">Borrower</th><th className="px-6 py-5">Borrowed</th><th className="px-6 py-5">Due</th><th className="px-6 py-5">Status</th><th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {transactions.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No loans</p><p className="mt-1 text-xs text-muted-foreground">Checkouts will appear here.</p></td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id} className="transition-colors hover:bg-surface-container-low/40">
                    <td className="px-8 py-5 font-bold text-on-surface">{t.book?.title ?? '—'}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{t.borrowerType ?? '—'}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{t.borrowDate ? formatDate(t.borrowDate) : '—'}</td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">{t.dueDate ? formatDate(t.dueDate) : '—'}</td>
                    <td className="px-6 py-5"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${txBadge(t.status)}`}>{t.status}</span></td>
                    <td className="px-8 py-5 text-right">{canManage && t.status === 'BORROWED' && <button onClick={() => returnMutation.mutate(t.id)} className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-container-high">Return</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <>
          {/* Filters */}
          <section className="rounded-3xl bg-surface-container-low p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" strokeWidth={1.5} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, author or ISBN…" aria-label="Search books"
                  className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest pl-11 pr-4 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30" />
              </div>
              <Select value={fGenre} onValueChange={setFGenre}>
                <SelectTrigger className="h-11 w-44 rounded-xl border-outline-variant/30 bg-surface-container-lowest"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Categories</SelectItem>{genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={fAvail} onValueChange={setFAvail}>
                <SelectTrigger className="h-11 w-40 rounded-xl border-outline-variant/30 bg-surface-container-lowest"><SelectValue placeholder="Availability" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Any Status</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="out">Out of Stock</SelectItem></SelectContent>
              </Select>
            </div>
          </section>

          {/* Catalog table */}
          <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-8 py-5">Book</th><th className="px-6 py-5">ISBN</th><th className="px-6 py-5">Category</th><th className="px-6 py-5 text-center">Copies</th><th className="px-6 py-5">Status</th><th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-8 py-5"><div className="h-10 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
                  ) : catalog.length === 0 ? (
                    <tr><td colSpan={6} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No books found</p><p className="mt-1 text-xs text-muted-foreground">{q || fGenre !== 'all' || fAvail !== 'all' ? 'No books match these filters.' : 'Add a book to the catalog.'}</p></td></tr>
                  ) : catalog.map(b => {
                    const avail = b.available ?? 0
                    return (
                      <tr key={b.id} className="group transition-colors hover:bg-surface-container-low/40">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-9 shrink-0 items-center justify-center rounded-md ${spineFor(b.genre || b.title)}`}><BookOpen className="h-4 w-4" strokeWidth={1.5} /></div>
                            <div className="min-w-0"><p className="truncate font-bold text-on-surface">{b.title}</p><p className="truncate text-xs text-muted-foreground">{b.author}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-muted-foreground">{b.isbn || '—'}</td>
                        <td className="px-6 py-5">{b.genre ? <span className="inline-flex rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-primary">{b.genre}</span> : <span className="text-sm text-muted-foreground">—</span>}</td>
                        <td className="px-6 py-5 text-center font-mono text-sm text-on-surface">{avail}<span className="text-muted-foreground"> / {b.totalCopies ?? avail}</span></td>
                        <td className="px-6 py-5"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${avail > 0 ? 'bg-primary-fixed text-on-secondary-fixed' : 'bg-[#ffdad6] text-[#93000a]'}`}>{avail > 0 ? 'Available' : 'Out of Stock'}</span></td>
                        <td className="px-8 py-5 text-right">
                          {canManage && avail > 0 && (
                            <button onClick={() => { borrowForm.setValue('bookId', b.id); borrowForm.setValue('borrowerType', 'STUDENT'); setBorrowOpen(true) }} className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-primary opacity-0 transition-all hover:bg-surface-container-high group-hover:opacity-100">Check Out</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
