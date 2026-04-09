# smp-client

React + TypeScript frontend for EDUPLUS — a multi-tenant SaaS school management platform.

<!-- AUTO-MANAGED: architecture -->
## Architecture

- `src/pages/` - Route-level page components (e.g. `auth/LoginPage.tsx`)
- `src/pages/shared/ModulePages.tsx` - Named exports: `TeachersPage`, `ClassesPage`, `PaymentsPage` (not lazy-loaded); also contains a local `ModuleHero` component distinct from `@/components/shared/ModuleHero`
- `src/store/` - Zustand state stores
- `src/types/` - Shared TypeScript interfaces and types (`src/types/index.ts`)
- `src/lib/` - Shared utilities (`api.ts` axios instance, `utils.ts`, `moduleQueries.ts`)
- `src/components/ui/` - Shadcn UI component library (Button, Input, Card, Label, …)
- `src/components/shared/ModuleHero` - Shared hero banner used by `AcademicYearsPage`, `SubjectsPage`, `TimetablePage` (and others); **not** used by `StudentsPage` (inline hero) or `ModulePages.tsx` (has its own local copy)
- `src/components/shared/DataTable` - Shared data table used by Students, Subjects, Teachers, Classes, Payments pages

### Route → Role Access

All routes under `AppLayout` are wrapped in `ProtectedRoute`. Role-restricted routes use `allowedRoles`:

| Route | Allowed Roles |
|-------|--------------|
| `/students` | ADMIN, TEACHER |
| `/teachers` | ADMIN |
| `/classes` | ADMIN, TEACHER |
| `/academic-years` | ADMIN, PRINCIPAL |
| `/subjects` | ADMIN, TEACHER |
| `/timetable` | ADMIN, TEACHER |
| `/attendance` | ADMIN, TEACHER |
| `/grades` | ADMIN, TEACHER |
| `/payments` | ADMIN |
| `/events` | ADMIN, TEACHER |
| `/library` | ADMIN, TEACHER, STAFF |
| `/transport`, `/inventory`, `/hostel`, `/health` | ADMIN, STAFF |
| `/sports`, `/courses` | ADMIN, TEACHER |
| `/disciplinary` | ADMIN, PRINCIPAL, TEACHER |
| `/parent` | PARENT |
| `/elearning`, `/certificates`, `/settings` | unrestricted |
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->
## Patterns

### Auth Store (`useAuthStore`)

- Zustand store in `src/store/authStore.ts`; state: `user`, `token`, `tenantId`
- `login(token, user)` — derives `tenantId` from `user.tenantSubdomain ?? user.tenantId ?? null`; writes `token`, `tenantId`, `user` to localStorage and sets store state
- `logout()` — clears all three localStorage keys and nulls store state
- Store hydrated from localStorage on module init (parse error → null, not thrown)

### Login Flow

- `LoginPage` uses react-hook-form + zod resolver (fields: `schoolCode`, `email`, `password`); wrapped in `AuthShell` layout component
- `schoolCode` initial value: `?schoolCode` query param → `localStorage.getItem('tenantId')` → `''`
- On submit: writes `schoolCode.trim().toLowerCase()` to `localStorage` as `tenantId`, calls `api.post('/auth/login', {email, password})`, then `useAuthStore.login(token, user)`, navigates to `/dashboard`
- Error shown via `sonner` toast using `getApiErrorMessage(error, 'Login failed')`
- Links to: `/setup-school`, `/forgot-password`; also `/register` ("Create staff account")

### Sidebar Navigation

- `Sidebar` filters `allNavItems` by the user's role string (via `getUserRole(user)` from `@/lib/auth`)
- Items grouped into sections: `"Command center"`, `"Academic core"`, `"Operations"`, `"Campus life"`, `"Digital learning"`, `"Family access"`, `"System"`
- Sidebar shows `${tenantId}.eduplus` as workspace label; falls back to `"Multi-role workspace"` if no tenantId
- `getUserRole` imported from `@/lib/auth`; `useAuthStore` provides `user`, `tenantId`, `logout`

### Page Pattern (CRUD feature pages)

