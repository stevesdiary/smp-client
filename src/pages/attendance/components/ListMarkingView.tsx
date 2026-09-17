import { Student, AttendanceStatus } from '@/types'
import { formatStatus } from './attendanceStyles'

interface ListMarkingViewProps {
  students: Student[]
  marks: Record<string, AttendanceStatus>
  onMark: (studentId: string, status: AttendanceStatus) => void
  onFinish: () => void
  isLoading?: boolean
}

const STATUSES: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']

// Active pill styling per status, using SchoolOS tokens
const ACTIVE_PILL: Record<AttendanceStatus, string> = {
  PRESENT: 'border-primary bg-primary-fixed text-on-secondary-fixed',
  LATE: 'border-secondary-container bg-secondary-fixed text-on-secondary-fixed',
  ABSENT: 'border-error-container bg-error-container text-error-on',
  EXCUSED: 'border-outline-variant bg-surface-container-high text-on-surface',
}
const ROW_TINT: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-primary-fixed/10',
  LATE: 'bg-secondary-fixed/20',
  ABSENT: 'bg-error-container/25',
  EXCUSED: 'bg-surface-container-low',
}

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function ListMarkingView({ students, marks, onMark, onFinish, isLoading = false }: ListMarkingViewProps) {
  if (!students.length) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-8 text-center text-sm text-muted-foreground shadow-soft">
        No students in this class.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft">
        <div className="flex items-center justify-between bg-surface-container-low px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>Student</span>
          <span>Attendance Status</span>
        </div>
        <div className="max-h-[560px] divide-y divide-outline-variant/10 overflow-y-auto">
          {students.map((student) => {
            const studentId = student.studentId || student.studentCode || student.id
            const current = marks[studentId]
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between gap-4 px-6 py-4 transition-colors ${current ? ROW_TINT[current] : ''}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-xs font-black text-primary-container">
                    {initials(student.firstName, student.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-on-surface">{student.firstName} {student.lastName}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{studentId}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {STATUSES.map((status) => {
                    const active = current === status
                    return (
                      <button
                        key={status}
                        onClick={() => onMark(studentId, status)}
                        disabled={isLoading}
                        aria-pressed={active}
                        aria-label={`Mark ${student.firstName} as ${formatStatus(status)}`}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                          active ? ACTIVE_PILL[status] : 'border-outline-variant/30 text-muted-foreground hover:bg-surface-container-low'
                        }`}
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
      </div>

      <div className="flex justify-end">
        <button
          onClick={onFinish}
          disabled={isLoading}
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          Review &amp; Finish
        </button>
      </div>
    </div>
  )
}
