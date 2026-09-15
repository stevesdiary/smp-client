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

export default function AttendanceSummary({ marks, students, onSave, onGoBack }: AttendanceSummaryProps) {
  const counts = countByStatus(marks)
  const markedIds = new Set(Object.keys(marks))
  const unmarked = students.filter((s) => !markedIds.has(s.studentId || s.studentCode || s.id))

  const chips = [
    { label: 'Total', value: students.length, cls: 'bg-surface-container-high text-on-surface' },
    { label: 'Present', value: counts.PRESENT, cls: 'bg-primary-fixed text-on-secondary-fixed' },
    { label: 'Late', value: counts.LATE, cls: 'bg-secondary-fixed text-on-secondary-fixed' },
    { label: 'Absent', value: counts.ABSENT, cls: 'bg-[#ffdad6] text-[#93000a]' },
    { label: 'Excused', value: counts.EXCUSED, cls: 'bg-surface-container-high text-on-surface' },
    { label: 'Unmarked', value: unmarked.length, cls: 'bg-surface-container-low text-muted-foreground' },
  ]

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-soft lg:p-8">
      <h2 className="mb-6 font-headline text-xl font-extrabold text-on-surface">Review Attendance</h2>

      <div className="mb-6 flex flex-wrap gap-3">
        {chips.map((c) => (
          <div key={c.label} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${c.cls}`}>
            <span className="font-mono">{c.value}</span>
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{c.label}</span>
          </div>
        ))}
      </div>

      {unmarked.length > 0 && (
        <div className="mb-6 rounded-2xl bg-secondary-fixed/30 p-4">
          <p className="mb-2 text-sm font-bold text-on-secondary-fixed">{unmarked.length} students not yet marked:</p>
          <p className="text-sm text-on-secondary-fixed/80">{unmarked.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}</p>
          <button
            onClick={onGoBack}
            className="mt-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Go Back &amp; Edit
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          Save Attendance
        </button>
        <button
          onClick={onGoBack}
          className="rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
