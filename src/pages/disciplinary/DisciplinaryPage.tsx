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
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  incidentDate: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  severity: z.string().min(1, 'Required'),
  actionTaken: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const severityVariant: Record<string, any> = { Minor: 'warning', Major: 'destructive', Severe: 'destructive' }

export default function DisciplinaryPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['disciplinary'],
    queryFn: () => api.get('/disciplinary/records').then(r => r.data),
  })
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: () => api.get('/students').then(r => r.data) })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/disciplinary/records', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['disciplinary'] }); toast.success('Record created'); setOpen(false); reset() },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const columns: ColumnDef<any>[] = [
    { id: 'student', header: 'Student', cell: ({ row }) => {
      const s = students.find((s: any) => s.id === row.original.studentId) as any
      return s ? `${s.firstName} ${s.lastName}` : '—'
    }},
    { accessorKey: 'incidentDate', header: 'Date', cell: ({ getValue }) => formatDate(getValue() as string) },
    { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => <span className="line-clamp-1 max-w-xs">{getValue() as string}</span> },
    { accessorKey: 'severity', header: 'Severity', cell: ({ getValue }) => <Badge variant={severityVariant[getValue() as string] ?? 'secondary'}>{getValue() as string}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <Badge variant={(getValue() as string) === 'Resolved' ? 'success' : 'secondary'}>{getValue() as string}</Badge> },
    { accessorKey: 'actionTaken', header: 'Action', cell: ({ getValue }) => (getValue() as string) || '—' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Disciplinary</h1><p className="text-muted-foreground">{records.length} records</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Record</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Disciplinary Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Student</Label>
                <Select onValueChange={v => setValue('studentId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                </Select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Incident Date</Label><Input type="date" {...register('incidentDate')} /></div>
                <div className="space-y-1">
                  <Label>Severity</Label>
                  <Select onValueChange={v => setValue('severity', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Description</Label><Input {...register('description')} />{errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}</div>
              <div className="space-y-1"><Label>Action Taken</Label><Input {...register('actionTaken')} placeholder="Suspension, Warning..." /></div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Record'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={records} columns={columns} isLoading={isLoading} />
    </div>
  )
}
