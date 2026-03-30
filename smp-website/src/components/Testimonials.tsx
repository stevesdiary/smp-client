const testimonials = [
  {
    name: 'John I.',
    role: 'Proprietor, Pinnacle International Academy - Anambra State',
    avatar: 'JI',
    color: 'bg-blue-500',
    quote: 'Before SchoolApp, we used software with terms like sophomore and fall semester. This one finally speaks the language our school actually uses.',
    rating: 5,
  },
  {
    name: 'Fatima M.',
    role: 'Proprietress, Al-Iman Model School - Kano State',
    avatar: 'AH',
    color: 'bg-green-500',
    quote: 'End-of-term used to be our most stressful period. Now teachers enter scores from their phones, and the workload is far more manageable.',
    rating: 5,
  },
  {
    name: 'Nyensomom B.',
    role: 'Principal, Destiny Comprehensive College - Enugu State',
    avatar: 'NB',
    color: 'bg-orange-500',
    quote: 'We set up classes in one evening and started using the portal the next morning. Having records across sessions has been invaluable.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-brand-600 uppercase tracking-wider">Loved by Schools</span>
          <h2 className="mt-2 text-4xl font-extrabold text-gray-900">What school leaders say</h2>
          <p className="mt-4 text-lg text-gray-500">Join 50+ schools already running on SchoolApp across Nigeria.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(t => (
            <div key={t.name}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">"{t.quote}"</p>

              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.color} text-white text-sm font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
