import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable } from '@/components/shared/DataTable'
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Inventory</h1><p className="text-muted-foreground">{assets.length} assets</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
                <div className="space-y-1"><Label>Category</Label><Input {...register('category')} placeholder="Furniture, Equipment..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Quantity</Label><Input type="number" {...register('quantity')} defaultValue={1} /></div>
                <div className="space-y-1"><Label>Cost ($)</Label><Input type="number" step="0.01" {...register('cost')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Location</Label><Input {...register('location')} placeholder="Room 101" /></div>
                <div className="space-y-1"><Label>Purchase Date</Label><Input type="date" {...register('purchaseDate')} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Asset'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={assets} columns={columns} searchKey="name" isLoading={isLoading} />
    </div>
  )
}
