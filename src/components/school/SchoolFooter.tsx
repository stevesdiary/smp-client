'use client'

import type { Template, SchoolWebsiteConfig } from '@/types/school-website'

interface FooterProps {
  config: SchoolWebsiteConfig
  template: Template
  onNavigate: (page: any) => void
}

export function SchoolFooter({ config, template, onNavigate }: FooterProps) {
  const isDark = template.id === 'bold'

  return (
    <footer
      style={{
        backgroundColor: isDark ? '#0A0A0A' : template.colors.primary,
        color: '#FFFFFF',
        padding: '64px 24px 32px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '48px',
            marginBottom: '48px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                color: template.colors.secondary,
                marginBottom: '12px',
              }}
            >
              {config.schoolName}
            </div>
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7,
                marginBottom: '20px',
              }}
            >
              {config.tagline}
            </p>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ marginBottom: '6px' }}>
                📍 {config.contact.address}, {config.contact.city}
              </div>
              <div style={{ marginBottom: '6px' }}>📞 {config.contact.phone}</div>
              <div>✉️ {config.contact.email}</div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '20px',
              }}
            >
              Quick Links
            </div>
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About Us' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'news', label: 'News' },
              { id: 'contact', label: 'Contact' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px 0',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.65)',
                  fontFamily: 'var(--font-body)',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.color = template.colors.secondary
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '20px',
              }}
            >
              Admissions
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: '8px' }}>
                <span
                  style={{
                    color: config.admissions.isOpen ? '#22C55E' : '#EF4444',
                    fontWeight: 600,
                  }}
                >
                  {config.admissions.isOpen ? '● Open' : '● Closed'}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>{config.admissions.sessionLabel}</div>
              {config.admissions.deadline && (
                <div
                  style={{
                    marginBottom: '16px',
                    color: 'rgba(255,255,255,0.45)',
                    fontSize: '13px',
                  }}
                >
                  Deadline:{' '}
                  {new Date(config.admissions.deadline).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
              {config.admissions.isOpen && (
                <button
                  onClick={() => onNavigate('admissions')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: template.colors.secondary,
                    color: template.colors.primary,
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Apply Now →
                </button>
              )}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '20px',
              }}
            >
              Follow Us
            </div>
            {Object.entries(config.social)
              .filter(([, value]) => !!value)
              .map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '8px 0',
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.65)',
                    textDecoration: 'none',
                    textTransform: 'capitalize',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.color = template.colors.secondary
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                  }}
                >
                  {platform}
                </a>
              ))}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} {config.schoolName}. All rights reserved.
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
            Powered by{' '}
            <a
              href="https://schoolos.ng"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: template.colors.secondary, textDecoration: 'none', fontWeight: 600 }}
            >
              SchoolOS
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
