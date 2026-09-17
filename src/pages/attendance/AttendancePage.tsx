import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ClipboardCheck, Clock, UserX } from 'lucide-react'
import api from '@/lib/api'
import type { Student, AttendanceStatus } from '@/types'
import ClassSelector from './components/ClassSelector'
import ListMarkingView from './components/ListMarkingView'
import AttendanceSummary from './components/AttendanceSummary'
import { countByStatus } from './components/attendanceStyles'

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function AttHeading() {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Roll call</p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Attendance Tracking</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed/50 px-3 py-1 text-[11px] font-bold text-primary-container">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Live Academic Session
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Mark daily attendance for your class.</p>
    </div>
  )
}

function StatCards({ present, late, absent, total }: { present: number; late: number; absent: number; total: number }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0
  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {/* Presence */}
      <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-xl bg-primary-fixed p-2 text-primary"><ClipboardCheck className="h-5 w-5" strokeWidth={1.5} /></span>
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px] font-bold text-primary-container">{pct}%</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present Today</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h3 className="font-mono text-3xl font-black text-primary-container">{present}</h3>
          <span className="text-xs font-medium text-muted-foreground">/ {total} students</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {/* Late */}
      <div className="rounded-2xl bg-secondary-fixed/40 p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-xl bg-secondary-fixed p-2 text-on-secondary-fixed"><Clock className="h-5 w-5" strokeWidth={1.5} /></span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-on-secondary-fixed/70">Late Arrivals</p>
        <h3 className="mt-1 font-mono text-3xl font-black text-[#835500]">{late}</h3>
        <p className="mt-1 text-xs font-medium text-on-secondary-fixed/70">Students marked late</p>
      </div>
      {/* Absent */}
      <div className="rounded-2xl bg-error-container/40 p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-xl bg-error-container p-2 text-error-on"><UserX className="h-5 w-5" strokeWidth={1.5} /></span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-error-on/70">Absent Today</p>
        <h3 className="mt-1 font-mono text-3xl font-black text-error-on">{absent}</h3>
        <p className="mt-1 text-xs font-medium text-error-on/70">Requires follow-up</p>
      </div>
    </section>
  )
}

export default function AttendancePage() {
  const [classId, setClassId] = useState<string | null>(null)
  const [date, setDate] = useState<string>(getTodayDate())
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [showSummary, setShowSummary] = useState(false)

  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      if (!classId) return []
      const response = await api.get('/students', { params: { classId, limit: 200 } })
      return response.data as Student[]
    },
    enabled: !!classId,
  })

  const attendanceRecords = useMemo(
    () => Object.entries(marks).map(([studentId, status]) => ({ studentId, status, date, classId: classId! })),
    [marks, date, classId],
  )

  const { mutate: saveAttendance, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendances/bulk', { records: attendanceRecords, date })
      return response.data
    },
    onSuccess: () => {
      toast.success('Attendance saved successfully')
      setMarks({}); setShowSummary(false); setClassId(null); setDate(getTodayDate())
    },
    onError: (error: any) => toast.error(error?.response?.data?.error || 'Failed to save attendance'),
  })

  const handleMark = (studentId: string, status: AttendanceStatus) =>
    setMarks((prev) => ({ ...prev, [studentId]: status }))

  const handleMarkAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { all[s.studentId || s.studentCode || s.id] = 'PRESENT' })
    setMarks(all)
  }

  const handleFinish = () => {
    if (Object.keys(marks).length === 0) { toast.error('Please mark at least one student'); return }
    setShowSummary(true)
  }
  const handleGoBack = () => setShowSummary(false)
  const handleSave = () => saveAttendance()
  const handleClassChange = (newClassId: string) => { setClassId(newClassId || null); setMarks({}); setShowSummary(false) }
  const handleDateChange = (newDate: string) => setDate(newDate)

  const counts = countByStatus(marks)

  // No class selected
  if (!classId) {
    return (
      <div className="space-y-8">
        <AttHeading />
        <ClassSelector
          selectedClassId={classId}
          selectedDate={date}
          onClassSelect={handleClassChange}
          onDateChange={handleDateChange}
        />
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl bg-surface-container-lowest p-10 text-center shadow-soft">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
            <ClipboardCheck className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="font-headline text-lg font-bold text-on-surface">No class selected</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a class above to begin marking attendance.</p>
        </div>
      </div>
    )
  }

  // Summary view
  if (showSummary) {
    return (
      <div className="space-y-8">
        <AttHeading />
        <StatCards present={counts.PRESENT} late={counts.LATE} absent={counts.ABSENT} total={students.length} />
        <ClassSelector
          selectedClassId={classId}
          selectedDate={date}
          onClassSelect={handleClassChange}
          onDateChange={handleDateChange}
        />
        <AttendanceSummary
          marks={marks}
          students={students}
          date={date}
          classId={classId}
          onSave={handleSave}
          onGoBack={handleGoBack}
        />
      </div>
    )
  }

  // Marking view
  return (
    <div className="space-y-8">
      <AttHeading />
      <StatCards present={counts.PRESENT} late={counts.LATE} absent={counts.ABSENT} total={students.length} />
      <ClassSelector
        selectedClassId={classId}
        selectedDate={date}
        onClassSelect={handleClassChange}
        onDateChange={handleDateChange}
        onMarkAllPresent={students.length > 0 ? handleMarkAllPresent : undefined}
      />

      {studentsError && (
        <div className="rounded-2xl bg-error-container/40 p-4 text-sm font-medium text-error-on">
          Failed to load students. Please try again.
        </div>
      )}

      {students.length > 0 && (
        <ListMarkingView
          students={students}
          marks={marks}
          onMark={handleMark}
          onFinish={handleFinish}
          isLoading={studentsLoading || isSaving}
        />
      )}

      {!studentsError && students.length === 0 && !studentsLoading && (
        <div className="rounded-3xl bg-surface-container-lowest p-8 text-center text-sm text-muted-foreground shadow-soft">
          No students found in this class.
        </div>
      )}
    </div>
  )
}
