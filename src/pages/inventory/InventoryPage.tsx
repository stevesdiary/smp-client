import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  quantity: z.coerce.number().min(1),
  location: z.string().optional(),
  cost: z.coerce.number().optional(),
  purchaseDate: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function InventoryPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: assets = [], isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => api.get('/inventory/assets').then(r => r.data) })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/inventory/assets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset added'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Asset Name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'quantity', header: 'Qty' },
    { accessorKey: 'location', header: 'Location', cell: ({ getValue }) => (getValue() as string) || '—' },
    { accessorKey: 'cost', header: 'Cost', cell: ({ getValue }) => getValue() ? `$${(getValue() as number).toFixed(2)}` : '—' },
    { accessorKey: 'purchaseDate', header: 'Purchased', cell: ({ getValue }) => getValue() ? formatDate(getValue() as string) : '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset registry"
        title="Inventory"
        description="Track and manage school assets."
        stats={[
          { label: 'Assets', value: assets.length },
          { label: 'Categories', value: new Set(assets.map((a: any) => a.category)).size },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tracked assets</p>
              <p className="text-3xl font-semibold">{assets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-2/10 text-warning-foreground dark:text-warning">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UX refresh</p>
              <p className="text-3xl font-semibold">Applied</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 dark:text-chart-1">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Add flow</p>
              <p className="text-3xl font-semibold">Ready</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Inventory</h1><p className="text-muted-foreground">{assets.length} assets</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-10 rounded-xl"><Plus className="h-4 w-4 mr-2" />Add Asset</Button></DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Name</Label><Input className="h-11 rounded-2xl" {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
                <div className="space-y-1"><Label>Category</Label><Input className="h-11 rounded-2xl" {...register('category')} placeholder="Furniture, Equipment..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Quantity</Label><Input className="h-11 rounded-2xl" type="number" {...register('quantity')} defaultValue={1} /></div>
                <div className="space-y-1"><Label>Cost ($)</Label><Input className="h-11 rounded-2xl" type="number" step="0.01" {...register('cost')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Location</Label><Input className="h-11 rounded-2xl" {...register('location')} placeholder="Room 101" /></div>
                <div className="space-y-1"><Label>Purchase Date</Label><Input className="h-11 rounded-2xl" type="date" {...register('purchaseDate')} /></div>
              </div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Asset'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={assets} columns={columns} searchKey="name" isLoading={isLoading} />
    </div>
  )
}