- All feature pages use `react-hook-form` + `zod` for form validation
- Data fetching/mutation via `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`); `QueryClient` defaults: `retry: 1`, `staleTime: 30_000`, `refetchOnWindowFocus: false`
- Mutations call `qc.invalidateQueries` on success and show `toast.success/error` via `sonner`
- Most pages open a `Dialog` for create/edit; delete calls mutation directly
- Pages using `DataTable`: `StudentsPage`, `SubjectsPage`, `TeachersPage`, `ClassesPage`
- Pages using `@/components/shared/ModuleHero`: `AcademicYearsPage`, `SubjectsPage`, `TimetablePage`
- `StudentsPage` uses an inline hero section (same gradient style, no shared component); `ModulePages.tsx` has its own local `ModuleHero` function

### AcademicYearsPage

- `AcademicYearCard`: expandable; terms loaded lazily via `useQuery(['terms', year.id])` only when expanded
- Add year: `POST /academic-years` `{ name, startDate, endDate }`; delete: `DELETE /academic-years/{id}`
- Add term: `POST /terms` `{ name, startDate, endDate, academicYearId }`; terms fetched via `GET /terms?academicYearId={id}`

### SubjectsPage

- Create requires `classId` (UUID) and `academicYearId` (UUID) — both mandatory
- Update omits `classId` and `academicYearId` (immutable after creation)
- Assign teacher via `PUT /subjects/{id}/assign-teacher` with `{ teacherId }` body
- `SubjectRow` local type includes `class?: Class`, `teacher?: Teacher`, `academicYear?: AcademicYear` for display

### TimetablePage

- Class-scoped view: user selects a class; entries fetched via `GET /timetable/class/{classId}`
- Create via `POST /timetable` with `{ subjectId, teacherId, academicYearId, dayOfWeek (0–6), startTime (HH:MM), endTime (HH:MM), room?, classId }`
- `SCHOOL_DAYS = [1,2,3,4,5]` (Mon–Fri); `DAY_NAMES[0]` = `"Sunday"`
- Per-day color coding via `DAY_TONE` map keyed by day number: 1=teal, 2=amber, 3=sky, 4=violet, 5=rose
- `classSubjects` filtered as `subjects.filter(s => !s.classId || s.classId === selectedClassId)`

### Type Conventions

- `User.role` is `Role { id, name, description? }` — the RBAC role object, not the `UserRole` string enum
- `UserRole` union type: `'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT'`
- Core domain interfaces in `src/types/index.ts`: `User`, `Role`, `AuthState`, `Student`, `Teacher`, `Class`, `Attendance`, `Grade`, `Subject`, `Assignment`, `Fee`, `Payment`, `AcademicYear`, `Term`, `Book`, `Course`, `CourseModule`, `Lesson`, `CourseEnrollment`, `LiveClass`, `Discussion`, `DiscussionReply`, `Certificate`, `Event`
- `AcademicYear`: `{ id, name, startDate, endDate, isCurrent }`; `Term`: `{ id, academicYearId, name, startDate, endDate, isCurrent }`
- Utility types in `src/types/index.ts`: `ApiError` (`{ error: string }`), `PaginatedResponse<T>` (`{ data: T[], total, page, limit }`)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->
## Key Dependencies

- `src/store/authStore.ts` — `useAuthStore`: auth state, login/logout actions, localStorage persistence
- `src/types/index.ts` — all shared TS interfaces; import from `@/types`
- `src/lib/api.ts` — configured axios instance; use for all API calls
- `src/lib/utils.ts` — `getApiErrorMessage(error, fallback)`: extracts error message from axios errors; `formatDate(dateStr)`: formats ISO date strings; `formatCurrency(amount)`: formats currency values
- `src/lib/moduleQueries.ts` — `fetchAllPaymentsByStudent`: used by `PaymentsPage` in `ModulePages.tsx`
- `src/lib/auth.ts` — `getUserRole(user)`: returns the `UserRole` string for a user (used by Sidebar and ProtectedRoute)
- `src/components/shared/ModuleHero` — hero banner component used by most feature pages
- `src/components/shared/DataTable` — generic data table; used by Students, Subjects, Teachers, Classes, Payments
<!-- END AUTO-MANAGED -->
