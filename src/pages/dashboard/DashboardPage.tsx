import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, GraduationCap, School, DollarSign, Calendar, BookOpen, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { fetchAllPaymentsByStudent } from '@/lib/moduleQueries'
import { useAuthStore } from '@/store/authStore'
import { getUserRole } from '@/lib/auth'
import api from '@/lib/api'

type DashboardEvent = {
  id: string
  title: string
  startDate: string
  type: string
}

function StatCard({ title, value, icon: Icon }: {
  title: string
  value: string | number
  icon: LucideIcon
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLinks({ links }: { links: Array<{ to: string; label: string }> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((item) => (
        <Button key={item.to} asChild variant="outline" size="sm">
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const canViewAcademic = role === 'ADMIN' || role === 'TEACHER'
  const canViewPayments = role === 'ADMIN'
  const canViewEvents = role === 'ADMIN' || role === 'TEACHER'
  const isParent = role === 'PARENT'
  const isStudent = role === 'STUDENT'
  const isStaff = role === 'STAFF'

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((res) => res.data),
    enabled: canViewAcademic,
  })
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then((res) => res.data),
    enabled: role === 'ADMIN',
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((res) => res.data),
    enabled: canViewAcademic,
  })
  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'all-by-student'],
    queryFn: fetchAllPaymentsByStudent,
    enabled: canViewPayments,
  })
  const { data: events = [] } = useQuery<DashboardEvent[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((res) => res.data),
    enabled: canViewEvents,
  })
  const { data: parentChildren = [] } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => api.get('/parent/children').then((res) => res.data),
    enabled: isParent,
  })
  const { data: liveClasses = [] } = useQuery({
    queryKey: ['live-classes'],
    queryFn: () => api.get('/elearning/live-classes').then((res) => res.data),
    enabled: isStudent,
  })
  const { data: libraryStats } = useQuery({
    queryKey: ['library-stats'],
    queryFn: () => api.get('/library/stats').then((res) => res.data),
    enabled: isStaff,
  })

  const totalRevenue = payments.reduce((sum, payment) => (
    payment.status === 'SUCCESS' ? sum + payment.amount : sum
  ), 0)

  const roleTitle = {
    ADMIN: 'Admin Dashboard',
    PRINCIPAL: 'Principal Dashboard',
    TEACHER: 'Teacher Dashboard',
    STAFF: 'Staff Dashboard',
    PARENT: 'Parent Dashboard',
    STUDENT: 'Student Dashboard',
  }[role]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{roleTitle}</h1>
        <p className="text-muted-foreground">Overview tailored to your role.</p>
      </div>

      {(role === 'ADMIN' || role === 'TEACHER') && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studentsLoading ? <Skeleton className="h-24" /> : <StatCard title="Students" value={students.length} icon={Users} />}
            {role === 'ADMIN' ? (
              teachersLoading ? <Skeleton className="h-24" /> : <StatCard title="Teachers" value={teachers.length} icon={GraduationCap} />
            ) : (
              <StatCard title="Teaching Modules" value={4} icon={BookOpen} />
            )}
            <StatCard title="Classes" value={classes.length} icon={School} />
            {role === 'ADMIN' ? (
              <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
            ) : (
              <StatCard title="Upcoming Events" value={events.length} icon={Calendar} />
            )}
          </div>
          <QuickLinks links={[
            { to: '/students', label: 'Manage Students' },
            { to: '/attendance', label: 'Take Attendance' },
            { to: '/grades', label: 'Record Grades' },
            { to: '/events', label: 'View Events' },
          ]} />
        </>
      )}

      {role === 'PRINCIPAL' && (
        <>
          <Card>
            <CardHeader><CardTitle>Leadership Overview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Principal accounts are configured for oversight workflows. Use Disciplinary and Settings for day-to-day operations.
              </p>
              <QuickLinks links={[
                { to: '/disciplinary', label: 'Disciplinary Records' },
                { to: '/settings', label: 'System Settings' },
              ]} />
            </CardContent>
          </Card>
        </>
      )}

      {isStaff && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Books Borrowed" value={libraryStats?.borrowed ?? 0} icon={BookOpen} />
          <StatCard title="Library Returns" value={libraryStats?.returned ?? 0} icon={BookOpen} />
          <StatCard title="Hostel / Ops" value="Active" icon={Building2} />
          <QuickLinks links={[
            { to: '/library', label: 'Library' },
            { to: '/transport', label: 'Transport' },
            { to: '/inventory', label: 'Inventory' },
            { to: '/hostel', label: 'Hostel' },
          ]} />
        </div>
      )}

      {isParent && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Children Linked" value={parentChildren.length} icon={Users} />
          <StatCard title="Recent Updates" value={parentChildren.length > 0 ? 'Available' : 'None'} icon={Calendar} />
          <StatCard title="Portal Access" value="Active" icon={BookOpen} />
          <QuickLinks links={[
            { to: '/parent', label: 'Open Parent Portal' },
            { to: '/settings', label: 'Settings' },
          ]} />
        </div>
      )}

      {isStudent && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Live Classes" value={liveClasses.length} icon={Calendar} />
          <StatCard title="E-Learning" value="Available" icon={BookOpen} />
          <StatCard title="Certificates" value="Track Progress" icon={GraduationCap} />
          <QuickLinks links={[
            { to: '/elearning', label: 'Open E-Learning' },
            { to: '/certificates', label: 'Certificates' },
            { to: '/settings', label: 'Settings' },
          ]} />
        </div>
      )}

      {canViewEvents && (
        <Card>
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
