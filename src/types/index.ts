export type UserRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roleId?: string
  role?: Role
  tenantId?: string
}

export interface Role {
  id: string
  name: string
  description?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  tenantId: string | null
}

export interface Student {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  dob?: string
  guardian?: { name: string; phone: string; email: string }
  createdAt: string
}

export interface Teacher {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  subject?: string
  createdAt: string
}

export interface Class {
  id: string
  tenantId: string
  name: string
  level?: string
  teacherId?: string
  teacher?: Teacher
  _count?: { enrollments: number }
}

export interface Attendance {
  id: string
  studentId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  remarks?: string
}

export interface Grade {
  id: string
  studentId: string
  subjectId: string
  subject?: Subject
  assignmentId?: string
  assignment?: Assignment
  score: number
  maxScore: number
  remarks?: string
  gradedAt: string
}

export interface Subject {
  id: string
  name: string
  code?: string
  description?: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  maxScore: number
  dueDate?: string
}

export interface Fee {
  id: string
  name: string
  amount: number
  dueDate: string
}

export interface Payment {
  id: string
  feeId: string
  fee?: Fee
  studentId: string
  student?: Student
  amount: number
  method: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  createdAt: string
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface Term {
  id: string
  academicYearId: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  genre?: string
  totalCopies: number
  available: number
}

export interface Course {
  id: string
  title: string
  description?: string
  thumbnail?: string
  teacherId: string
  subjectId?: string
  subject?: Subject
  duration?: number
  level?: string
  isPublished: boolean
  modules?: CourseModule[]
  _count?: { enrollments: number }
}

export interface CourseModule {
  id: string
  courseId: string
  title: string
  order: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  type: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT'
  videoUrl?: string
  duration?: number
  order: number
}

export interface CourseEnrollment {
  id: string
  courseId: string
  course?: Course
  studentId: string
  progress: number
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  enrollDate: string
  completedAt?: string
}

export interface LiveClass {
  id: string
  title: string
  teacherId: string
  scheduledAt: string
  duration: number
  platform: string
  meetingUrl?: string
  recordingUrl?: string
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
}

export interface Discussion {
  id: string
  courseId: string
  title: string
  content: string
  authorId: string
  authorType: string
  isPinned: boolean
  createdAt: string
  replies?: DiscussionReply[]
}

export interface DiscussionReply {
  id: string
  discussionId: string
  content: string
  authorId: string
  authorType: string
  createdAt: string
}

export interface Certificate {
  id: string
  courseId: string
  course?: Course
  studentId: string
  certificateNumber: string
  issuedAt: string
}

export interface Event {
  id: string
  title: string
  description?: string
  type: string
  venue?: string
  startDate: string
  endDate?: string
}

export interface ApiError {
  error: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
