import api from '@/lib/api'
import type { Grade, Payment, Student } from '@/types'

export type PaymentWithStudent = Payment & { student?: Student }
export type GradeWithStudent = Grade & { student?: Student }
export type HealthRecordWithStudent = {
  id: string
  studentId: string
  bloodGroup?: string | null
  allergies?: string | null
  conditions?: string | null
  incidents?: unknown[]
  student: Student
}

export async function fetchStudents() {
  const response = await api.get<Student[]>('/students')
  return response.data
}

export async function fetchAllPaymentsByStudent() {
  const students = await fetchStudents()
  const paymentsByStudent = await Promise.all(
    students.map(async (student) => {
      try {
        const response = await api.get<Payment[]>(`/payments/student/${student.id}`)
        return response.data.map((payment) => ({
          ...payment,
          student: payment.student ?? student,
        }))
      } catch {
        return [] as PaymentWithStudent[]
      }
    })
  )

  return paymentsByStudent.flat()
}

export async function fetchAllGradesByStudent() {
  const students = await fetchStudents()
  const gradesByStudent = await Promise.all(
    students.map(async (student) => {
      try {
        const response = await api.get<Grade[]>(`/gradebook/grades/student/${student.id}`)
        return response.data.map((grade) => ({
          ...grade,
          student: student,
        }))
      } catch {
        return [] as GradeWithStudent[]
      }
    })
  )

  return gradesByStudent.flat()
}

export async function fetchHealthRecordsByStudent() {
  const students = await fetchStudents()
  const records = await Promise.all(
    students.map(async (student) => {
      try {
        const response = await api.get<HealthRecordWithStudent | null>(`/health/records/${student.id}`)
        if (!response.data) return null
        return {
          ...response.data,
          student,
        }
      } catch {
        return null
      }
    })
  )

  return records.filter((record): record is HealthRecordWithStudent => Boolean(record))
}
