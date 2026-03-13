import { useState } from 'react'
import {
  Library, Bus, Package, Calendar, Heart,
  Building2, Trophy, Video, Users
} from 'lucide-react'

const modules = [
  {
    id: 'elearning',
    icon: Video,
    label: 'E-Learning',
    title: 'Full E-Learning Platform',
    desc: 'Deliver courses with video lessons, PDFs, quizzes, and live classes. Track student progress, auto-grade assessments, and issue completion certificates.',
    bullets: ['Course builder with modules & lessons', 'Live classes (Zoom, Google Meet)', 'Auto-graded quizzes & assignments', 'Discussion forums & Q&A', 'Completion certificates'],
    color: 'text-red-600 bg-red-50',
    accent: 'bg-red-600',
  },
  {
    id: 'parent',
    icon: Users,
    label: 'Parent Portal',
    title: 'Keep Parents in the Loop',
    desc: 'Give parents real-time visibility into their children\'s attendance, grades, payments, and school announcements — all in one secure portal.',
    bullets: ['View attendance history', 'Track grades by subject', 'Payment history & receipts', 'School announcements', 'Multiple children support'],
    color: 'text-blue-600 bg-blue-50',
    accent: 'bg-blue-600',
  },
  {
    id: 'library',
    icon: Library,
    label: 'Library',
    title: 'Smart Library Management',
    desc: 'Manage your entire book catalog, track borrowing and returns, calculate fines, and get overdue alerts automatically.',
    bullets: ['Book catalog with ISBN search', 'Borrow & return workflow', 'Overdue alerts & fines', 'Transaction history', 'Student & staff borrowing'],
    color: 'text-amber-600 bg-amber-50',
    accent: 'bg-amber-600',
  },
  {
    id: 'transport',
    icon: Bus,
    label: 'Transport',
    title: 'Fleet & Route Management',
    desc: 'Manage buses, define routes with stops, assign students, and track driver information — all from one dashboard.',
    bullets: ['Bus fleet management', 'Route & stop configuration', 'Student route assignment', 'Driver contact info', 'Capacity tracking'],
    color: 'text-green-600 bg-green-50',
    accent: 'bg-green-600',
  },
  {
    id: 'hostel',
    icon: Building2,
    label: 'Hostel',
    title: 'Hostel & Boarding',
    desc: 'Manage rooms, assign students to beds, track meal plans, and log visitor entries with full audit trails.',
    bullets: ['Room & bed assignment', 'Meal plan management', 'Visitor log & check-in', 'Occupancy reports', 'Building & floor management'],
    color: 'text-indigo-600 bg-indigo-50',
    accent: 'bg-indigo-600',
  },
  {
    id: 'health',
    icon: Heart,
    label: 'Health',
    title: 'Student Health Records',
    desc: 'Securely store health records with AES-256 encryption. Track medical incidents, vaccinations, allergies, and emergency contacts.',
    bullets: ['Encrypted health records', 'Medical incident tracking', 'Vaccination schedules', 'Allergy & condition alerts', 'Emergency contact info'],
    color: 'text-rose-600 bg-rose-50',
    accent: 'bg-rose-600',
  },
  {
    id: 'sports',
    icon: Trophy,
    label: 'Sports',
    title: 'Sports & Extracurricular',
    desc: 'Manage activities, enroll students, schedule practices, and track competition results across all sports and clubs.',
    bullets: ['Activity & club management', 'Student enrollment', 'Competition tracking', 'Results & standings', 'Instructor assignment'],
    color: 'text-orange-600 bg-orange-50',
    accent: 'bg-orange-600',
  },
  {
    id: 'inventory',
    icon: Package,
    label: 'Inventory',
    title: 'Asset & Inventory Control',
    desc: 'Track school assets from purchase to disposal. Manage allocations, maintenance schedules, and generate inventory reports.',
    bullets: ['Asset catalog & categories', 'Purchase & allocation tracking', 'Maintenance records', 'Disposal management', 'Location tracking'],
    color: 'text-teal-600 bg-teal-50',
    accent: 'bg-teal-600',
  },
  {
    id: 'events',
    icon: Calendar,
    label: 'Events',
    title: 'Event Management',
    desc: 'Plan and manage school events, track participants, and keep the whole school community informed.',
    bullets: ['Event calendar view', 'Participant management', 'Event types & categories', 'Venue management', 'Announcement integration'],
    color: 'text-purple-600 bg-purple-50',
    accent: 'bg-purple-600',
  },
]

export default function Modules() {
  const [active, setActive] = useState('elearning')
  const current = modules.find(m => m.id === active)!

  return (
    <section id="modules" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">All-in-One Platform</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Every module your school needs</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            Tier 1, 2, and 3 modules — all included. No add-ons, no hidden fees.
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
