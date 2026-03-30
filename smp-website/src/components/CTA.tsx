import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 bg-brand-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
          Ready to leave spreadsheets behind?
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Join 50+ schools already using SchoolApp. Start with a free 1-month trial and get your school portal ready in minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="/setup-school"
            className="flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5">
            Get Started for Free
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#setup"
            className="rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all backdrop-blur">
            View Setup Steps
          </a>
        </div>
        <p className="mt-6 text-sm text-blue-200">Free 1-month trial · Mobile-first setup · Cancel anytime</p>
      </div>
    </section>
  )
}
