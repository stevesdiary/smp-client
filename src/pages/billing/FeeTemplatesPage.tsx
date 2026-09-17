import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { FeeTemplate } from '@/types'
import { toast } from 'sonner'

const feeTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(['TUITION', 'TRANSPORT', 'EXAM', 'LIBRARY', 'SPORTS', 'HOSTEL', 'OTHER']),
  amount: z.any().transform(v => Number(v)),
  currency: z.string().default('NGN'),
  targetType: z.enum(['ALL', 'CLASS', 'TERM', 'ACADEMIC_YEAR', 'OPT_IN']),
  isOptIn: z.boolean().default(false),
  isMandatory: z.boolean().default(true),
  allowInstallments: z.boolean().default(false),
})

type FeeTemplateForm = z.infer<typeof feeTemplateSchema>

export default function FeeTemplatesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const qc = useQueryClient()

  const { data: templates = [], isLoading } = useQuery<FeeTemplate[]>({
    queryKey: ['fee-templates'],
    queryFn: () => api.get('/fees/templates').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: FeeTemplateForm) => api.post('/fees/templates', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-templates'] })
      setIsAddOpen(false)
      toast.success('Fee template created successfully')
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FeeTemplateForm>({
    resolver: zodResolver(feeTemplateSchema) as any,
    defaultValues: {
      category: 'TUITION',
      targetType: 'ALL',
      currency: 'NGN',
      isOptIn: false,
      isMandatory: true,
      allowInstallments: false,
    }
  })

  const onSubmit = (data: FeeTemplateForm) => {
    createMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Templates"
        description="Define and manage the fee structures that can be assigned to students."
        actions={
          <Button onClick={() => { reset(); setIsAddOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-lowest">
                <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Target Type</th>
                  <th className="px-6 py-4">Rules</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading templates...</td></tr>
                ) : templates.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No fee templates defined.</td></tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="group hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-medium">{t.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-primary">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{t.targetType}</td>
                      <td className="px-6 py-4 flex gap-1">
                        {t.isOptIn && <Badge variant="outline" className="text-[10px]">Opt-in</Badge>}
                        {t.isMandatory && <Badge variant="outline" className="text-[10px]">Mandatory</Badge>}
                        {t.allowInstallments && <Badge variant="outline" className="text-[10px]">Installments</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Fee Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Template Name</Label>
                <Input {...register('name')} placeholder="e.g. Term 1 Tuition Fee" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  {...register('category')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="TUITION">Tuition</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="EXAM">Exam</option>
                  <option value="LIBRARY">Library</option>
                  <option value="SPORTS">Sports</option>
                  <option value="HOSTEL">Hostel</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Target Type</Label>
                <select 
                  {...register('targetType')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ALL">All Students</option>
                  <option value="CLASS">Specific Class</option>
                  <option value="TERM">Term Specific</option>
                  <option value="ACADEMIC_YEAR">Academic Year</option>
                  <option value="OPT_IN">Opt-In (Parent selects)</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('isMandatory')} className="rounded border-input text-primary" />
                  Mandatory
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('isOptIn')} className="rounded border-input text-primary" />
                  Opt-In Allowed
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register('allowInstallments')} className="rounded border-input text-primary" />
                  Allow Installments
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
