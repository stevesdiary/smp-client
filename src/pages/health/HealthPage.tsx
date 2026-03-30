import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import { fetchHealthRecordsByStudent, type HealthRecordWithStudent } from '@/lib/moduleQueries'
import type { Student } from '@/types'
import { ModuleHero } from '@/components/shared/ModuleHero'

const schema = z.object({
  studentId: z.string().min(1, 'Required'),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function HealthPage() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['health-records'],
    queryFn: fetchHealthRecordsByStudent,
  })
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data),
  })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/health/records', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health-records'] }); toast.success('Health record created'); setOpen(false); reset() },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed')),
  })
  const recordsWithConditions = records.filter((record: any) => record.conditions)

  const columns: ColumnDef<HealthRecordWithStudent>[] = [
    { id: 'student', header: 'Student', cell: ({ row }) => {
      const s = row.original.student ?? students.find((candidate) => candidate.id === row.original.studentId)
      return s ? `${s.firstName} ${s.lastName}` : row.original.studentId
    }},
    { accessorKey: 'bloodGroup', header: 'Blood Group', cell: ({ getValue }) => (getValue() as string) || '—' },
    { accessorKey: 'allergies', header: 'Allergies', cell: ({ getValue }) => (getValue() as string) || 'None' },
    { accessorKey: 'conditions', header: 'Conditions', cell: ({ getValue }) => (getValue() as string) || 'None' },
    { id: 'incidents', header: 'Incidents', cell: ({ row }) => row.original.incidents?.length ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Student wellbeing"
        title="Keep health records visible from a cleaner care operations surface."
        description="Medical data still uses the current health record endpoints while the screen now fits the richer interface system."
        stats={[
          { label: 'Records', value: records.length, detail: 'Health records currently available.' },
          { label: 'Students', value: students.length, detail: 'Students eligible for record creation.' },
          { label: 'Conditions', value: recordsWithConditions.length, detail: 'Records with stored medical conditions.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Health Records</h1><p className="text-muted-foreground">{records.length} records</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="h-12 rounded-2xl px-5"><Plus className="h-4 w-4 mr-2" />New Record</Button></DialogTrigger>
          <DialogContent className="rounded-[28px]">
            <DialogHeader><DialogTitle>Create Health Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              <div className="space-y-1">
                <Label>Student</Label>
                <Select onValueChange={v => setValue('studentId', v)}>
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.firstName} {student.lastName}</SelectItem>)}</SelectContent>
                </Select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Blood Group</Label><Input className="h-11 rounded-2xl" {...register('bloodGroup')} placeholder="A+" /></div>
                <div className="space-y-1"><Label>Allergies</Label><Input className="h-11 rounded-2xl" {...register('allergies')} placeholder="Peanuts, Dust..." /></div>
              </div>
              <div className="space-y-1"><Label>Medical Conditions</Label><Input className="h-11 rounded-2xl" {...register('conditions')} placeholder="Asthma, Diabetes..." /></div>
              <Button type="submit" className="h-11 w-full rounded-2xl" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Record'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={records} columns={columns} isLoading={isLoading} />
    </div>
  )
}
