import { Building2, CreditCard, Rocket } from 'lucide-react'

const steps = [
  {
    icon: Building2,
    title: 'Fill Your School Details',
    desc: 'Enter your school name, choose your classes, and pick the student tier that matches your current size.',
  },
  {
    icon: CreditCard,
    title: 'Choose a Plan',
    desc: 'Select monthly or annual billing, start with a free 1-month trial, and lock in the annual discount when ready.',
  },
  {
    icon: Rocket,
    title: 'Go Live Immediately',
    desc: 'Your portal is activated with local classes, subjects, and term-based workflows so you can start adding students right away.',
  },
]

const checklist = [
  'Pre-loaded Nigerian classes and term structure',
  'Attendance, assessments, and report-card workflows',
  'Fees, invoices, and payment tracking',
  'Admin, teacher, and parent portals',
]

export default function Setup() {
  return (
    <section id="setup" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Setup Flow</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Get started in minutes, not weeks</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            The onboarding path is designed to get a school live quickly, with the local defaults already in place.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 mb-2">Step {index + 1}</p>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-3xl bg-brand-700 p-8 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">What goes live with your portal</p>
            <h3 className="mt-3 text-3xl font-bold">A setup your staff can actually use on day one</h3>
            <p className="mt-4 text-blue-100 leading-relaxed">
              SchoolApp is aimed at schools that want to stop patching together spreadsheets, WhatsApp messages, and printed score sheets.
            </p>

            <div className="mt-8 space-y-3">
              {checklist.map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/setup-school"
                className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-brand-700 hover:bg-blue-50 transition-colors"
              >
                Get Started for Free
              </a>
              <a
                href="#pricing"
                className="rounded-xl border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Compare Plans
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
