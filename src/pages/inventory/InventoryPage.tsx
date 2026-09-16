import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, Plus, Layers, Boxes, Wallet, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDate, formatCurrency } from '@/lib/utils'
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

const naira0 = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)

export default function InventoryPage() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<string>('all')
  const qc = useQueryClient()

  const { data: assets = [], isLoading } = useQuery<any[]>({ queryKey: ['assets'], queryFn: () => api.get('/inventory/assets').then(r => r.data) })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/inventory/assets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Asset added'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const categories = useMemo(() => Array.from(new Set(assets.map(a => a.category).filter(Boolean))) as string[], [assets])
  const totalUnits = useMemo(() => assets.reduce((s, a) => s + (a.quantity ?? 0), 0), [assets])
  const totalValue = useMemo(() => assets.reduce((s, a) => s + ((a.cost ?? 0) * (a.quantity ?? 1)), 0), [assets])
  const filtered = useMemo(() => category === 'all' ? assets : assets.filter(a => a.category === category), [assets, category])

  const tiles = [
    { label: 'Tracked Assets', value: assets.length, icon: Package, tone: 'bg-primary-fixed/40 text-primary' },
    { label: 'Categories', value: categories.length, icon: Layers, tone: 'bg-secondary-container/15 text-secondary' },
    { label: 'Total Units', value: totalUnits, icon: Boxes, tone: 'bg-primary-container/10 text-primary' },
    { label: 'Est. Value', value: naira0(totalValue), icon: Wallet, tone: 'bg-primary-fixed/40 text-primary', mono: true },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Asset registry</p>
          <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface">Inventory &amp; Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track equipment, furniture and supplies across the school.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"><Plus className="h-4 w-4" strokeWidth={2} /> Add Asset</button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Name</Label><Input {...register('name')} placeholder="Projector" />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
                <div className="space-y-1.5"><Label>Category</Label><Input {...register('category')} placeholder="Furniture, Equipment…" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" {...register('quantity')} defaultValue={1} /></div>
                <div className="space-y-1.5"><Label>Unit Cost (₦)</Label><Input type="number" step="0.01" {...register('cost')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Location</Label><Input {...register('location')} placeholder="Room 101" /></div>
                <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" {...register('purchaseDate')} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add Asset'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-soft">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.tone}`}><t.icon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.label}</p><p className={`truncate text-2xl font-black text-on-surface ${t.mono ? 'font-mono text-xl' : 'font-mono'}`}>{t.value}</p></div>
          </div>
        ))}
      </section>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {['all', ...categories].map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${category === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}>
              {c === 'all' ? 'All Assets' : c}
            </button>
          ))}
        </div>
      )}

      {/* Assets table */}
      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <th className="px-8 py-5">Asset</th><th className="px-6 py-5">Category</th><th className="px-6 py-5 text-center">Qty</th><th className="px-6 py-5">Location</th><th className="px-6 py-5">Unit Cost</th><th className="px-6 py-5">Purchased</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-8 py-5"><div className="h-9 animate-pulse rounded-xl bg-surface-container-low" /></td></tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-16 text-center"><p className="text-sm font-semibold text-on-surface">No assets</p><p className="mt-1 text-xs text-muted-foreground">Add an asset to the registry.</p></td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="transition-colors hover:bg-surface-container-low/40">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed/50 text-primary"><Package className="h-4 w-4" strokeWidth={1.5} /></div>
                      <p className="font-bold text-on-surface">{a.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5"><span className="rounded-full bg-secondary-fixed px-3 py-1 text-[11px] font-bold capitalize text-on-secondary-fixed">{a.category || '—'}</span></td>
                  <td className="px-6 py-5 text-center font-mono text-sm font-bold text-on-surface">{a.quantity ?? 0}</td>
                  <td className="px-6 py-5 text-sm text-on-surface">{a.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} /> {a.location}</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-6 py-5 font-mono text-sm text-on-surface">{a.cost ? formatCurrency(a.cost) : <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-6 py-5 text-sm text-muted-foreground">{a.purchaseDate ? formatDate(a.purchaseDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
