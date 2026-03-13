import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Search } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/shared/DataTable'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'
import type { Student } from '@/types'

type CertificateRow = {
  certificateNumber: string
  course?: { title?: string }
  studentId: string
  issuedAt: string
}

type VerifiedCertificate = {
  course?: { title?: string }
  issuedAt: string
}

export default function CertificatesPage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const canLoadByStudent = role === 'ADMIN' || role === 'TEACHER'

  const [certNumber, setCertNumber] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [verified, setVerified] = useState<VerifiedCertificate | null>(null)
  const [verifyError, setVerifyError] = useState('')

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((response) => response.data),
    enabled: canLoadByStudent,
  })

  const { data: certs = [], isLoading: certsLoading } = useQuery<CertificateRow[]>({
    queryKey: ['certificates', selectedStudentId],
    queryFn: () => api.get(`/elearning/certificates/${selectedStudentId}`).then((response) => response.data),
    enabled: canLoadByStudent && Boolean(selectedStudentId),
  })

  const verify = async () => {
    if (!certNumber.trim()) return
    setVerifyError('')
    setVerified(null)
    try {
      const response = await api.get<VerifiedCertificate>(`/elearning/certificates/verify/${certNumber.trim()}`)
      setVerified(response.data)
    } catch {
      setVerifyError('Certificate not found or invalid.')
    }
  }

  const columns: ColumnDef<CertificateRow>[] = [
    { accessorKey: 'certificateNumber', header: 'Certificate #' },
    { id: 'course', header: 'Course', cell: ({ row }) => row.original.course?.title ?? '—' },
    { accessorKey: 'studentId', header: 'Student ID' },
    { accessorKey: 'issuedAt', header: 'Issued', cell: ({ getValue }) => formatDate(getValue() as string) },
    { id: 'status', header: 'Status', cell: () => <Badge variant="success">Valid</Badge> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Certificates</h1>
        <p className="text-muted-foreground">Verify and review completion certificates</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Verify Certificate Number</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter certificate number (e.g. CERT-1234567890-abc12345)"
              value={certNumber}
              onChange={(event) => setCertNumber(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && verify()}
            />
            <Button onClick={verify} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Verify
            </Button>
          </div>
          {verified && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <Award className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">Valid Certificate</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {verified.course?.title} · Issued {formatDate(verified.issuedAt)}
                </p>
              </div>
            </div>
          )}
          {verifyError && <p className="mt-2 text-sm text-destructive">{verifyError}</p>}
        </CardContent>
      </Card>

      {canLoadByStudent && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label>Load certificates by student</Label>
            <Select onValueChange={setSelectedStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudentId ? (
              <DataTable data={certs} columns={columns} isLoading={certsLoading} />
            ) : (
              <p className="text-sm text-muted-foreground">Select a student to view their certificates.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
