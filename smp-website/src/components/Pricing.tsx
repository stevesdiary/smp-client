import { Check, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 49,
    desc: 'Perfect for small schools getting started.',
    features: [
      'Up to 300 students',
      'Student & teacher management',
      'Attendance tracking',
      'Gradebook & report cards',
      'Fee & payment management',
      'Email notifications',
      'Standard support',
    ],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 99,
    desc: 'For growing schools that need more power.',
    features: [
      'Up to 1,000 students',
      'Everything in Starter',
      'E-Learning platform',
      'Parent portal',
      'Library management',
      'Transport management',
      'Events & calendar',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 199,
    desc: 'For large institutions with advanced needs.',
    features: [
      'Unlimited students',
      'Everything in Growth',
      'Hostel management',
      'Health records (encrypted)',
      'Sports & extracurricular',
      'Inventory management',
      'Custom domain',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Simple Pricing</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">Plans for every school size</h2>
          <p className="mt-4 text-lg text-gray-500">14-day free trial. No credit card required.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6 items-start">
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
                <span className={`text-5xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>${plan.price}</span>
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
          All plans include SSL, daily backups, and 99.9% uptime SLA.
          <a href="#" className="text-brand-600 font-medium ml-1 hover:underline">Compare all features →</a>
        </p>
      </div>
    </section>
  )
}
