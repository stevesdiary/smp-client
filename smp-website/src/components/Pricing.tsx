import { Check, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'N4,000',
    desc: 'Up to 50 students',
    features: [
      'All features included',
      'Attendance and assessments',
      'End-of-term report cards',
      'Fees and payment tracking',
      'Teacher and parent portals',
    ],
    cta: 'Get Started for Free',
    highlight: false,
  },
  {
    name: 'Growing',
    price: 'N8,000',
    desc: 'Up to 100 students',
    features: [
      'All features included',
      'Admission workflows',
      'Attendance and report cards',
      'Parent payment visibility',
      'School branding options',
    ],
    cta: 'Get Started for Free',
    highlight: false,
  },
  {
    name: 'Standard',
    price: 'N16,000',
    desc: 'Up to 200 students',
    features: [
      'All features included',
      'Best fit for growing schools',
      'Teacher and parent portals',
      'Online fee management',
      'Custom school branding',
    ],
    cta: 'Get Started for Free',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Large',
    price: 'N32,000',
    desc: 'Up to 500 students',
    features: [
      'All features included',
      'Multi-class operations',
      'Payment and report workflows',
      'Parent communication tools',
      'Custom domain support',
    ],
    cta: 'Talk to Sales',
    highlight: false,
  },
  {
    name: 'Mega',
    price: 'N56,000',
    desc: 'Up to 1,000 students',
    features: [
      'All features included',
      'For large school operations',
      'Full portal access by role',
      'Branding and setup support',
      'Custom quote above 1,000 students',
    ],
    cta: 'Talk to Sales',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Simple Pricing</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Transparent pricing by school size</h2>
          <p className="mt-4 text-lg text-gray-500">Every plan includes every feature. Annual payment gets 20% off.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-5 xl:gap-5 items-start">
          {plans.map(plan => (
            <div key={plan.name}
              className={`relative rounded-3xl p-8 ${
                plan.highlight
                  ? 'bg-brand-600 text-white shadow-2xl scale-105 ring-4 ring-brand-600/20'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white shadow">
                    <Zap className="h-3 w-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{plan.desc}</p>
              </div>

              <div className="mb-8">
                <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-200' : 'text-brand-600'}`} />
                    <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="#"
                className={`block w-full text-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-white text-brand-700 hover:bg-blue-50'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Need more than 1,000 students? Contact us for a custom school plan.
          <a href="#setup" className="text-brand-600 font-medium ml-1 hover:underline">See the setup steps →</a>
        </p>
      </div>
    </section>
  )
}
