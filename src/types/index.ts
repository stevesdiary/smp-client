export type UserRole = 'MASTER' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT'

export interface User {
  id: string
  email?: string
  studentCode?: string
  firstName?: string
  lastName?: string
  roleId?: string
  role?: Role
  tenantId?: string
  tenantSubdomain?: string
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
  refreshToken?: string | null
}

export interface Student {
  id: string
  tenantId: string
  studentId?: string
  studentCode?: string
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
  academicYearId?: string
  classId?: string
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
  description?: string
  order: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  content?: string
  type: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'ASSIGNMENT'
  videoUrl?: string
  duration?: number
  order: number
  progress?: LessonPlaybackProgress
  quizzes?: Quiz[]
}

export interface LessonPlaybackProgress {
  completed: boolean
  timeSpent: number
  lastAccessed?: string | null
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

export interface RecordedCourse extends Course {
  enrollmentId: string
  enrollmentProgress: number
  enrollmentStatus: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  modules: CourseModule[]
}

export type QuizPlacement = 'LESSON' | 'ACADEMIC'
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED'
export type QuizGradeSinkType = 'NONE' | 'ASSIGNMENT' | 'EXAMINATION'
export type QuizResultsVisibility = 'AFTER_CLOSE'
export type QuizQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE'

export interface QuizQuestionOption {
  id: string
  label: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  type: QuizQuestionType
  options?: QuizQuestionOption[]
  correctAnswer?: string | boolean
  points: number
}

export interface QuizAttempt {
  id: string
  submittedForStudentId?: string
  submittedByUserId?: string | null
  attemptNumber: number
  score: number | null
  passed: boolean | null
  officialScoreApplied: boolean
  answers: Array<{ questionId: string; answer: string | boolean }>
  startedAt: string
  deadlineAt?: string | null
  completedAt?: string | null
}

export interface Quiz {
  id: string
  placement: QuizPlacement
  status: QuizStatus
  lessonId?: string | null
  courseId?: string | null
  academicYearId?: string | null
  termId?: string | null
  subjectId?: string | null
  title: string
  description?: string | null
  durationMinutes?: number | null
  attemptLimit?: number | null
  passMark: number
  availableFrom?: string | null
  availableUntil?: string | null
  gradeSinkType: QuizGradeSinkType
  assignmentId?: string | null
  examinationId?: string | null
  resultsVisibility: QuizResultsVisibility
  questionCount: number
  questions?: QuizQuestion[]
  lesson?: { id: string; title: string; moduleId?: string | null } | null
  course?: { id: string; title: string; isPublished?: boolean } | null
  subject?: { id: string; name: string; code?: string | null } | null
  latestOfficialScoreSummary?: { latestAttempts: number; averageScore: number | null; passed: number }
  attemptsCount?: number
  activeAttempt?: QuizAttempt | null
  latestAttempt?: QuizAttempt | null
  isAvailable?: boolean
  isAssignedToStudent?: boolean
  resultsReleased?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface QuizCreatePayload {
  placement: QuizPlacement
  lessonId?: string
  academicYearId?: string
  termId?: string
  subjectId?: string
  title: string
  description?: string
  durationMinutes?: number
  attemptLimit?: number
  passMark?: number
  availableFrom?: string
  availableUntil?: string
  gradeSinkType?: QuizGradeSinkType
  questions: QuizQuestion[]
}

export type QuizUpdatePayload = Partial<QuizCreatePayload>

export interface QuizListFilters {
  lessonId?: string
  courseId?: string
  subjectId?: string
  placement?: QuizPlacement
  status?: QuizStatus
}

export interface StaffQuizSubmitPayload {
  studentId: string
  answers: Array<{ questionId: string; answer: string | boolean }>
  reason?: string
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

export interface Notice {
  id: string
  authorId: string
  title: string
  content: string
  targetRoles: UserRole[]
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    email?: string
    firstName?: string
    lastName?: string
    role?: Role
  }
}

export interface ApiError {
  error: string
}

export interface EBook {
  id: string
  tenantId: string
  bookId?: string
  book?: { id: string; available: number; totalCopies: number }
  title: string
  author: string
  description?: string
  coverUrl?: string
  genre?: string
  isbn?: string
  fileKey: string
  fileSize: number
  fileType: 'PDF' | 'EPUB'
  isDownloadable: boolean
  createdAt: string
}

export interface ReadingProgress {
  currentPage: number
  totalPages?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
