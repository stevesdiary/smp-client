import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FeeAssignment, FeeTemplate, Student } from '@/types'
import { toast } from 'sonner'

const assignFeeSchema = z.object({
  feeTemplateId: z.string().min(1, 'Please select a fee template'),
  studentId: z.string().min(1, 'Please select a student'),
})

type AssignFeeForm = z.infer<typeof assignFeeSchema>

export default function FeeAssignmentsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const qc = useQueryClient()

  const { data: assignments = [], isLoading } = useQuery<FeeAssignment[]>({
    queryKey: ['fee-assignments'],
    queryFn: () => api.get('/fees/assignments').then((r) => r.data),
  })

  const { data: templates = [] } = useQuery<FeeTemplate[]>({
    queryKey: ['fee-templates'],
    queryFn: () => api.get('/fees/templates').then((r) => r.data),
  })

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students-list'],
    queryFn: () => api.get('/students?limit=100').then((r) => r.data.items || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: AssignFeeForm) => api.post(`/fees/templates/${data.feeTemplateId}/assign`, { studentIds: [data.studentId] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-assignments'] })
      setIsAddOpen(false)
      toast.success('Fee assigned successfully')
    },
  })

  const waiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fees/assignments/${id}/waive`, { reason: 'Waived by admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fee-assignments'] })
      toast.success('Fee waived successfully')
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AssignFeeForm>({
    resolver: zodResolver(assignFeeSchema),
  })

  const onSubmit = (data: AssignFeeForm) => {
    createMutation.mutate(data)
  }

  function renderStatus(status: string) {
    if (status === 'PAID') return <Badge variant="default" className="bg-primary/20 text-primary">Paid</Badge>
    if (status === 'PARTIAL') return <Badge variant="secondary" className="bg-secondary/20 text-secondary">Partial</Badge>
    if (status === 'OVERDUE') return <Badge variant="destructive" className="bg-destructive/20 text-destructive">Overdue</Badge>
    if (status === 'WAIVED') return <Badge variant="outline" className="text-muted-foreground">Waived</Badge>
    return <Badge variant="outline">Unpaid</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Assignments"
        description="View assigned fees, track payments, and waive outstanding balances."
        actions={
          <Button onClick={() => { reset(); setIsAddOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Assign Fee
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-lowest">
                <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Fee Template</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading assignments...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No fees assigned yet.</td></tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="group hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {a.student?.firstName} {a.student?.lastName}
                        <div className="text-xs font-mono text-muted-foreground">{a.student?.studentId}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{a.feeTemplate?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-primary">{formatCurrency(a.totalAmount)}</div>
                        <div className="text-xs text-muted-foreground">Paid: {formatCurrency(a.paidAmount)}</div>
                      </td>
                      <td className="px-6 py-4">{renderStatus(a.status)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(a.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {a.status !== 'PAID' && a.status !== 'WAIVED' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => {
                              if (confirm('Are you sure you want to waive this fee?')) {
                                waiveMutation.mutate(a.id)
                              }
                            }}
                          >
                            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Waive
                          </Button>
                        )}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Fee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <select 
                {...register('studentId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                ))}
              </select>
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Fee Template</Label>
              <select 
                {...register('feeTemplateId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a fee...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {formatCurrency(t.amount)}</option>
                ))}
              </select>
              {errors.feeTemplateId && <p className="text-xs text-destructive">{errors.feeTemplateId.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Assigning...' : 'Assign Fee'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
