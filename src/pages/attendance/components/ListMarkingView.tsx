import { Student, AttendanceStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ATTENDANCE_STATUS_COLORS,
  formatStatus,
} from './attendanceStyles'

interface ListMarkingViewProps {
  students: Student[]
  marks: Record<string, AttendanceStatus>
  onMark: (studentId: string, status: AttendanceStatus) => void
  onFinish: () => void
  isLoading?: boolean
}

export default function ListMarkingView({
  students,
  marks,
  onMark,
  onFinish,
  isLoading = false,
}: ListMarkingViewProps) {
  const statuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

  if (!students.length) {
    return (
      <Card className="p-8 text-center bg-slate-50">
        <p className="text-sm text-slate-600">No students in this class.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Student list */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="max-h-[600px] overflow-y-auto">
          {students.map(student => {
            const studentId = student.studentId || student.studentCode || student.id
            const currentStatus = marks[studentId]
            const rowBg = currentStatus
              ? ATTENDANCE_STATUS_COLORS[currentStatus].row
              : 'white'

            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0 transition-colors"
                style={{ backgroundColor: rowBg }}
              >
                {/* Student info */}
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {studentId}
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {statuses.map(status => {
                    const isActive = currentStatus === status
                    const colors = ATTENDANCE_STATUS_COLORS[status]

                    return (
                      <button
                        key={status}
                        onClick={() => onMark(studentId, status)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors border"
                        style={{
                          backgroundColor: isActive ? colors.bg : 'white',
                          color: isActive ? colors.text : '#94a3b8',
                          borderColor: isActive ? colors.text : '#e2e8f0',
                        }}
                        title={`Mark as ${formatStatus(status)}`}
                        aria-label={`Mark ${student.firstName} as ${formatStatus(status)}`}
                      >
                        {formatStatus(status)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Finish button */}
      <div className="flex justify-end">
        <Button
          onClick={onFinish}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Review & Finish
        </Button>
      </div>
    </div>
  )
}
