import {
  Users, GraduationCap, ClipboardList, DollarSign,
  BookOpen, Video, Shield, BarChart3, Bell, Globe
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Student Management',
    desc: 'Complete student profiles, enrollment, guardian info, and academic history in one place.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GraduationCap,
    title: 'Teacher & Staff',
    desc: 'Manage teachers, assign subjects, track schedules, and monitor performance.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: ClipboardList,
    title: 'Attendance Tracking',
    desc: 'Daily attendance with bulk marking, calendar view, and automated reports.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: BookOpen,
    title: 'Gradebook & Exams',
    desc: 'Record grades, manage assignments, generate report cards and transcripts.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: DollarSign,
    title: 'Fee & Payments',
    desc: 'Fee structures, payment tracking, receipts, and outstanding balance reports.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Video,
    title: 'E-Learning Platform',
    desc: 'Courses, video lessons, quizzes, live classes, discussions, and certificates.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Granular permissions for Admin, Principal, Teacher, Staff, Parent, and Student.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Real-time insights on attendance, revenue, performance, and engagement.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Email and SMS alerts for grades, attendance, payments, and announcements.',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant SaaS',
    desc: 'Each school gets its own isolated environment with custom domain support.',
    color: 'bg-pink-50 text-pink-600',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Everything You Need</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Powerful features for modern schools</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            From daily attendance to e-learning, SchoolMS covers every aspect of school administration.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title}
              className="group rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-4`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
