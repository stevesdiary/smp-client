import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-900 p-6 text-white shadow-2xl shadow-slate-900/10 lg:p-8">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.2fr,0.85fr]">
          <div className="space-y-4">
            <Badge className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              Asset registry
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold leading-tight lg:text-5xl">Track school assets from a cleaner inventory surface.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/78 lg:text-base">
                Inventory remains fully connected to the existing asset endpoints while the page inherits the richer application direction.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Assets</p>
              <p className="mt-2 text-3xl font-semibold">{assets.length}</p>
              <p className="mt-2 text-sm text-white/70">Tracked inventory items in the system.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Categories</p>
              <p className="mt-2 text-3xl font-semibold">{new Set(assets.map((asset: any) => asset.category)).size}</p>
              <p className="mt-2 text-sm text-white/70">Distinct asset categories currently in use.</p>
            </div>
            <div className="rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-white/70">Workspace</p>
              <p className="mt-2 text-3xl font-semibold">Live</p>
              <p className="mt-2 text-sm text-white/70">Asset creation still uses the current inventory API.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tracked assets</p>
              <p className="text-3xl font-semibold">{assets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UX refresh</p>
              <p className="text-3xl font-semibold">Applied</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
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
          <DialogTrigger asChild><Button className="h-12 rounded-2xl"><Plus className="h-4 w-4 mr-2" />Add Asset</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
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
