# smp-client

React + TypeScript frontend for EDUPLUS — a multi-tenant SaaS school management platform.

<!-- AUTO-MANAGED: architecture -->
## Architecture

- `src/pages/` - Route-level page components (e.g. `auth/LoginPage.tsx`, `auth/StudentLoginPage.tsx`, `student/StudentPortalPage.tsx`)
- `src/hooks/` - Custom React hooks (e.g. `useStudentSelf.ts` for student self-service data fetching)
- `src/pages/shared/ModulePages.tsx` - Named exports: `TeachersPage`, `ClassesPage`, `PaymentsPage`, `PlaceholderPage` (not lazy-loaded); also contains a local `ModuleHero` component distinct from `@/components/shared/ModuleHero`
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
| `/gradebook` | ADMIN, TEACHER |
| `/payments` | ADMIN |
| `/events` | ADMIN, TEACHER |
| `/transport`, `/inventory`, `/hostel`, `/health` | ADMIN, STAFF |
| `/sports`, `/courses` | ADMIN, TEACHER |
| `/disciplinary` | ADMIN, PRINCIPAL, TEACHER |
| `/parent` | PARENT |
| `/billing`, `/candidates` | ADMIN |
| `/website-editor`, `/custom-domain-setup` | ADMIN |
| `/courses/:id` | ADMIN, TEACHER |
| `/student-portal` | STUDENT |
| `/fees` | ADMIN (planned — `FeesPage` not yet created) |
| `/notices`, `/library`, `/elearning`, `/certificates`, `/settings` | unrestricted |
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->
## Patterns

### Auth Store (`useAuthStore`)

- Zustand store in `src/store/authStore.ts`; state: `user`, `token`, `tenantId`, `refreshToken`
- `login(token, user, refreshToken?)` — derives `tenantId` from `user.tenantSubdomain ?? user.tenantId ?? null`; **always** writes or removes `tenantId` in localStorage (calls `removeItem` when null — fixes stale tenant bug for student logins); writes `token` and `user`; writes or removes `refreshToken` in localStorage
- `logout()` — fires fire-and-forget POST to `/auth/logout` with `{ refreshToken }` (sends `X-Tenant-ID` header if tenantId exists), then clears all four localStorage keys and nulls store state
- `setTokens(token, refreshToken?)` — updates token/refreshToken in localStorage and store without touching user or tenantId; **always** removes `refreshToken` from localStorage when called without one (fixes stale refreshToken bug)
- Store hydrated from localStorage on module init (parse error → null, not thrown); hydrates `refreshToken` from `localStorage.getItem('refreshToken')`
- Tests in `src/store/authStore.test.ts` (Vitest): cover both localStorage-clearing bug fixes

### Login Flow

- `LoginPage` uses react-hook-form + zod resolver (fields: `schoolCode`, `email`, `password`); wrapped in `AuthShell` layout component
- `schoolCode` initial value: `?schoolCode` query param → `localStorage.getItem('tenantId')` → `''`
- Uses `PasswordInput` from `@/components/ui/password-input` for the password field
- On submit: writes `schoolCode.trim().toLowerCase()` to `localStorage` as `tenantId`, calls `api.post('/auth/login', {email, password})`, then `useAuthStore.login(token, user, refreshToken)`, navigates to `/dashboard`
- Error shown via `sonner` toast using `getApiErrorMessage(error, 'Login failed')`
- Links to: `/setup-school`, `/forgot-password`; also `/register` ("Create staff account")

### School Setup Flow

- `SchoolSetupPage` uses react-hook-form + zod resolver; wrapped in `AuthShell` layout component
- Fields: `schoolName` (min 2), `schoolCode` (min 3, regex `/^[a-z0-9-]+$/`), `adminName` (min 2), `adminEmail`, `adminPassword` (validated via `passwordSchema` from `@/lib/passwordPolicy`), `schoolType` enum (`PRIMARY`|`SECONDARY`|`PRIMARY_SECONDARY`), `studentCount` (int 1–100000)
- Uses `PasswordInput` from `@/components/ui/password-input`; password hint shown via `passwordComplexityHint` from `@/lib/passwordPolicy`
- Default values: `schoolType='PRIMARY_SECONDARY'`, `studentCount=100`
- On submit: calls `api.post('/onboarding/school', payload)`, then `useAuthStore.login(token, user, refreshToken)`, navigates to `/dashboard`; toast shows `tenant.name`
- Pricing shown in UI: ₦500/student/term · ₦400 above 1,000 students · min ₦50,000

