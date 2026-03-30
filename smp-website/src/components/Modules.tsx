import { useState } from 'react'
import {
  FileCheck, DollarSign, ClipboardList, Users, Globe
} from 'lucide-react'

const modules = [
  {
    id: 'admissions',
    icon: FileCheck,
    label: 'Admissions',
    title: 'Admission and Enrollment Management',
    desc: 'Capture applicant details, manage admissions, and move students into the right class and session without spreadsheet back-and-forth.',
    bullets: ['Track applicants and admissions', 'Manage class placement', 'Keep enrollment history', 'Support session roll-over', 'Reduce manual paperwork'],
    color: 'text-blue-600 bg-blue-50',
    accent: 'bg-blue-600',
  },
  {
    id: 'fees',
    icon: DollarSign,
    label: 'Fees',
    title: 'Fees, Invoices, and Payment Tracking',
    desc: 'Set up school fees and levies, monitor who has paid, and give parents a clearer record of transactions and outstanding balances.',
    bullets: ['Create fees and levies', 'Track payment status per student', 'Monitor collections in real time', 'Support online and recorded offline payments', 'Reduce payment disputes'],
    color: 'text-emerald-600 bg-emerald-50',
    accent: 'bg-emerald-600',
  },
  {
    id: 'records',
    icon: ClipboardList,
    label: 'Records',
    title: 'Student Records and Report Cards',
    desc: 'Manage attendance, assessments, and end-of-term reports in one place so teachers can work from phones instead of loose sheets.',
    bullets: ['Daily attendance recording', 'Assessment and exam score entry', 'Term-based report cards', 'Academic history per student', 'Cleaner end-of-term workflow'],
    color: 'text-orange-600 bg-orange-50',
    accent: 'bg-orange-600',
  },
  {
    id: 'portals',
    icon: Users,
    label: 'Portals',
    title: 'Admin, Teacher, and Parent Portals',
    desc: 'Different users see the tools that matter to them, from admin oversight to teacher workflows to parent visibility.',
    bullets: ['Admin portal for school operations', 'Teacher portal for attendance and scores', 'Parent portal for fees and progress', 'Role-based access control', 'Cleaner communication across roles'],
    color: 'text-violet-600 bg-violet-50',
    accent: 'bg-violet-600',
  },
  {
    id: 'branding',
    icon: Globe,
    label: 'Branding',
    title: 'Your School Brand, Not Ours',
    desc: 'Present a portal that feels like your school with your domain, your identity, and a cleaner parent-facing experience.',
    bullets: ['Custom school identity', 'School-specific portal access', 'Custom domain support', 'Branded parent experience', 'Consistent communication touchpoints'],
    color: 'text-cyan-600 bg-cyan-50',
    accent: 'bg-cyan-600',
  },
]

export default function Modules() {
  const [active, setActive] = useState('admissions')
  const current = modules.find(m => m.id === active)!

  return (
    <section id="modules" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">All-in-One Platform</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">The modules schools ask for first</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            Every plan includes the same product. You only pay based on how many students your school has.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {modules.map(m => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active === m.id
                    ? `${m.accent} text-white shadow-md`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Content panel */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${current.color} mb-6`}>
              <current.icon className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{current.title}</h3>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">{current.desc}</p>
            <ul className="space-y-3">
              {current.bullets.map(b => (
                <li key={b} className="flex items-center gap-3 text-gray-700">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${current.accent} text-white text-xs font-bold`}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual card */}
          <div className={`rounded-3xl p-8 ${current.color.split(' ')[1]} border border-current/10`}>
            <div className="space-y-3">
              {current.bullets.map((b, i) => (
                <div key={b} className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`h-2 w-2 rounded-full ${current.accent}`} />
                  <span className="text-sm font-medium text-gray-700">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
