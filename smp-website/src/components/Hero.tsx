import { ArrowRight, Play, CheckCircle } from 'lucide-react'

const highlights = ['Multi-tenant SaaS', 'E-Learning built-in', 'Parent Portal', 'Real-time Analytics']

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-blue-500">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Glow blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-blue-100 mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-green-400" />
          Now with E-Learning & Parent Portal
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 animate-fade-up">
          The Complete
          <span className="block bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent">
            School Management
          </span>
          Platform
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-blue-100 mb-10 animate-fade-up animate-delay-100">
          Run your entire school from one platform — students, teachers, attendance, grades, payments, e-learning, and more. Built for modern schools.
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-10 animate-fade-up animate-delay-200">
          {highlights.map(h => (
            <span key={h} className="flex items-center gap-1.5 text-sm text-blue-100">
              <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
              {h}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up animate-delay-300">
          <a href="#pricing"
            className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#features"
            className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all backdrop-blur">
            <Play className="h-4 w-4" />
            Watch Demo
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-12 text-sm text-blue-200 animate-fade-up animate-delay-400">
          Trusted by <span className="font-semibold text-white">500+</span> schools across <span className="font-semibold text-white">30</span> countries
        </p>

        {/* Dashboard preview */}
        <div className="mt-16 relative mx-auto max-w-5xl animate-fade-up animate-delay-500">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-1 shadow-2xl">
            <div className="rounded-xl bg-gray-900 overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <div className="flex-1 mx-4 h-5 rounded bg-gray-700 text-xs text-gray-400 flex items-center px-3">
                  app.schoolms.io/dashboard
                </div>
              </div>
              {/* Dashboard mockup */}
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Students', value: '1,248', color: 'bg-blue-500' },
                  { label: 'Teachers', value: '86', color: 'bg-purple-500' },
                  { label: 'Attendance', value: '94%', color: 'bg-green-500' },
                  { label: 'Revenue', value: '$48K', color: 'bg-orange-500' },
                ].map(stat => (
                  <div key={stat.label} className="rounded-lg bg-gray-800 p-4">
                    <div className={`h-2 w-8 rounded-full ${stat.color} mb-3`} />
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
                <div className="col-span-3 rounded-lg bg-gray-800 p-4 h-32">
                  <div className="text-xs text-gray-400 mb-3">Revenue Overview</div>
                  <div className="flex items-end gap-2 h-16">
                    {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-brand-600 opacity-80 transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-800 p-4 h-32">
                  <div className="text-xs text-gray-400 mb-3">Attendance</div>
                  <div className="flex items-center justify-center h-16">
                    <div className="relative h-14 w-14">
                      <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                          strokeDasharray="94 6" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under dashboard */}
          <div className="absolute -bottom-8 inset-x-8 h-16 bg-brand-600 blur-2xl opacity-30 rounded-full" />
        </div>
      </div>
    </section>
  )
}
