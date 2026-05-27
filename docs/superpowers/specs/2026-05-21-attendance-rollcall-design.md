# Attendance Management Redesign — Web List View (Phase 1)

> **Design Status:** Approved 2026-05-21
> **Implementation:** Phase 1 (web/desktop); Phase 2 (mobile swipe, deferred) TBD

**Goal:** Improve teacher attendance marking workflow with a class-scoped, multi-mode interface (web list view in Phase 1; mobile swipe roll call deferred to Phase 2).

**Architecture:** The existing `AttendancePage` becomes an orchestrator that owns all attendance state and delegates UI rendering to focused sub-components. Phase 1 implements the web list view only.

**Tech Stack:** React 19, TanStack Query (React Query v5), Zustand, framer-motion (already installed), Tailwind CSS v3.

---

## Phase 1 — Web List View (Current)

### Components

```
src/pages/attendance/
├── AttendancePage.tsx              — Orchestrator: state, class selector, current view
└── components/
    ├── ClassSelector.tsx           — Class + date picker dropdown
    ├── ListMarkingView.tsx         — Spacious rows with labelled buttons
    └── AttendanceSummary.tsx       — Review summary + Save button
```

Phase 2 will add: `RollCallView.tsx`, `SwipeCard.tsx`, `ModeToggle.tsx` (mobile swipe interface — commented out for now).

### State (`AttendancePage`)

```ts
const [classId, setClassId] = useState<string | null>(null)
const [date, setDate] = useState(today)
const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
const [showSummary, setShowSummary] = useState(false)

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
```

No `rollIndex`, `mode`, or `ModeToggle` in Phase 1.

### Data Flow

1. **Fetch classes:** `GET /classes` → populate class selector (reuses existing endpoint)
2. **Select class:** `setClassId(id)` → `GET /students?classId={id}&limit=200` → load students for that class
3. **Mark attendance:** `onMark(studentId, status)` → `setMarks(prev => ({ ...prev, [studentId]: status }))`
4. **Finish marking:** click "Finish" button → `setShowSummary(true)`
5. **Review & Save:** `AttendanceSummary` shows counts. Teacher clicks "Save" → `POST /attendance/bulk { records: [...] }` (only marked students)
6. **Success:** toast, reset marks, close summary

### Component Details

#### **ClassSelector**

- Dropdown to select a class from `GET /classes`
- Date picker (input type="date")
- Shows class name + count: "JSS 2A (28 students)"
- Triggers `GET /students?classId={id}&limit=200` when class is selected
- Reuses the `Class` type from `src/types/index.ts`

#### **ListMarkingView**

- Scrollable list of students (one row per student)
- Each row:
  - Left: student name + student ID (`studentId ?? studentCode`)
  - Right: four labelled text buttons (Present / Absent / Late / Excused)
  - Active button highlighted (colored bg), row background tints based on active status (green for Present, red for Absent, amber for Late, neutral for Excused)
  - Unmarked rows have white background
- "Finish" button at bottom → calls `onFinish()` which sets `showSummary = true`
- Props: `students: Student[]`, `marks: Record<string, AttendanceStatus>`, `onMark: (studentId, status) => void`, `onFinish: () => void`

#### **AttendanceSummary**

- Shows counts: Total · Present (X) · Absent (X) · Late (X) · Excused (X) · **Unmarked (X)**
- If unmarked students exist, list their names with a "Go back" link → `setShowSummary(false)`
- "Save" button → fires `POST /attendance/bulk { records, date }` (only marked students)
- On error: toast, summary stays open so teacher can retry (marks preserved)
- On success: toast, reset `marks`, close summary
- Props: `marks`, `students`, `date`, `onSave: () => void`, `onGoBack: () => void`

### Styling & UX Details

- **Status badge colors:**
  - Present: green (`#16a34a` text, `#dcfce7` bg)
  - Absent: red (`#dc2626` text, `#fee2e2` bg)
  - Late: amber (`#f59e0b` text, `#fef9c3` bg)
  - Excused: gray (neutral)
- **Row height:** ~54px (10px padding top/bottom, 14px line height for name + 12px for student ID)
- **Button styling:** 5px vertical, 12px horizontal padding, 8px border-radius, text-sm font-medium
- **Unmarked counter** visible in the header: "3 Present · 1 Absent · 0 Late · 0 Excused · 4 Unmarked"

### API Requirements

- **New or assumed:** `GET /students?classId={id}&limit=200` — must support `classId` query param (currently the page loads all students with no filter)
- **Existing:** `GET /classes`, `POST /attendance/bulk`

If `GET /students?classId=...` is not supported, the backend will need to add this param support.

---

## Phase 2 — Mobile Roll Call (Deferred)

**Deferred to when the mobile app is ready.** This will add:

- `RollCallView.tsx` — One card at a time
- `SwipeCard.tsx` — Framer-motion draggable card with swipe detection (right = Present, left = Absent, threshold = 80px)
- `ModeToggle.tsx` — Toggle button to switch between List and Roll Call modes
- `rollIndex`, `mode` state in `AttendancePage`
- Auto-default to roll call mode on narrow screens, list mode on wide screens

**Note:** State will be shared between both views, so marking attendance in one mode preserves marks when switching modes.

---

## Error Handling

- **No class selected:** Show placeholder message "Select a class to begin"
- **Fetch students error:** Show error toast + retry button
- **Bulk save error:** Show toast "Failed to save attendance", marks remain in state, teacher can retry
- **Network timeout:** Use TanStack Query's retry logic (default: 1 retry)

---

## Testing

### Web List View

- [ ] Class selector loads classes via `GET /classes`
- [ ] Selecting a class fetches students via `GET /students?classId={id}`
- [ ] Clicking a status button marks that student + row updates color
- [ ] "Finish" shows summary with correct counts
- [ ] Unmarked students are listed; clicking "Go back" returns to list
- [ ] "Save" calls `POST /attendance/bulk` with marked students only
- [ ] Success: toast, state reset, summary closes
- [ ] Error: toast shown, marks preserved, can retry

### Accessibility

- All buttons have `title` attributes or `aria-label`
- Color is not the only indicator (add icons or text labels)
- Keyboard navigation: Tab through buttons, Enter to activate

---

## Notes

- **Phase 1 scope:** Web list view only. Mobile swipe roll call is Phase 2 (deferred until mobile app is ready).
- **Responsive:** The list view is responsive and works on tablet. Phase 2 will use a media query hook or a mode toggle to switch between views.
- **State preservation:** Both views (Phase 1 + Phase 2) will share the same local `marks` state, so switching modes doesn't lose data.
- **Backend `classId` param:** Verify `GET /students` supports filtering by `?classId=...` before implementation. If not, add this param to the backend.