### Sidebar Navigation

- `Sidebar` filters `allNavItems` by the user's role string (via `getUserRole(user)` from `@/lib/auth`)
- Items grouped into sections: `"Command center"`, `"Academic core"`, `"Operations"`, `"Campus life"`, `"Digital learning"`, `"Family access"`, `"System"`
- Sidebar shows `${tenantId}.eduplus` as workspace label; falls back to `"Multi-role workspace"` if no tenantId
- `displayName` = `user.firstName + ' ' + user.lastName` (filtered); falls back to `"School User"` if both are absent
- `getUserRole` imported from `@/lib/auth`; `useAuthStore` provides `user`, `tenantId`, `logout`
- Sidebar role visibility differs from route-level `allowedRoles`: sidebar shows `students`, `teachers`, `classes` to PRINCIPAL (nav items include PRINCIPAL); routes for `/students`, `/teachers`, `/classes` do **not** list PRINCIPAL in `allowedRoles` — PRINCIPAL sees the nav links but route guards only allow ADMIN/TEACHER for those paths
- New nav items: `/notices` (Bell, Command center, all roles), `/gradebook` (BookOpen, Academic core, ADMIN+TEACHER), `/website-editor` (Globe, System, ADMIN), `/custom-domain-setup` (Globe, System, ADMIN)
- Library sidebar visibility: ADMIN, TEACHER, STAFF, STUDENT, PARENT — broader than route guard (unrestricted route)
- E-Learning sidebar visibility: ADMIN, TEACHER, STUDENT; Certificates: ADMIN, STUDENT
- `/student-portal` has **no sidebar nav item** — STUDENT role accesses it directly via route; students see Dashboard, Notices, Library, E-Learning, Certificates, Settings in the sidebar

### Page Pattern (CRUD feature pages)

- All feature pages use `react-hook-form` + `zod` for form validation
- Data fetching/mutation via `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`); `QueryClient` defaults: `retry: 1`, `staleTime: 30_000`, `refetchOnWindowFocus: false`
- Mutations call `qc.invalidateQueries` on success and show `toast.success/error` via `sonner`
- Most pages open a `Dialog` for create/edit; delete calls mutation directly
- Pages using `DataTable`: `StudentsPage`, `SubjectsPage`, `TeachersPage`, `ClassesPage`
- Pages using `@/components/shared/ModuleHero`: `AcademicYearsPage`, `SubjectsPage`, `TimetablePage`
- `StudentsPage` uses an inline hero section (same gradient style, no shared component); `ModulePages.tsx` has its own local `ModuleHero` function
- `TeachersPage`, `ClassesPage`, `PaymentsPage` are **not** lazy-loaded — imported directly as named exports from `@/pages/shared/ModulePages`; all other feature pages are lazy-loaded via `React.lazy`
- `StudentsPage` student form fields: `firstName`, `lastName`, `dob` (optional date string); CRUD: `POST /students`, `PUT /students/{id}`, `DELETE /students/{id}`
- `Student` client type has two distinct ID fields: `studentId?: string` (human-readable ID e.g. `"GWD-2025-0042"`) and `studentCode?: string` (legacy alias kept for migration compatibility) — both are separate from `id` (UUID primary key)

### AcademicYearsPage

- `AcademicYearCard`: expandable; terms loaded lazily via `useQuery(['terms', year.id])` only when expanded
- Add year: `POST /academic-years` `{ name, startDate, endDate }`; delete: `DELETE /academic-years/{id}`
- Add term: `POST /terms` `{ name, startDate, endDate, academicYearId }`; terms fetched via `GET /terms?academicYearId={id}`

### SubjectsPage

- Create requires `classId` (UUID) and `academicYearId` (UUID) — both mandatory
- Update omits `classId` and `academicYearId` (immutable after creation)
- Assign teacher via `PUT /subjects/{id}/assign-teacher` with `{ teacherId }` body
- `SubjectRow` local type: `{ id, name, code?, classId?, class?: Class, teacherId?, teacher?: Teacher, academicYearId?, academicYear?: AcademicYear }` — includes raw ID fields alongside relation objects for form pre-population

### TimetablePage

