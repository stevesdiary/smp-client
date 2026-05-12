// src/components/school/pages/AboutPage.tsx
'use client';
import type { SchoolWebsiteConfig, Template } from '@/types/school-website';
import { SectionHeading } from '../SectionHeading';

interface Props { config: SchoolWebsiteConfig; template: Template; }

export function AboutPage({ config, template }: Props) {
  const { about } = config;
  return (
    <div style={{ backgroundColor: template.colors.background }}>
      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', backgroundColor: template.colors.primary }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: template.colors.secondary, marginBottom: '16px' }}>About Us</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: '24px' }}>
            Our Story, Mission &amp; Vision
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
            {about.story}
          </p>
        </div>
      </section>

      {/* Stats */}
      {about.stats.length > 0 && (
        <section style={{ backgroundColor: template.colors.secondary, padding: '40px 24px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${Math.min(about.stats.length, 4)}, 1fr)`, gap: '24px' }}>
            {about.stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '44px', fontWeight: 800, color: template.colors.primary }}>{s.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: template.colors.primary, opacity: 0.7, marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mission & Vision */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          {[
            { label: 'Our Mission', icon: '🎯', content: about.mission },
            { label: 'Our Vision', icon: '🌟', content: about.vision },
          ].map((item, i) => (
            <div key={i} style={{ padding: '40px', borderRadius: '16px', backgroundColor: template.colors.surface, border: `1px solid ${template.colors.border}` }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{item.icon}</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: template.colors.primary, marginBottom: '16px' }}>{item.label}</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.8, color: template.colors.textLight }}>{item.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founded */}
      {about.foundedYear && (
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              padding: '48px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.primary}cc)`,
              display: 'flex', alignItems: 'center', gap: '48px',
            }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '80px', fontWeight: 900, color: template.colors.secondary, lineHeight: 1 }}>{about.foundedYear}</div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Founded</div>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: '#FFF', marginBottom: '12px' }}>
                  {new Date().getFullYear() - about.foundedYear}+ Years of Educational Excellence
                </h3>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  Since {about.foundedYear}, {config.schoolName} has been a pillar of academic excellence, producing graduates who lead in their fields across Nigeria and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
