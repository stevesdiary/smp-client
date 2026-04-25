'use client';

// src/components/school/SchoolNav.tsx

import type { SchoolWebsiteConfig, Template } from '@/types/school-website';

interface NavProps {
  config: SchoolWebsiteConfig;
  template: Template;
  pages: { id: string; label: string }[];
  currentPage: string;
  onNavigate: (page: any) => void;
  mobileMenuOpen: boolean;
  onToggleMobile: () => void;
}

export function SchoolNav({
  config, template, pages, currentPage, onNavigate, mobileMenuOpen, onToggleMobile,
}: NavProps) {
  const isDark = template.id === 'bold';

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        backgroundColor: isDark ? template.colors.surface : template.colors.primary,
        borderBottom: `1px solid ${isDark ? template.colors.border : 'transparent'}`,
        boxShadow: '0 1px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>

          {/* Logo + School Name */}
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.schoolName} style={{ height: '44px', width: 'auto' }} />
            ) : (
              <div style={{
                width: '44px', height: '44px', borderRadius: '8px',
                backgroundColor: template.colors.secondary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '20px', fontWeight: 700,
                color: template.colors.primary,
              }}>
                {config.schoolName.charAt(0)}
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px', fontWeight: 700,
                color: isDark ? template.colors.text : '#FFFFFF',
                lineHeight: 1.2,
              }}>
                {config.schoolName}
              </div>
              {config.tagline && (
                <div style={{
                  fontSize: '11px',
                  color: isDark ? template.colors.textLight : 'rgba(255,255,255,0.7)',
                  lineHeight: 1.2,
                }}>
                  {config.tagline}
                </div>
              )}
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            className="desktop-nav"
          >
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => onNavigate(page.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: currentPage === page.id ? 600 : 400,
                  color: currentPage === page.id
                    ? (isDark ? template.colors.secondary : template.colors.secondary)
                    : (isDark ? template.colors.textLight : 'rgba(255,255,255,0.85)'),
                  backgroundColor: currentPage === page.id
                    ? 'rgba(255,255,255,0.1)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {page.label}
              </button>
            ))}

            {/* Apply CTA */}
            <button
              onClick={() => onNavigate('admissions')}
              style={{
                marginLeft: '8px',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: template.colors.secondary,
                color: template.colors.primary,
                transition: 'opacity 0.15s ease',
              }}
            >
              Apply Now
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={onToggleMobile}
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDark ? template.colors.text : '#FFFFFF',
              padding: '8px',
            }}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="round" />
                  <line x1="3" y1="14" x2="21" y2="14" strokeLinecap="round" />
                  <line x1="3" y1="20" x2="21" y2="20" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            paddingBottom: '16px',
            borderTop: `1px solid rgba(255,255,255,0.1)`,
          }}
            className="mobile-menu"
          >
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => onNavigate(page.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '12px 8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: currentPage === page.id ? 600 : 400,
                  color: isDark ? template.colors.text : '#FFFFFF',
                  borderBottom: `1px solid rgba(255,255,255,0.05)`,
                }}
              >
                {page.label}
              </button>
            ))}
            <button
              onClick={() => onNavigate('admissions')}
              style={{
                marginTop: '12px', width: '100%',
                padding: '12px 20px',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '15px', fontWeight: 600,
                backgroundColor: template.colors.secondary,
                color: template.colors.primary,
              }}
            >
              Apply Now
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
