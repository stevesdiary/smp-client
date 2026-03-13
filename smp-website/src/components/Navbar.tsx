import { useState, useEffect } from 'react'
import { Menu, X, GraduationCap } from 'lucide-react'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2 font-bold text-xl text-brand-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            SchoolMS
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Sign In</a>
            <a href="#pricing" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              Get Started
            </a>
          </div>

          <button className="md:hidden p-2 rounded-md text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-brand-600 py-1">
              {l.label}
            </a>
          ))}
          <a href="#pricing" onClick={() => setOpen(false)}
            className="block w-full text-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Get Started
          </a>
        </div>
      )}
    </header>
  )
}
