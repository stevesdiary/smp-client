import type { User, UserRole } from '@/types'

export const ALL_ROLES: UserRole[] = ['MASTER', 'ADMIN', 'PRINCIPAL', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT']

export function getUserRole(user: User | null): UserRole {
  const rawRole = user?.role?.name ?? ''
  const normalized = rawRole.toUpperCase()
  if (ALL_ROLES.includes(normalized as UserRole)) {
    return normalized as UserRole
  }
  return 'STUDENT'
}
