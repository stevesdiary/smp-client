import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { AttendanceStatus, Student } from '@/types'
import { countByStatus } from './attendanceStyles'

interface AttendanceSummaryProps {
  marks: Record<string, AttendanceStatus>
  students: Student[]
  date: string
  classId: string
  onSave: () => void
  onGoBack: () => void
}

export default function AttendanceSummary({
  marks,
  students,
  date,
  classId,
  onSave,
  onGoBack,
}: AttendanceSummaryProps) {
  const counts = countByStatus(marks)
  const markedStudentIds = new Set(Object.keys(marks))
  const unmarkedStudents = students.filter(s => !markedStudentIds.has(s.studentId || s.studentCode || s.id))

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Review Attendance</h2>

      {/* Summary counts */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="text-sm font-medium text-gray-600">
          Total: {students.length}
        </div>
        <div className="text-sm font-medium text-green-600">
          {counts.PRESENT} Present
        </div>
        <div className="text-sm font-medium text-red-600">
          {counts.ABSENT} Absent
        </div>
        <div className="text-sm font-medium text-amber-600">
          {counts.LATE} Late
        </div>
        <div className="text-sm font-medium text-gray-600">
          {counts.EXCUSED} Excused
        </div>
        <div className="text-sm font-medium text-blue-600">
          {unmarkedStudents.length} Unmarked
        </div>
      </div>

      {/* Unmarked students list */}
      {unmarkedStudents.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-semibold text-yellow-900 mb-2">
            {unmarkedStudents.length} students not yet marked:
          </p>
          <ul className="list-disc list-inside text-sm text-yellow-800">
            {unmarkedStudents.map(student => (
              <li key={student.id}>
                {student.firstName} {student.lastName}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="mt-3"
            onClick={onGoBack}
          >
            Go Back &amp; Edit
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="default"
          onClick={onSave}
        >
          Save Attendance
        </Button>
        <Button
          variant="outline"
          onClick={onGoBack}
        >
          Cancel
        </Button>
      </div>
    </Card>
  )
}
