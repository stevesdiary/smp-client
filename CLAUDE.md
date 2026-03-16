# smp-client

React + TypeScript frontend for EDUPLUS — a multi-tenant SaaS school management platform.

<!-- AUTO-MANAGED: architecture -->
## Architecture

- `src/pages/` - Route-level page components (e.g. `auth/LoginPage.tsx`)
- `src/store/` - Zustand state stores
- `src/types/` - Shared TypeScript interfaces and types (`src/types/index.ts`)
- `src/lib/` - Shared utilities (`api.ts` axios instance, `utils.ts`)
- `src/components/ui/` - Shadcn UI component library (Button, Input, Card, Label, …)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->
## Patterns

### Auth Store (`useAuthStore`)

- Zustand store in `src/store/authStore.ts`; state: `user`, `token`, `tenantId`
- `login(token, user)` — writes `token`, `tenantId`, `user` to localStorage and sets store state
- `logout()` — clears all three localStorage keys and nulls store state
- Store hydrated from localStorage on module init (parse error → null, not thrown)

### Login Flow

- `LoginPage` uses react-hook-form + zod resolver (`email` + `password` fields)
- Calls `api.post('/auth/login', ...)` → calls `useAuthStore.login(token, user)` → navigates to `/dashboard`
- Error shown via `sonner` toast using `getApiErrorMessage(error, fallback)`

### Type Conventions

- `User.role` is `Role { id, name, description? }` — the RBAC role object, not the `UserRole` string enum
- `UserRole` union type: `'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT'`
- Core domain interfaces in `src/types/index.ts`: `User`, `Role`, `AuthState`, `Student`, `Teacher`, `Class`, `Attendance`, `Grade`, `Subject`, `Assignment`, `Fee`, `Payment`, `AcademicYear`, `Term`, `Book`, `Course`, `CourseModule`, `Lesson`, `CourseEnrollment`, `LiveClass`, `Discussion`
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->
## Key Dependencies

- `src/store/authStore.ts` — `useAuthStore`: auth state, login/logout actions, localStorage persistence
- `src/types/index.ts` — all shared TS interfaces; import from `@/types`
- `src/lib/api.ts` — configured axios instance; use for all API calls
- `src/lib/utils.ts` — `getApiErrorMessage(error, fallback)`: extracts error message from axios errors
<!-- END AUTO-MANAGED -->
