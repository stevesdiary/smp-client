import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Is SchoolApp really mobile-first?',
    a: 'Yes. The core workflows are designed to work on phones first, so admins and teachers can take attendance, enter scores, and review records without needing a computer.',
  },
  {
    q: 'Do all plans include every feature?',
    a: 'Yes. We do not lock features behind higher tiers. Pricing changes only with your student count, and annual payment gets a 20% discount.',
  },
  {
    q: 'Can it handle Nigerian terms, classes, and grading?',
    a: 'That is the point. SchoolApp is positioned around Nigerian school workflows, including term-based language and local class structures, so schools spend less time translating foreign software concepts.',
  },
  {
    q: 'How quickly can we get started?',
    a: 'Most schools can complete setup in minutes. Once your school details are in place, your portal is ready for adding students, teachers, fees, and records right away.',
  },
  {
    q: 'Can parents and teachers each have their own portal?',
    a: 'Yes. SchoolApp supports separate access experiences for admins, teachers, parents, and other staff, so each group sees only the workflows relevant to them.',
  },
  {
    q: 'What about school fee payments?',
    a: 'You can track fees and payments per student, including online collections where configured and manual recording for offline payments such as cash or transfer.',
  },
  {
    q: 'Can we move from spreadsheets or an older system?',
    a: 'Yes. The intended onboarding path is simple: bring over your school details, classes, and records, then start operating from one portal instead of scattered sheets and notebooks.',
  },
  {
    q: 'Can we use our own school identity?',
    a: 'Yes. The platform supports school-specific branding and custom domain setups so the parent and staff experience feels like your school, not a generic shared portal.',
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
