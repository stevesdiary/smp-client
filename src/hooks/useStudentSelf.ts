import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Grade, Attendance, Fee } from '@/types'

export interface StudentProfile {
  id: string
  studentId?: string
  studentCode?: string
  firstName: string
  lastName: string
  dob?: string
  guardian?: { name: string; phone: string; email: string }
  class?: { id: string; name: string }
}

export interface StudentTimetableEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room?: string
  subject?: { id: string; name: string }
  teacher?: { id: string; firstName: string; lastName: string }
  class?: { id: string; name: string }
}

export interface StudentFee extends Fee {
  payments?: Array<{ id: string; amount: number; paidAt: string }>
}

export function useStudentProfile() {
  return useQuery<StudentProfile>({
    queryKey: ['student-self', 'profile'],
    queryFn: () => api.get('/student/me/profile').then(r => r.data),
  })
}

export function useStudentTimetable(academicYearId?: string) {
  return useQuery<StudentTimetableEntry[]>({
    queryKey: ['student-self', 'timetable', academicYearId],
    queryFn: () => api.get('/student/me/timetable', { params: academicYearId ? { academicYearId } : undefined }).then(r => r.data),
  })
}

export function useStudentGrades(subjectId?: string) {
  return useQuery<Grade[]>({
    queryKey: ['student-self', 'grades', subjectId],
    queryFn: () => api.get('/student/me/grades', { params: subjectId ? { subjectId } : undefined }).then(r => r.data),
  })
}

export function useStudentAttendance(params?: { startDate?: string; endDate?: string }) {
  return useQuery<Attendance[]>({
    queryKey: ['student-self', 'attendance', params],
    queryFn: () => api.get('/student/me/attendance', { params }).then(r => r.data),
  })
}

export function useStudentFees() {
  return useQuery<StudentFee[]>({
    queryKey: ['student-self', 'fees'],
    queryFn: () => api.get('/student/me/fees').then(r => r.data),
  })
}

export function useStudentReportCard(termId: string) {
  return useQuery({
    queryKey: ['student-self', 'report-card', termId],
    queryFn: () => api.get('/student/me/report-card', { params: { termId } }).then(r => r.data),
    enabled: !!termId,
  })
}
