/**
 * AttendancePage State Orchestrator Spec
 *
 * This file documents the behavior specification for the AttendancePage component,
 * which manages all attendance state and coordinates three sub-components.
 *
 * To run tests in the future, install:
 * npm install --save-dev vitest @testing-library/react @testing-library/user-event @types/vitest
 *
 * Then create a vitest.config.ts and implement these tests.
 */

// State orchestrator contract:
// 1. Initial state: classId = null, shows placeholder message
// 2. On class select: fetches students via GET /students?classId={id}
// 3. On student mark: updates marks Record with status
// 4. On finish: transitions to summary view (showSummary = true)
// 5. On save: POSTs to /attendance/bulk with { records, date }
// 6. On success: resets all state (classId, date, marks, showSummary)
// 7. On error: keeps summary open for retry
// 8. On class change: clears marks and resets showSummary

/*
 * Expected Test Cases (to implement later with vitest):
 *
 * 1. renders ClassSelector and PageHeader initially
 *    - Should show "Attendance" title
 *    - Should show placeholder when no class selected
 *    - Should display "No class selected" message
 *
 * 2. shows ListMarkingView when class is selected
 *    - Fetches students via GET /students?classId={id}&limit=200
 *    - Renders student list with marking buttons
 *    - Shows stat counts (Total, Marked, Present)
 *
 * 3. marks student and updates state
 *    - onMark handler updates marks Record
 *    - Row background color changes based on status
 *    - Stat counts update in header
 *
 * 4. transitions to summary on "Review & Finish"
 *    - showSummary state becomes true
 *    - AttendanceSummary component renders
 *    - Displays counts and unmarked students list
 *    - Marks persist across view transition
 *
 * 5. saves attendance with correct payload
 *    - POST /attendance/bulk with {records: [...], date: "YYYY-MM-DD"}
 *    - records contain only marked students
 *    - Each record has {studentId, status, date, classId}
 *
 * 6. resets state on successful save
 *    - Shows success toast
 *    - Clears marks, classId, showSummary
 *    - Returns to initial placeholder state
 *    - Resets date to today
 *
 * 7. keeps summary open on save error
 *    - Shows error toast with API error message
 *    - Keeps summary view visible
 *    - Allows retry without losing marks
 *
 * 8. clears marks when changing class
 *    - handleClassChange clears marks Record
 *    - Closes summary view (showSummary = false)
 *    - Fetches new students for new class
 *
 * 9. handles empty student list gracefully
 *    - Shows "No students found in this class" message
 *    - Still allows date/class changes
 *
 * 10. handles student loading error
 *     - Shows error card with "Failed to load students" message
 *     - Allows class/date changes to retry
 */

// Type-checking test: verify component exports correctly
import AttendancePage from '../AttendancePage'
const componentExport: typeof AttendancePage = AttendancePage

export default {
  componentExport,
  specVersion: '1.0',
  implementation: 'Task 6: Refactor AttendancePage as State Orchestrator',
  status: 'Complete - Phase 1 (list view)',
  deferredFeatures: [
    'Phase 2: Mobile swipe roll call (RollCallView, SwipeCard, ModeToggle)',
  ],
}
