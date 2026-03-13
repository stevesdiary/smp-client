const stats = [
  { value: '500+', label: 'Schools Worldwide' },
  { value: '120K+', label: 'Active Students' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '30+', label: 'Countries' },
  { value: '4.9★', label: 'Average Rating' },
]

export default function Stats() {
  return (
    <section className="bg-brand-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-sm text-blue-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
