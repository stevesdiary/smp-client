import { AttendanceStatus } from '@/types'

// Status badge and row background colors
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { text: string; bg: string; row: string }> = {
  PRESENT: {
    text: '#16a34a',      // green-600
    bg: '#dcfce7',        // green-100
    row: '#f0fdf4',       // green-50
  },
  ABSENT: {
    text: '#dc2626',      // red-600
    bg: '#fee2e2',        // red-100
    row: '#fef2f2',       // red-50
  },
  LATE: {
    text: '#f59e0b',      // amber-500
    bg: '#fef9c3',        // amber-100
    row: '#fffbeb',       // amber-50
  },
  EXCUSED: {
    text: '#64748b',      // slate-500
    bg: '#f1f5f9',        // slate-100
    row: '#f8fafc',       // slate-50
  },
}

// Get text color for a status
export const getStatusTextColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return '#94a3b8' // slate-400 for unmarked
  return ATTENDANCE_STATUS_COLORS[status].text
}

// Get background color for a status
export const getStatusBgColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return 'white'
  return ATTENDANCE_STATUS_COLORS[status].bg
}

// Get row background color for a status
export const getRowBgColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return 'white'
  return ATTENDANCE_STATUS_COLORS[status].row
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
