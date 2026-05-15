import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeftRight, BookOpen, Laptop, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { ELibraryTab } from '@/components/library/ELibraryTab'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'

const bookSchema = z.object({ title: z.string().min(1), author: z.string().min(1), isbn: z.string().optional(), genre: z.string().optional(), totalCopies: z.coerce.number().min(1) })
const borrowSchema = z.object({ bookId: z.string().min(1), borrowerId: z.string().min(1), borrowerType: z.string().min(1), dueDate: z.string().min(1) })
type BookForm = z.infer<typeof bookSchema>
type BorrowForm = z.infer<typeof borrowSchema>

export default function LibraryPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const canManage = role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF'

  const { data: books = [], isLoading } = useQuery({ queryKey: ['books'], queryFn: () => api.get('/library/books').then(r => r.data) })
  const { data: transactions = [] } = useQuery({ queryKey: ['book-transactions'], queryFn: () => api.get('/library/transactions').then(r => r.data) })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const bookForm = useForm<BookForm>({ resolver: zodResolver(bookSchema) as any })
  const borrowForm = useForm<BorrowForm>({ resolver: zodResolver(borrowSchema) })

  const addMutation = useMutation({
    mutationFn: (data: BookForm) => api.post('/library/books', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }); toast.success('Book added'); setAddOpen(false); bookForm.reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const borrowMutation = useMutation({
    mutationFn: (data: BorrowForm) => api.post('/library/borrow', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] })
      qc.invalidateQueries({ queryKey: ['book-transactions'] })
      toast.success('Book borrowed')
      setBorrowOpen(false)
      borrowForm.reset()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const returnMutation = useMutation({
    mutationFn: (transactionId: string) => api.post(`/library/return/${transactionId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] })
      qc.invalidateQueries({ queryKey: ['book-transactions'] })
      toast.success('Book returned')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const bookColumns: ColumnDef<any>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'author', header: 'Author' },
    { accessorKey: 'genre', header: 'Genre', cell: ({ getValue }) => (getValue() as string) || '—' },
    { accessorKey: 'totalCopies', header: 'Total' },
    { accessorKey: 'available', header: 'Available', cell: ({ getValue }) => {
      const v = getValue() as number
      return <Badge variant={v > 0 ? 'success' : 'destructive'}>{v}</Badge>
    }},
  ]

  const txColumns: ColumnDef<any>[] = [
    { id: 'book', header: 'Book', cell: ({ row }) => row.original.book?.title ?? '—' },
    { accessorKey: 'borrowerType', header: 'Type' },
    { accessorKey: 'borrowDate', header: 'Borrowed', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'dueDate', header: 'Due', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => {
      const s = getValue() as string
      return <Badge variant={s === 'RETURNED' ? 'success' : s === 'OVERDUE' ? 'destructive' : 'secondary'}>{s}</Badge>
    }},
    { id: 'actions', cell: ({ row }) => canManage && row.original.status === 'BORROWED' && (
      <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(row.original.id)}>Return</Button>
    )},
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Library operations
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">Run library circulation from a stronger catalog surface.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">
                Catalog management and borrowing still use the current library endpoints, now inside the richer app frame.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Books</p>
              <p className="mt-2 text-3xl font-semibold">{books.length}</p>
              <p className="mt-2 text-sm text-white/70">Catalog entries currently available.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Borrowed</p>
              <p className="mt-2 text-3xl font-semibold">{transactions.filter((tx: any) => tx.status === 'BORROWED').length}</p>
              <p className="mt-2 text-sm text-white/70">Active book loans currently in circulation.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Returned</p>
              <p className="mt-2 text-3xl font-semibold">{transactions.filter((tx: any) => tx.status === 'RETURNED').length}</p>
              <p className="mt-2 text-sm text-white/70">Transactions that have been completed.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Library</h1><p className="text-muted-foreground">{books.length} books</p></div>
        {canManage && (
        <div className="flex gap-2">
          <Dialog open={borrowOpen} onOpenChange={setBorrowOpen}>
            <DialogTrigger asChild><Button variant="outline" className="h-12 rounded-2xl"><ArrowLeftRight className="h-4 w-4 mr-2" />Borrow</Button></DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>Borrow Book</DialogTitle></DialogHeader>
              <form onSubmit={borrowForm.handleSubmit(d => borrowMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Book</Label>
                  <Select onValueChange={v => borrowForm.setValue('bookId', v)}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select book" /></SelectTrigger>
                    <SelectContent>{books.filter((b: any) => b.available > 0).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Borrower</Label>
                  <Select onValueChange={v => borrowForm.setValue('borrowerId', v)}>
                    <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <input type="hidden" {...borrowForm.register('borrowerType')} value="STUDENT" />
                <div className="space-y-1"><Label>Due Date</Label><Input className="h-11 rounded-2xl" type="date" {...borrowForm.register('dueDate')} /></div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={borrowMutation.isPending}>Borrow</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button className="h-12 rounded-2xl"><Plus className="h-4 w-4 mr-2" />Add Book</Button></DialogTrigger>
            <DialogContent className="rounded-[28px]">
              <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
              <form onSubmit={bookForm.handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1"><Label>Title</Label><Input className="h-11 rounded-2xl" {...bookForm.register('title')} /></div>
                <div className="space-y-1"><Label>Author</Label><Input className="h-11 rounded-2xl" {...bookForm.register('author')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>ISBN</Label><Input className="h-11 rounded-2xl" {...bookForm.register('isbn')} /></div>
                  <div className="space-y-1"><Label>Genre</Label><Input className="h-11 rounded-2xl" {...bookForm.register('genre')} /></div>
                </div>
                <div className="space-y-1"><Label>Copies</Label><Input className="h-11 rounded-2xl" type="number" {...bookForm.register('totalCopies')} defaultValue={1} /></div>
                <Button type="submit" className="h-11 w-full rounded-2xl" disabled={addMutation.isPending}>Add Book</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        )}
      </div>

      <Tabs defaultValue="books" className="space-y-4">
        <TabsList className="h-auto rounded-2xl bg-white/70 p-1 shadow-sm dark:bg-card/70"><TabsTrigger className="rounded-2xl px-5 py-2.5" value="books"><BookOpen className="h-4 w-4 mr-2" />Catalog</TabsTrigger><TabsTrigger className="rounded-2xl px-5 py-2.5" value="elibrary"><Laptop className="h-4 w-4 mr-2" />E-Library</TabsTrigger>{canManage && <TabsTrigger className="rounded-2xl px-5 py-2.5" value="transactions">Transactions</TabsTrigger>}</TabsList>
        <TabsContent value="books"><DataTable data={books} columns={bookColumns} searchKey="title" isLoading={isLoading} /></TabsContent>
        <TabsContent value="elibrary"><ELibraryTab /></TabsContent>
        <TabsContent value="transactions"><DataTable data={transactions} columns={txColumns} /></TabsContent>
      </Tabs>
    </div>
  )
}
