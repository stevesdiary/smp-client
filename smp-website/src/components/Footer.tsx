import { GraduationCap, Twitter, Linkedin, Github } from 'lucide-react'

const footerLinks = {
  Product: ['Features', 'Modules', 'Pricing', 'Changelog', 'Roadmap'],
  Company: ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Resources: ['Documentation', 'API Reference', 'Status', 'Support', 'Community'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              SchoolMS
            </a>
            <p className="text-sm leading-relaxed mb-6">
              The complete school management platform for modern institutions. Manage everything from one place.
            </p>
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Icon className="h-4 w-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-sm font-semibold text-white mb-4">{group}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} SchoolMS. All rights reserved.</p>
          <p className="text-sm">Built with ❤️ for educators worldwide</p>
        </div>
      </div>
    </footer>
  )
}
