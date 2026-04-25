'use client';

// src/components/school/SchoolWebsiteShell.tsx
// The master shell component that renders any school website.
// Applies the chosen template's colors and fonts, renders the nav,
// routes between pages, and renders the footer.
// All six pages render client-side via URL search params (?page=about etc.)

import { useEffect, useState, type CSSProperties } from 'react'
import type { SchoolWebsiteConfig } from '@/types/school-website'
import { getTemplate } from '@/types/school-website';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { GalleryPage } from './pages/GalleryPage';
import { NewsPage } from './pages/NewsPage';
import { ContactPage } from './pages/ContactPage';
import { SchoolNav } from './SchoolNav';
import { SchoolFooter } from './SchoolFooter';

export interface SchoolWebsiteShellProps {
  config: SchoolWebsiteConfig;
  activePage: string;
}

type PageId = 'home' | 'about' | 'admissions' | 'gallery' | 'news' | 'contact';

const PAGES: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'news', label: 'News' },
  { id: 'contact', label: 'Contact' },
];

export function SchoolWebsiteShell({ config, activePage }: SchoolWebsiteShellProps) {
  const template = getTemplate(config.templateId);
  const [currentPage, setCurrentPage] = useState<PageId>((activePage as PageId) || 'home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Inject CSS variables from template
  const cssVars = {
    '--color-primary': template.colors.primary,
    '--color-secondary': template.colors.secondary,
    '--color-background': template.colors.background,
    '--color-surface': template.colors.surface,
    '--color-text': template.colors.text,
    '--color-text-light': template.colors.textLight,
    '--color-border': template.colors.border,
    '--font-display': `"${template.typography.displayFont}", Georgia, serif`,
    '--font-body': `"${template.typography.bodyFont}", system-ui, sans-serif`,
  } as CSSProperties;

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update URL without full reload
    const url = new URL(window.location.href);
    if (page === 'home') {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', page);
    }
    window.history.pushState({}, '', url.toString());
  };

  // Google Fonts injection
  useEffect(() => {
    const fonts = [template.typography.displayFont, template.typography.bodyFont]
      .map(f => f.replace(/ /g, '+'))
      .join('&family=');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [template.typography]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':        return <HomePage config={config} template={template} onNavigate={navigate} />;
      case 'about':       return <AboutPage config={config} template={template} />;
      case 'admissions':  return <AdmissionsPage config={config} template={template} />;
      case 'gallery':     return <GalleryPage config={config} template={template} />;
      case 'news':        return <NewsPage config={config} template={template} />;
      case 'contact':     return <ContactPage config={config} template={template} />;
      default:            return <HomePage config={config} template={template} onNavigate={navigate} />;
    }
  };

  return (
    <div
      style={{
        ...cssVars,
        backgroundColor: template.colors.background,
        color: template.colors.text,
        fontFamily: `var(--font-body)`,
        minHeight: '100vh',
      }}
    >
      <SchoolNav
        config={config}
        template={template}
        pages={PAGES}
        currentPage={currentPage}
        onNavigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobile={() => setMobileMenuOpen(v => !v)}
      />

      <main style={{ paddingTop: '72px' }}>
        {renderPage()}
      </main>

      <SchoolFooter config={config} template={template} onNavigate={navigate} />
    </div>
  );
}
