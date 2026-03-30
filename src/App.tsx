import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { TeachersPage, ClassesPage, PaymentsPage } from '@/pages/shared/ModulePages'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const SchoolSetupPage = lazy(() => import('@/pages/auth/SchoolSetupPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const StudentsPage = lazy(() => import('@/pages/students/StudentsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const GradesPage = lazy(() => import('@/pages/grades/GradesPage'))
const EventsPage = lazy(() => import('@/pages/events/EventsPage'))
const LibraryPage = lazy(() => import('@/pages/library/LibraryPage'))
const TransportPage = lazy(() => import('@/pages/transport/TransportPage'))
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'))
const SportsPage = lazy(() => import('@/pages/sports/SportsPage'))
const HostelPage = lazy(() => import('@/pages/hostel/HostelPage'))
const HealthPage = lazy(() => import('@/pages/health/HealthPage'))
const DisciplinaryPage = lazy(() => import('@/pages/disciplinary/DisciplinaryPage'))
const CoursesPage = lazy(() => import('@/pages/courses/CoursesPage'))
const ELearningPage = lazy(() => import('@/pages/elearning/ELearningPage'))
const CertificatesPage = lazy(() => import('@/pages/certificates/CertificatesPage'))
const ParentPage = lazy(() => import('@/pages/parent/ParentPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const UnauthorizedPage = lazy(() => import('@/pages/system/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('@/pages/system/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
})

function RouteFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  )
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/setup-school" element={<PublicOnlyRoute><SchoolSetupPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><StudentsPage /></ProtectedRoute>} />
              <Route path="/teachers" element={<ProtectedRoute allowedRoles={['ADMIN']}><TeachersPage /></ProtectedRoute>} />
              <Route path="/classes" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><ClassesPage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><AttendancePage /></ProtectedRoute>} />
              <Route path="/grades" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><GradesPage /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute allowedRoles={['ADMIN']}><PaymentsPage /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><EventsPage /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STAFF']}><LibraryPage /></ProtectedRoute>} />
              <Route path="/transport" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><TransportPage /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><InventoryPage /></ProtectedRoute>} />
              <Route path="/sports" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><SportsPage /></ProtectedRoute>} />
              <Route path="/hostel" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HostelPage /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}><HealthPage /></ProtectedRoute>} />
              <Route path="/disciplinary" element={<ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER']}><DisciplinaryPage /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}><CoursesPage /></ProtectedRoute>} />
              <Route path="/elearning" element={<ELearningPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/parent" element={<ProtectedRoute allowedRoles={['PARENT']}><ParentPage /></ProtectedRoute>} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
