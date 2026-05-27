# Attendance Management Phase 1 (Web List View) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a class-scoped web list view for teachers to mark student attendance with Present, Absent, Late, or Excused status, review before saving, and submit via bulk API.

**Architecture:** The `AttendancePage` acts as an orchestrator managing all state (`classId`, `date`, `marks`, `showSummary`). Three focused sub-components handle rendering: `ClassSelector` (class + date pickers), `ListMarkingView` (student list with mark buttons), and `AttendanceSummary` (review counts and save). Data flows from API via TanStack Query, state updates trigger local re-renders, and bulk save mutates the backend. Phase 2 (mobile swipe) is deferred and not implemented.

**Tech Stack:** React 19, React Router DOM v7, TanStack Query v5, Zustand (`useAuthStore`), Tailwind CSS v3, Shadcn UI (Button, Card, Dialog, Select, Input), framer-motion (animations), Lucide React (icons), react-hook-form + zod (forms), sonner (toasts).

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/types/index.ts` | Add `AttendanceStatus` type, `AttendanceRecord`, `StudentWithAttendance` |
| Create | `src/pages/attendance/components/ClassSelector.tsx` | Dropdown to select class, date picker |
| Create | `src/pages/attendance/components/ListMarkingView.tsx` | Scrollable student list, mark buttons, row background tints |
| Create | `src/pages/attendance/components/AttendanceSummary.tsx` | Summary counts, unmarked list, Save button |
| Modify | `src/pages/attendance/AttendancePage.tsx` | Orchestrator: state, view selection, API integration |
| Create | `src/pages/attendance/components/attendanceStyles.ts` | Color constants and utility functions for status styling |

---

## Task 1: Add attendance types to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

**Context:**
The `Attendance` type already exists in the codebase (from CLAUDE.md). For Phase 1, we need to add:
- `AttendanceStatus` — union type for marking status
- `StudentWithAttendance` — student + optional marked status
- `AttendanceRecord` — bulk submit payload structure

- [ ] **Step 1: Read the current types file to understand existing Attendance type**

Run: `head -100 src/types/index.ts | grep -A 5 "Attendance"`

- [ ] **Step 2: Add new types at the end of the file, before any export statements**

Open `src/types/index.ts` and add these types after the existing `Attendance` type:

```ts
// Attendance Status enumeration for marking
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

// Student with attendance marking
export interface StudentWithAttendance extends Student {
  status?: AttendanceStatus
}

// Bulk attendance submission payload
export interface AttendanceRecord {
  studentId: string
  status: AttendanceStatus
  date: string
  classId: string
}

// Attendance page state
export interface AttendancePageState {
  classId: string | null
  date: string
  marks: Record<string, AttendanceStatus>
  showSummary: boolean
}
```

- [ ] **Step 3: Verify TypeScript has no errors**

Run: `cd smp-client && npx tsc --noEmit 2>&1 | head -20`

Expected: No output (zero errors).

- [ ] **Step 4: Commit**

```bash
cd smp-client
git add src/types/index.ts
git commit -m "feat: add attendance marking types (status, record, state)"
```

---

## Task 2: Create `attendanceStyles.ts` utility file

**Files:**
- Create: `src/pages/attendance/components/attendanceStyles.ts`

**Context:**
The spec defines specific colors for each status. Centralizing these prevents duplication across components and makes theme changes easier. This file exports both color objects and utility functions.

- [ ] **Step 1: Create the file with color constants**

Create `src/pages/attendance/components/attendanceStyles.ts`:

```ts
import { AttendanceStatus } from '@/types'

// Status badge and row background colors
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, { text: string; bg: string; row: string }> = {
  PRESENT: {
    text: '#16a34a',      // green-600
    bg: '#dcfce7',        // green-100
    row: '#f0fdf4',       // green-50
  },
  ABSENT: {
    text: '#dc2626',      // red-600
    bg: '#fee2e2',        // red-100
    row: '#fef2f2',       // red-50
  },
  LATE: {
    text: '#f59e0b',      // amber-500
    bg: '#fef9c3',        // amber-100
    row: '#fffbeb',       // amber-50
  },
  EXCUSED: {
    text: '#64748b',      // slate-500
    bg: '#f1f5f9',        // slate-100
    row: '#f8fafc',       // slate-50
  },
}

