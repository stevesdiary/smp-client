import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { Student, AttendanceStatus } from '@/types'
import ClassSelector from './components/ClassSelector'
import ListMarkingView from './components/ListMarkingView'
import AttendanceSummary from './components/AttendanceSummary'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * AttendancePage - State Orchestrator
 *
 * Manages all attendance state and coordinates sub-components:
 * - ClassSelector: class + date selection
 * - ListMarkingView: student marking interface
 * - AttendanceSummary: review and save
 *
 * State:
 * - classId: selected class ID (null = show placeholder)
 * - date: selected date (YYYY-MM-DD)
 * - marks: Record<studentId, AttendanceStatus> - persisted across views
 * - showSummary: toggles between marking view and summary view
 */
export default function AttendancePage() {
  // Core state
  const [classId, setClassId] = useState<string | null>(null)
  const [date, setDate] = useState<string>(getTodayDate())
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({})
  const [showSummary, setShowSummary] = useState(false)

  // Fetch students when class is selected
  const {
    data: students = [],
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
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

  // Create attendance records from marks (only marked students)
  const attendanceRecords = useMemo(() => {
    return Object.entries(marks).map(([studentId, status]) => ({
      studentId,
      status,
      date,
      classId: classId!,
    }))
  }, [marks, date, classId])

  // Save attendance mutation
  const { mutate: saveAttendance, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const response = await api.post('/attendance/bulk', {
        records: attendanceRecords,
        date,
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Attendance saved successfully')
      // Reset state after successful save
      setMarks({})
      setShowSummary(false)
      setClassId(null)
      setDate(getTodayDate())
    },
    onError: (error: any) => {
      const errorMsg = error?.response?.data?.error || 'Failed to save attendance'
      toast.error(errorMsg)
      // Keep summary open so user can retry
    },
  })

  // Event handlers
  const handleMark = (studentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleFinish = () => {
    if (Object.keys(marks).length === 0) {
      toast.error('Please mark at least one student')
      return
    }
    setShowSummary(true)
  }

  const handleGoBack = () => {
    setShowSummary(false)
  }

  const handleSave = () => {
    saveAttendance()
  }

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId || null)
    // Clear marks when changing class
    setMarks({})
    setShowSummary(false)
  }

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
  }

  // Stats for header
  const markedCount = Object.keys(marks).length
  const presentCount = Object.values(marks).filter((s) => s === 'PRESENT').length

  // Show placeholder if no class selected
  if (!classId) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Roll call"
          title="Attendance"
          description="Mark daily attendance for your class."
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No class selected</h2>
            <p className="text-slate-600 mb-6">Select a class to begin marking attendance</p>
            <ClassSelector
              selectedClassId={classId}
              selectedDate={date}
              onClassSelect={handleClassChange}
              onDateChange={handleDateChange}
            />
          </Card>
        </div>
      </div>
    )
  }

  // Show summary if requested
  if (showSummary) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Roll call"
          title="Review Attendance"
          description="Review and save attendance marks"
          stats={[
            { label: 'Total Students', value: students.length },
            { label: 'Marked', value: markedCount },
            { label: 'Present', value: presentCount },
          ]}
        />

        <div className="space-y-6">
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
      </div>
    )
  }

  // Show marking view
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Roll call"
        title="Attendance"
        description="Mark daily attendance for your class."
        stats={[
          { label: 'Total Students', value: students.length },
          { label: 'Marked', value: markedCount },
          { label: 'Present', value: presentCount },
        ]}
      />

      <div className="space-y-6">
        <ClassSelector
          selectedClassId={classId}
          selectedDate={date}
          onClassSelect={handleClassChange}
          onDateChange={handleDateChange}
        />

        {studentsError && (
          <Card className="p-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-600">Failed to load students. Please try again.</p>
          </Card>
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
          <Card className="p-8 text-center bg-slate-50">
            <p className="text-sm text-slate-600">No students found in this class.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