- Class-scoped view: user selects a class; entries fetched via `GET /timetable/class/{classId}`
- Create via `POST /timetable` with `{ subjectId, teacherId, academicYearId, dayOfWeek (0–6), startTime (HH:MM), endTime (HH:MM), room?, classId }`
- `SCHOOL_DAYS = [1,2,3,4,5]` (Mon–Fri); `DAY_NAMES[0]` = `"Sunday"`
- Per-day color coding via `DAY_TONE` map keyed by day number: 1=teal, 2=amber, 3=sky, 4=violet, 5=rose
- `classSubjects` filtered as `subjects.filter(s => !s.classId || s.classId === selectedClassId)`

### Student Portal (`StudentPortalPage`)

- Route: `/student-portal`, protected with `allowedRoles=['STUDENT']`; lazy-loaded via `React.lazy`
- Tabbed dashboard with 5 tabs: Overview (profile), Timetable, Grades, Attendance, Fees
- Hero banner: gradient `from-slate-950 via-indigo-950 to-violet-900`
- Data via hooks from `src/hooks/useStudentSelf.ts`; query key prefix: `['student-self', ...]`
- Student ID display: `profile.studentId || profile.studentCode` (prefers human-readable ID)
- `DAY_TONE` and `STATUS_VARIANT` maps defined locally (same palette as `TimetablePage`)

### Student Self-Service Hooks (`useStudentSelf`)

File: `src/hooks/useStudentSelf.ts`

- `useStudentProfile()` → `StudentProfile` via `GET /student/me/profile`
- `useStudentTimetable(academicYearId?)` → `StudentTimetableEntry[]` via `GET /student/me/timetable`
- `useStudentGrades(subjectId?)` → `Grade[]` via `GET /student/me/grades`
- `useStudentAttendance(params?)` → `Attendance[]` via `GET /student/me/attendance`; params: `{ startDate?, endDate? }`
- `useStudentFees()` → `StudentFee[]` via `GET /student/me/fees`
- `useStudentReportCard(termId)` → report card data via `GET /student/me/report-card`; disabled until `termId` is non-empty

Exported interfaces:
- `StudentProfile`: `{ id, studentId?, studentCode?, firstName, lastName, dob?, guardian?, class? }`
- `StudentTimetableEntry`: `{ id, dayOfWeek, startTime, endTime, room?, subject?, teacher?, class? }`
- `StudentFee`: extends `Fee` with `payments?: Array<{ id, amount, paidAt }>`

### Upcoming: Fees Module (`/fees`)

Planned in `docs/superpowers/plans/2026-05-12-fees-client-implementation.md` — not yet implemented:
- Route: `/fees` (ADMIN only); sidebar: "Fee Management" with `Banknote` icon, Operations section
- `src/pages/fees/FeesPage.tsx` — 3-tab layout: Account (bank setup/change-request), Templates (fee template CRUD), Assignments (list + waive)
- New types to add to `src/types/index.ts`: `FeeBank`, `SchoolPaymentAccount`, `FeeAccountChangeRequest`, `FeeTemplate`, `FeeAssignment`, `FeeInvoice`; enums: `FeeCategory`, `FeeTargetType`, `FeeAssignmentStatus`, `FeeInvoiceStatus`, `ChangeRequestStatus`
- `FeeAssignment` has `totalAmount`/`paidAmount` (Decimal — coerced to number by `api.ts` interceptor)

### Type Conventions