// Get text color for a status
export const getStatusTextColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return '#94a3b8' // slate-400 for unmarked
  return ATTENDANCE_STATUS_COLORS[status].text
}

// Get background color for a status
export const getStatusBgColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return 'white'
  return ATTENDANCE_STATUS_COLORS[status].bg
}

// Get row background color for a status
export const getRowBgColor = (status: AttendanceStatus | undefined): string => {
  if (!status) return 'white'
  return ATTENDANCE_STATUS_COLORS[status].row
}

// Format status for display (e.g. "PRESENT" -> "Present")
export const formatStatus = (status: AttendanceStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

// Count attendance by status
export const countByStatus = (marks: Record<string, AttendanceStatus>) => {
  const counts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  }
  
  Object.values(marks).forEach(status => {
    counts[status]++
  })
  
  return counts
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd smp-client && npx tsc --noEmit 2>&1 | grep attendanceStyles`

Expected: No output (no errors for this file).

- [ ] **Step 3: Commit**

```bash
cd smp-client
git add src/pages/attendance/components/attendanceStyles.ts
git commit -m "feat: add attendance color constants and utility functions"
```

---

## Task 3: Create ClassSelector component

**Files:**
- Create: `src/pages/attendance/components/ClassSelector.tsx`

**Context:**
The ClassSelector fetches classes via `GET /classes` and students via `GET /students?classId={id}` when a class is selected. It uses a date picker for the attendance date. The component is a controlled input (props drive state changes via `onChange` callbacks).

- [ ] **Step 1: Create the component**

Create `src/pages/attendance/components/ClassSelector.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Class } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

interface ClassSelectorProps {
  selectedClassId: string | null
  selectedDate: string
  onClassSelect: (classId: string) => void
  onDateChange: (date: string) => void
}

