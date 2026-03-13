import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { UserRole } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getUserRole(user)
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}
