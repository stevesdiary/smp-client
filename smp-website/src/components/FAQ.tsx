import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'How does the multi-tenant architecture work?',
    a: 'Each school gets a completely isolated environment with its own data, subdomain, and configuration. There is zero data leakage between tenants. You can also use a custom domain for your school.',
  },
  {
    q: 'Can parents and students access the system?',
    a: 'Yes. Parents have a dedicated portal to view their children\'s attendance, grades, and payments. Students can access their courses, assignments, and grades. Each role has carefully scoped permissions.',
  },
  {
    q: 'Is the e-learning platform included in all plans?',
    a: 'E-Learning is included from the Growth plan onwards. It includes course creation, video lessons, quizzes, live class scheduling (Zoom/Google Meet), discussion forums, and completion certificates.',
  },
  {
    q: 'How secure is the health records data?',
    a: 'Health records are encrypted at rest using AES-256-GCM encryption. Only authorized staff with the Health Records permission can access this data. All access is logged.',
  },
  {
    q: 'Can I migrate from my existing school management system?',
    a: 'Yes. We provide CSV import tools for students, teachers, and historical data. Our onboarding team will assist with data migration at no extra cost for Growth and Enterprise plans.',
  },
  {
    q: 'What payment methods do you support for school fees?',
    a: 'SchoolMS integrates with Stripe, Paystack, and Flutterwave for online fee collection. You can also record offline payments (cash, bank transfer) manually.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'The web application is fully responsive and works great on mobile browsers. Native iOS and Android apps are on our roadmap for Q3 2025.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Starter plans get email support with 48h response time. Growth plans get priority support with 12h response. Enterprise plans get a dedicated account manager and phone support.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">FAQ</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