export default function ClassSelector({
  selectedClassId,
  selectedDate,
  onClassSelect,
  onDateChange,
}: ClassSelectorProps) {
  const { data: classes = [], isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes')
      return response.data as Class[]
    },
  })

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-sm text-red-600">Failed to load classes. Please try again.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-slate-50 border-slate-200">
      <div className="flex gap-6 items-end">
        {/* Class Selector */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="class-select" className="block text-sm font-medium mb-2 text-slate-700">
            Select Class
          </Label>
          <Select value={selectedClassId || ''} onValueChange={onClassSelect} disabled={isLoading}>
            <SelectTrigger id="class-select" className="w-full">
              <SelectValue placeholder={isLoading ? 'Loading classes...' : 'Choose a class'} />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls._count?.students || 0} students)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="date-input" className="block text-sm font-medium mb-2 text-slate-700">
            Date
          </Label>
          <Input
            id="date-input"
            type="date"
            value={selectedDate}
            onChange={e => onDateChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Clear selection button */}
        {selectedClassId && (
          <Button
            variant="outline"
            onClick={() => onClassSelect('')}
            className="px-4"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Help text */}
      {selectedClassId && (
        <p className="text-xs text-slate-600 mt-3">
          Class selected. Scroll down to mark attendance for each student.
        </p>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd smp-client && npx tsc --noEmit src/pages/attendance/components/ClassSelector.tsx 2>&1`

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd smp-client
git add src/pages/attendance/components/ClassSelector.tsx
git commit -m "feat: add ClassSelector component with class dropdown and date picker"
```

---

## Task 4: Create ListMarkingView component

**Files:**
- Create: `src/pages/attendance/components/ListMarkingView.tsx`

**Context:**
ListMarkingView displays a scrollable list of students. Each row shows the student's name and ID on the left, and four labelled buttons (Present, Absent, Late, Excused) on the right. The active button is highlighted with color; the row background tints based on the marked status. A "Finish" button at the bottom triggers the review summary.

- [ ] **Step 1: Create the component**

Create `src/pages/attendance/components/ListMarkingView.tsx`:

```tsx
import { Student, AttendanceStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  ATTENDANCE_STATUS_COLORS,
  formatStatus,
} from './attendanceStyles'

interface ListMarkingViewProps {
  students: Student[]
  marks: Record<string, AttendanceStatus>
  onMark: (studentId: string, status: AttendanceStatus) => void
  onFinish: () => void
  isLoading?: boolean
}

export default function ListMarkingView({
  students,
  marks,
  onMark,
  onFinish,
  isLoading = false,
}: ListMarkingViewProps) {
  const statuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

  if (!students.length) {
    return (
      <Card className="p-8 text-center bg-slate-50">
        <p className="text-sm text-slate-600">No students in this class.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Student list */}
      <Card className="overflow-hidden border border-slate-200">
        <div className="max-h-[600px] overflow-y-auto">
          {students.map(student => {
            const studentId = student.studentId || student.studentCode || student.id
            const currentStatus = marks[studentId]
            const rowBg = currentStatus
              ? ATTENDANCE_STATUS_COLORS[currentStatus].row
              : 'white'

            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0 transition-colors"
                style={{ backgroundColor: rowBg }}
              >
                {/* Student info */}
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-900">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {studentId}
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {statuses.map(status => {
                    const isActive = currentStatus === status
                    const colors = ATTENDANCE_STATUS_COLORS[status]

                    return (
                      <button
                        key={status}
                        onClick={() => onMark(studentId, status)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors border"
                        style={{
                          backgroundColor: isActive ? colors.bg : 'white',
                          color: isActive ? colors.text : '#94a3b8',
                          borderColor: isActive ? colors.text : '#e2e8f0',
                        }}
                        title={`Mark as ${formatStatus(status)}`}
                        aria-label={`Mark ${student.firstName} as ${formatStatus(status)}`}
                      >
                        {formatStatus(status)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Finish button */}
      <div className="flex justify-end">
        <Button
          onClick={onFinish}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Review & Finish
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd smp-client && npx tsc --noEmit src/pages/attendance/components/ListMarkingView.tsx 2>&1`

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd smp-client
git add src/pages/attendance/components/ListMarkingView.tsx
git commit -m "feat: add ListMarkingView component with student list and mark buttons"
```

---

## Task 5: Create AttendanceSummary component

**Files:**
- Create: `src/pages/attendance/components/AttendanceSummary.tsx`

**Context:**
The AttendanceSummary shows a review of marked attendance counts and lists any unmarked students. A "Save" button submits via `POST /attendance/bulk` with only the marked students. On success, it closes and resets state. On error, it shows a toast and keeps the summary open so the teacher can retry. A "Go Back" link returns to the marking view.

- [ ] **Step 1: Create the component**

Create `src/pages/attendance/components/AttendanceSummary.tsx`:

```tsx
import { Student, AttendanceStatus } from '@/types'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { countByStatus } from './attendanceStyles'
import { Loader2 } from 'lucide-react'

interface AttendanceSummaryProps {
  students: Student[]
  marks: Record<string, AttendanceStatus>
  date: string
  classId: string
  onGoBack: () => void
  onSaveSuccess: () => void
}

export default function AttendanceSummary({
  students,
  marks,
  date,
  classId,
  onGoBack,
  onSaveSuccess,
}: AttendanceSummaryProps) {
  const counts = countByStatus(marks)
  const markedCount = Object.keys(marks).length
  const unmarkedCount = students.length - markedCount
  const unmarkedStudents = students.filter(s => {
    const studentId = s.studentId || s.studentCode || s.id
    return !marks[studentId]
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build records array from marked students only
      const records = students
        .filter(s => {
          const studentId = s.studentId || s.studentCode || s.id
          return marks[studentId]
        })
        .map(s => ({
          studentId: s.studentId || s.studentCode || s.id,
          status: marks[s.studentId || s.studentCode || s.id],
          date,
          classId,
        }))

      const response = await api.post('/attendance/bulk', {
        records,
        date,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success(`Attendance saved for ${markedCount} students`)
      onSaveSuccess()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to save attendance'
      toast.error(message)
    },
  })

  return (
    <div className="space-y-6">
      {/* Summary counts */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Attendance Summary</h3>
        
        <div className="grid grid-cols-5 gap-4 text-center mb-6">
          <div>
            <div className="text-2xl font-bold text-slate-900">{students.length}</div>
            <div className="text-xs text-slate-600 mt-1">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{counts.PRESENT}</div>
            <div className="text-xs text-slate-600 mt-1">Present</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{counts.ABSENT}</div>
            <div className="text-xs text-slate-600 mt-1">Absent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">{counts.LATE}</div>
            <div className="text-xs text-slate-600 mt-1">Late</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-500">{counts.EXCUSED}</div>
            <div className="text-xs text-slate-600 mt-1">Excused</div>
          </div>
        </div>

        {/* Unmarked students */}
        {unmarkedCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-sm text-amber-900 mb-3">
              {unmarkedCount} unmarked student{unmarkedCount !== 1 ? 's' : ''}
            </h4>
            <ul className="space-y-2 text-sm">
              {unmarkedStudents.map(s => (
                <li key={s.id} className="text-amber-800">
                  • {s.firstName} {s.lastName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={onGoBack}
          disabled={saveMutation.isPending}
        >
          Go Back & Edit
        </Button>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || markedCount === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Attendance
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd smp-client && npx tsc --noEmit src/pages/attendance/components/AttendanceSummary.tsx 2>&1`

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd smp-client
git add src/pages/attendance/components/AttendanceSummary.tsx
git commit -m "feat: add AttendanceSummary component with review and save"
```

---

## Task 6: Refactor AttendancePage to orchestrator

**Files:**
- Modify: `src/pages/attendance/AttendancePage.tsx`

**Context:**
The existing `AttendancePage` loads all students without class filtering. We refactor it to:
1. Manage state: `classId`, `date`, `marks`, `showSummary`
2. Fetch classes via `GET /classes`
3. Fetch students via `GET /students?classId={classId}` when class is selected
4. Delegate rendering to the three sub-components
5. Handle the review → save flow

Before implementation, verify that the backend supports `GET /students?classId={id}`. If not, a separate backend task will be needed.

- [ ] **Step 1: Read the current AttendancePage**

Run: `wc -l src/pages/attendance/AttendancePage.tsx`

Expected: A number (e.g., 80–150 lines). If larger, note the existing complexity.

- [ ] **Step 2: Backup and replace with the orchestrator**

Completely replace `src/pages/attendance/AttendancePage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Student, AttendanceStatus } from '@/types'
import { Card } from '@/components/ui/card'
import ClassSelector from './components/ClassSelector'
import ListMarkingView from './components/ListMarkingView'
import AttendanceSummary from './components/AttendanceSummary'

export default function AttendancePage() {
  // State
  const [classId, setClassId] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [showSummary, setShowSummary] = useState(false)

  // Reset marks when class changes
  useEffect(() => {
    setMarks({})
    setShowSummary(false)
  }, [classId])

  // Fetch students for selected class
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      if (!classId) return []
      const response = await api.get('/students', {
        params: { classId, limit: 200 },
      })
      return response.data as Student[]
    },
    enabled: !!classId,
  })

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleFinish = () => {
    setShowSummary(true)
  }

  const handleGoBack = () => {
    setShowSummary(false)
  }

  const handleSaveSuccess = () => {
    // Reset state after successful save
    setMarks({})
    setShowSummary(false)
    setClassId(null)
    setDate(today)
  }

  // No class selected
  if (!classId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-600 mt-1">Mark student attendance for a class</p>
        </div>

        <ClassSelector
          selectedClassId={classId}
          selectedDate={date}
          onClassSelect={setClassId}
          onDateChange={setDate}
        />

        <Card className="p-8 text-center bg-slate-50 border-dashed">
          <p className="text-slate-600">Select a class to begin marking attendance</p>
        </Card>
      </div>
    )
  }

  // Show summary if flag is set
  if (showSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Attendance</h1>
          <p className="text-sm text-slate-600 mt-1">Before saving, check the summary below</p>
        </div>

        <AttendanceSummary
          students={students}
          marks={marks}
          date={date}
          classId={classId}
          onGoBack={handleGoBack}
          onSaveSuccess={handleSaveSuccess}
        />
      </div>
    )
  }

  // Show marking view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
        <p className="text-sm text-slate-600 mt-1">Select a status for each student, then review</p>
      </div>

      <ClassSelector
        selectedClassId={classId}
        selectedDate={date}
        onClassSelect={setClassId}
        onDateChange={setDate}
      />

      {studentsLoading && (
        <Card className="p-8 text-center">
          <p className="text-slate-600">Loading students...</p>
        </Card>
      )}

      {!studentsLoading && (
        <ListMarkingView
          students={students}
          marks={marks}
          onMark={handleMark}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd smp-client && npx tsc --noEmit src/pages/attendance/AttendancePage.tsx 2>&1`

Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
cd smp-client
git add src/pages/attendance/AttendancePage.tsx
git commit -m "refactor: restructure AttendancePage as orchestrator with sub-components"
```

---

## Task 7: Verify GET /students supports classId filtering

**Files:**
- None (verification task)

**Context:**
The spec assumes `GET /students` supports a `classId` query parameter. If the backend doesn't support this, a backend task will be needed before testing can proceed.

- [ ] **Step 1: Check current API behavior**

Run the dev server and open the browser console, then test the endpoint:

```bash
cd smp-client && npm run dev
```

In the browser console, fetch:
```js
fetch('http://localhost:3001/students?classId=<any-valid-class-id>', {
  headers: { 'Authorization': 'Bearer <valid-token>' }
}).then(r => r.json()).then(console.log)
```

Expected outcomes:
- ✓ **Success:** Returns a filtered list of students for that class (status 200, students array)
- ✗ **Error:** Backend doesn't recognize `classId` param, returns all students or 400 error

- [ ] **Step 2: If backend supports classId, continue**

If `GET /students?classId=...` returns filtered results, the integration is complete. Proceed to Task 8 (manual testing).

If the backend **does not** support `classId` filtering:
- Create a backend task: "Add classId query parameter support to `GET /students` endpoint"
- Block Task 8 until backend is updated
- The plan is otherwise complete and accurate

**No commit needed for this verification task.**

---

## Task 8: Manual testing — Class selection and student fetching

**Files:**
- None (testing task)

**Context:**
Start the dev server and test the full flow: class selection → student list → marking → review → save (with mock or actual backend).

- [ ] **Step 1: Start the dev server**

```bash
cd smp-client && npm run dev
```

Expected: Server starts on `http://localhost:5173`.

- [ ] **Step 2: Navigate to attendance page**

1. Open `http://localhost:5173/attendance`
2. If not authenticated, login first

Expected: Page shows "Select a class to begin marking attendance"

- [ ] **Step 3: Test class selection**

1. Click the class dropdown
2. Select a class (e.g., "JSS 2A")

Expected: 
- Class is selected
- Students list appears below for that class
- Dropdown now shows "Clear" button

- [ ] **Step 4: Test date picker**

1. Click the date input
2. Select a different date

Expected: Date input updates without affecting the class or students

- [ ] **Step 5: Test marking a student**

1. Click "Present" button for the first student

Expected:
- Button highlights in green
- Row background tints green
- Other status buttons remain white

- [ ] **Step 6: Test marking multiple students with different statuses**

1. Mark 3 students as Present, 1 as Absent, 1 as Late
2. Leave 2 unmarked

Expected:
- Each row shows correct colors for marked status
- Unmarked rows stay white

- [ ] **Step 7: Test "Review & Finish" button**

1. Click the "Review & Finish" button at the bottom

Expected:
- Page switches to summary view
- Shows counts: Total, Present (3), Absent (1), Late (1), Excused (0)
- Shows list of 2 unmarked students by name

- [ ] **Step 8: Test "Go Back & Edit"**

1. Click "Go Back & Edit" button

Expected:
- Returns to marking view
- All marks are preserved
- Can continue editing

- [ ] **Step 9: Test "Save Attendance"**

1. Go back to summary
2. Click "Save Attendance"

Expected (if backend accepts the request):
- Toast appears: "Attendance saved for 5 students"
- Page resets to class selection view
- `marks` state is cleared
- Network tab shows POST to `/attendance/bulk` with correct payload

Expected payload structure:
```json
{
  "records": [
    { "studentId": "...", "status": "PRESENT", "date": "2026-05-21", "classId": "..." },
    ...
  ],
  "date": "2026-05-21"
}
```

- [ ] **Step 10: Test error handling**

If backend is not available:

1. Stop the backend or mock a failure
2. Mark students and try to save
3. Observe the error handling

Expected:
- Toast shows error message
- Summary stays open (not dismissed)
- Can retry without losing marks

- [ ] **Step 11: Verify no TypeScript errors in dev server**

Check the dev server terminal for any TypeScript compilation errors.

Expected: No errors (only dev warnings if any)

- [ ] **Step 12: No commit needed**

This is a testing verification task. If all tests pass, proceed to Task 9 (final cleanup and verification).

---

## Task 9: Final verification and production build

**Files:**
- None (verification task)

**Context:**
Ensure no regressions were introduced and the feature is ready for deployment.

- [ ] **Step 1: Run TypeScript check on entire project**

```bash
cd smp-client && npx tsc --noEmit 2>&1 | head -50
```

Expected: Zero errors (no TypeScript output).

- [ ] **Step 2: Run the production build**

```bash
cd smp-client && npm run build 2>&1 | tail -15
```

Expected:
- Build completes successfully
- Output shows `✓ built in Xms` with no errors
- Chunk sizes are reasonable (no huge attendance component)

- [ ] **Step 3: Verify lazy loading in build output**

In the build output, confirm that `AttendancePage` is lazy-loaded:

```bash
cd smp-client && npm run build 2>&1 | grep -i attendance
```

Expected: A line mentioning `attendance.*chunk` or similar lazy-loaded bundle entry.

- [ ] **Step 4: Check for missing assets or import errors**

```bash
cd smp-client && npm run build 2>&1 | grep -i "warning\|error"
```

Expected: No errors; only dev warnings (if any) are acceptable.

- [ ] **Step 5: Verify existing attendance route still works**

The route should already exist in `App.tsx`. Confirm it's still there and points to the right component:

```bash
grep -n "attendance" src/App.tsx | head -5
```

Expected: One or two lines mentioning `attendance` (e.g., lazy import and route definition).

- [ ] **Step 6: No commit needed**

This is a verification task. If all checks pass, Phase 1 is complete and ready for user testing.

---

## Verification Checklist

**Implementation Complete:**
- [ ] Types added to `src/types/index.ts`
- [ ] `attendanceStyles.ts` created with color constants and utilities
- [ ] `ClassSelector.tsx` component created
- [ ] `ListMarkingView.tsx` component created
- [ ] `AttendanceSummary.tsx` component created
- [ ] `AttendancePage.tsx` refactored as orchestrator
- [ ] Manual testing passes (class selection, marking, review, save)
- [ ] TypeScript compiles with zero errors
- [ ] Production build succeeds

**Backend Prerequisites (Verify or Create Task):**
- [ ] `GET /students` supports `?classId={id}` parameter
- [ ] `POST /attendance/bulk` endpoint exists and accepts `{ records, date }` payload

**Phase 2 (Deferred):**
- RollCallView, SwipeCard, ModeToggle components are **not** implemented in Phase 1
- Phase 2 code will be added when the mobile app is ready
- Comments in the spec document guide Phase 2 implementation