- `User.role` is `Role { id, name, description? }` — the RBAC role object, not the `UserRole` string enum
- `User` interface fields: `id`, `email?`, `studentCode?` (set for student accounts, e.g. `"GWD250042"`), `firstName?`, `lastName?`, `roleId?`, `role?`, `tenantId?`, `tenantSubdomain?`
- `UserRole` union type: `'MASTER' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT'`
- `AuthState`: `{ user, token, tenantId, refreshToken?: string | null }`
- Core domain interfaces in `src/types/index.ts`: `User`, `Role`, `AuthState`, `Student`, `Teacher`, `Class`, `Attendance`, `Grade`, `Subject`, `Assignment`, `Fee`, `Payment`, `AcademicYear`, `Term`, `Book`, `Course`, `CourseModule`, `Lesson`, `LessonPlaybackProgress`, `CourseEnrollment`, `RecordedCourse`, `LiveClass`, `Discussion`, `DiscussionReply`, `Certificate`, `Event`, `Notice`, `EBook`, `ReadingProgress`
- Quiz types in `src/types/index.ts`: `Quiz`, `QuizAttempt`, `QuizQuestion`, `QuizQuestionOption`, `QuizCreatePayload`, `QuizUpdatePayload`, `QuizListFilters`, `StaffQuizSubmitPayload`; enums: `QuizPlacement`, `QuizStatus`, `QuizGradeSinkType`, `QuizResultsVisibility`, `QuizQuestionType`
- `Subject` client type: `{ id, name, code?, description?, academicYearId?, classId? }` — base interface **includes** `classId?` and `academicYearId?`; `SubjectsPage` still defines a local `SubjectRow` type with full relation objects (`class?: Class`, `teacher?: Teacher`, `academicYear?: AcademicYear`) for form pre-population
- `Notice`: `{ id, authorId, title, content, targetRoles: UserRole[], createdAt, updatedAt, author?: { id, email?, firstName?, lastName?, role? } }`
- `EBook`: `{ id, tenantId, bookId?, book?, title, author, description?, coverUrl?, genre?, isbn?, fileKey, fileSize, fileType: 'PDF'|'EPUB', isDownloadable, createdAt }`
- `RecordedCourse`: extends `Course` with `enrollmentId`, `enrollmentProgress`, `enrollmentStatus`
- `Lesson` includes `progress?: LessonPlaybackProgress` and `quizzes?: Quiz[]`; `LessonPlaybackProgress`: `{ completed, timeSpent, lastAccessed? }`
- `AcademicYear`: `{ id, name, startDate, endDate, isCurrent }`; `Term`: `{ id, academicYearId, name, startDate, endDate, isCurrent }`
- Utility types in `src/types/index.ts`: `ApiError` (`{ error: string }`), `PaginatedResponse<T>` (`{ data: T[], total, page, limit }`)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: dependencies -->
## Key Dependencies

- `VITE_API_URL` — required env var; Vite exposes it to the client as the API base URL (e.g. `http://localhost:3001`); set in `.env`
- `VITE_SCHOOL_WEBSITE_BASE_URL` — env var for school website base URL (e.g. `http://localhost:5174`); set in `.env`
- `src/store/authStore.ts` — `useAuthStore`: auth state (`user`, `token`, `tenantId`, `refreshToken`), login/logout/setTokens actions, localStorage persistence
- `src/types/index.ts` — all shared TS interfaces; import from `@/types`
- `src/lib/api.ts` — configured axios instance; use for all API calls; includes `coerceDecimals` response interceptor (coerces Prisma Decimal string fields `totalAmount`, `paidAmount`, `amount`, `commissionPercent` to numbers on every response); token-refresh logic queues concurrent 401s and calls `POST /auth/refresh` — on refresh failure auto-logouts and redirects to `/login` (not role-aware)
- `src/lib/utils.ts` — `getApiErrorMessage(error, fallback)`: extracts error message from axios errors; `formatDate(dateStr)`: formats ISO date strings; `formatCurrency(amount)`: formats currency values
- `src/lib/moduleQueries.ts` — `fetchAllPaymentsByStudent`: used by `PaymentsPage` in `ModulePages.tsx`
- `src/lib/auth.ts` — `getUserRole(user)`: returns the `UserRole` string for a user (used by Sidebar and ProtectedRoute)
- `src/lib/passwordPolicy.ts` — `passwordSchema`: zod schema for password complexity; `passwordComplexityHint`: string hint shown to users; used by `SchoolSetupPage` and `RegisterPage`
- `src/components/auth/AuthShell` — layout wrapper for auth pages (`LoginPage`, `SchoolSetupPage`, etc.); provides split-panel layout with highlights and footer slot
- `src/components/ui/password-input` — `PasswordInput`: password field with show/hide toggle; used by `LoginPage`, `SchoolSetupPage`, `RegisterPage`
- `src/components/shared/ModuleHero` — hero banner component used by most feature pages
- `src/components/shared/DataTable` — generic data table; used by Students, Subjects, Teachers, Classes, Payments
- `src/components/shared/CsvUploadDialog` — CSV bulk upload dialog; used by `StudentsPage` and `ModulePages.tsx`
- `src/hooks/useStudentSelf.ts` — TanStack Query hooks for `/student/me/*` endpoints; exports `useStudentProfile`, `useStudentTimetable`, `useStudentGrades`, `useStudentAttendance`, `useStudentFees`, `useStudentReportCard`; used by `StudentPortalPage`
<!-- END AUTO-MANAGED -->
