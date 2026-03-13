import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, BookOpen, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

const bookSchema = z.object({ title: z.string().min(1), author: z.string().min(1), isbn: z.string().optional(), genre: z.string().optional(), totalCopies: z.coerce.number().min(1) })
const borrowSchema = z.object({ bookId: z.string().min(1), borrowerId: z.string().min(1), borrowerType: z.string().min(1), dueDate: z.string().min(1) })
type BookForm = z.infer<typeof bookSchema>
type BorrowForm = z.infer<typeof borrowSchema>

export default function LibraryPage() {
  const [addOpen, setAddOpen] = useState(false)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const qc = useQueryClient()

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
    { id: 'actions', cell: ({ row }) => row.original.status === 'BORROWED' && (
      <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(row.original.id)}>Return</Button>
    )},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Library</h1><p className="text-muted-foreground">{books.length} books</p></div>
        <div className="flex gap-2">
          <Dialog open={borrowOpen} onOpenChange={setBorrowOpen}>
            <DialogTrigger asChild><Button variant="outline"><ArrowLeftRight className="h-4 w-4 mr-2" />Borrow</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Borrow Book</DialogTitle></DialogHeader>
              <form onSubmit={borrowForm.handleSubmit(d => borrowMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1">
                  <Label>Book</Label>
                  <Select onValueChange={v => borrowForm.setValue('bookId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select book" /></SelectTrigger>
                    <SelectContent>{books.filter((b: any) => b.available > 0).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Borrower</Label>
                  <Select onValueChange={v => borrowForm.setValue('borrowerId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <input type="hidden" {...borrowForm.register('borrowerType')} value="STUDENT" />
                <div className="space-y-1"><Label>Due Date</Label><Input type="date" {...borrowForm.register('dueDate')} /></div>
                <Button type="submit" className="w-full" disabled={borrowMutation.isPending}>Borrow</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Book</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
              <form onSubmit={bookForm.handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1"><Label>Title</Label><Input {...bookForm.register('title')} /></div>
                <div className="space-y-1"><Label>Author</Label><Input {...bookForm.register('author')} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>ISBN</Label><Input {...bookForm.register('isbn')} /></div>
                  <div className="space-y-1"><Label>Genre</Label><Input {...bookForm.register('genre')} /></div>
                </div>
                <div className="space-y-1"><Label>Copies</Label><Input type="number" {...bookForm.register('totalCopies')} defaultValue={1} /></div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>Add Book</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="books">
        <TabsList><TabsTrigger value="books"><BookOpen className="h-4 w-4 mr-2" />Catalog</TabsTrigger><TabsTrigger value="transactions">Transactions</TabsTrigger></TabsList>
        <TabsContent value="books"><DataTable data={books} columns={bookColumns} searchKey="title" isLoading={isLoading} /></TabsContent>
        <TabsContent value="transactions"><DataTable data={transactions} columns={txColumns} /></TabsContent>
      </Tabs>
    </div>
  )
}
