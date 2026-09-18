import { AttendanceStatus } from '@/types'

// Active pill styling per status, mapping to our CSS Variables (Design Tokens)
export const ATTENDANCE_ACTIVE_PILL: Record<AttendanceStatus, string> = {
  PRESENT: 'border-primary bg-primary-fixed text-on-secondary-fixed',
  LATE: 'border-secondary-container bg-secondary-fixed text-on-secondary-fixed',
  ABSENT: 'border-error-container bg-error-container text-error-on',
  EXCUSED: 'border-outline-variant bg-surface-container-high text-on-surface',
}

// Background tint styling per status row
export const ATTENDANCE_ROW_TINT: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-primary-fixed/10',
  LATE: 'bg-secondary-fixed/20',
  ABSENT: 'bg-error-container/25',
  EXCUSED: 'bg-surface-container-low',
}

// Format status for display (e.g. "PRESENT" -> "Present")
export const formatStatus = (status: AttendanceStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

// Count attendance by status
export const countByStatus = (marks: Record<string, AttendanceStatus>) => {
  const counts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  }

  Object.values(marks).forEach(status => {
    counts[status]++
  })

  return counts
}
