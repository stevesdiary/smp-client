const testimonials = [
  {
    name: 'Dr. Sarah Mensah',
    role: 'Principal, Greenwood Academy',
    avatar: 'SM',
    color: 'bg-blue-500',
    quote: 'SchoolMS transformed how we run our school. Attendance, grades, and payments are now fully automated. Our teachers spend more time teaching, less time on admin.',
    rating: 5,
  },
  {
    name: 'James Okafor',
    role: 'IT Director, Sunrise International School',
    avatar: 'JO',
    color: 'bg-purple-500',
    quote: 'The multi-tenant architecture is rock solid. We manage 3 campuses from one dashboard. The e-learning module was a game changer during remote learning.',
    rating: 5,
  },
  {
    name: 'Amina Hassan',
    role: 'Admin Manager, Al-Noor Academy',
    avatar: 'AH',
    color: 'bg-green-500',
    quote: 'Parent engagement went up 60% after we launched the parent portal. Parents love seeing their children\'s attendance and grades in real time.',
    rating: 5,
  },
  {
    name: 'Michael Torres',
    role: 'Head Teacher, St. Francis College',
    avatar: 'MT',
    color: 'bg-orange-500',
    quote: 'The gradebook and report card generation saves us 2 days every term. The timetable conflict detection alone is worth the subscription.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Finance Officer, Delhi Public School',
    avatar: 'PS',
    color: 'bg-pink-500',
    quote: 'Fee collection and payment tracking is seamless. Outstanding balance reports are generated in seconds. Our collection rate improved by 35%.',
    rating: 5,
  },
  {
    name: 'Emmanuel Adeyemi',
    role: 'Director, Covenant Schools',
    avatar: 'EA',
    color: 'bg-teal-500',
    quote: 'We evaluated 5 school management systems. SchoolMS was the only one with hostel, health records, and e-learning all built in. No extra cost.',
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
          <p className="mt-4 text-lg text-gray-500">Join 500+ schools already running on SchoolMS.</p>
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
