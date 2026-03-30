import {
  Smartphone, GraduationCap, ClipboardList, DollarSign,
  FileText, Users, Globe, Bell
} from 'lucide-react'

const features = [
  {
    icon: Smartphone,
    title: 'Mobile-First by Default',
    desc: 'Mark attendance, enter scores, check payments, and share updates directly from a phone. No computer required.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GraduationCap,
    title: 'Nigerian School Setup',
    desc: 'Start with local classes, subjects, and term-based academic language instead of foreign templates that need heavy editing.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: ClipboardList,
    title: 'Attendance on the Go',
    desc: 'Take daily attendance in seconds with fast bulk marking and class-level summaries for teachers and admins.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: FileText,
    title: 'End-of-Term Reports',
    desc: 'Capture assessments, calculate scores, and generate report cards without the usual end-of-term scramble.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: DollarSign,
    title: 'Fees and Payment Tracking',
    desc: 'Set fees, record payments, monitor balances, and give parents a clearer view of what is due and what has been paid.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Separate Portals',
    desc: 'Give admins, teachers, and parents the right tools without crowding everyone into the same interface.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Globe,
    title: 'School Branding',
    desc: 'Run your portal with your school identity, custom domain support, and a cleaner experience for parents and staff.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Bell,
    title: 'Clear School Communication',
    desc: 'Keep families informed about attendance, payments, and announcements without chasing people manually.',
    color: 'bg-yellow-50 text-yellow-600',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Built for Local Reality</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">What Nigerian schools actually need</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            SchoolApp focuses on the daily jobs school owners, admins, and teachers handle every term, without foreign-school friction.
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
