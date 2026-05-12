'use client';

// src/components/school/pages/HomePage.tsx

import type { SchoolWebsiteConfig, Template } from '@/types/school-website';
import { SectionHeading } from '../SectionHeading';

interface Props {
  config: SchoolWebsiteConfig;
  template: Template;
  onNavigate: (page: any) => void;
}

export function HomePage({ config, template, onNavigate }: Props) {
  const { hero, about, testimonials, news } = config;
  const isDark = template.id === 'bold';

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        style={{
          position: 'relative',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: template.colors.primary,
          backgroundImage: hero.backgroundImageUrl
            ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${hero.backgroundImageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Decorative geometric overlay */}
        {!hero.backgroundImageUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle at 30% 50%, ${template.colors.secondary}22 0%, transparent 60%),
              radial-gradient(circle at 80% 80%, ${template.colors.secondary}11 0%, transparent 50%)`,
          }} />
        )}

        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '80px 24px',
          position: 'relative', zIndex: 1,
          width: '100%',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px',
            borderRadius: '100px',
            border: `1px solid ${template.colors.secondary}66`,
            backgroundColor: `${template.colors.secondary}22`,
            marginBottom: '32px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: template.colors.secondary,
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: '13px', fontWeight: 500, letterSpacing: '0.08em',
              color: template.colors.secondary, textTransform: 'uppercase',
            }}>
              {config.admissions.isOpen ? `Admissions Open — ${config.admissions.sessionLabel}` : config.tagline}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(42px, 8vw, 84px)',
            fontWeight: 800,
            lineHeight: 1.05,
            color: '#FFFFFF',
            maxWidth: '700px',
            marginBottom: '24px',
            whiteSpace: 'pre-line',
          }}>
            {hero.headline}
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '560px',
            lineHeight: 1.7,
            marginBottom: '48px',
          }}>
            {hero.subheadline}
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('admissions')}
              style={{
                padding: '16px 36px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '16px', fontWeight: 700,
                backgroundColor: template.colors.secondary,
                color: template.colors.primary,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${template.colors.secondary}44`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {hero.ctaText}
            </button>
            <button
              onClick={() => onNavigate('about')}
              style={{
                padding: '16px 36px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '16px', fontWeight: 600,
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              About Our School
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%',
          transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <style>{`@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }`}</style>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STATS BAND                                                          */}
      {/* ------------------------------------------------------------------ */}
      {hero.showStats && about.stats.length > 0 && (
        <section style={{
          backgroundColor: template.colors.secondary,
          padding: '32px 24px',
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(about.stats.length, 4)}, 1fr)`,
            gap: '32px',
          }}>
            {about.stats.map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 5vw, 48px)',
                  fontWeight: 800,
                  color: template.colors.primary,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: template.colors.primary,
                  opacity: 0.7,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: '6px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MISSION PREVIEW                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section style={{ padding: '80px 24px', backgroundColor: template.colors.surface }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '80px',
            alignItems: 'center',
          }}>
            <div>
              <SectionHeading template={template} eyebrow="Our Purpose" title="Building Excellence,\nShaping Character" />
              <p style={{
                fontSize: '17px', lineHeight: 1.8,
                color: template.colors.textLight,
                marginBottom: '24px',
              }}>
                {about.mission}
              </p>
              <button
                onClick={() => onNavigate('about')}
                style={{
                  padding: '12px 28px',
                  borderRadius: '6px',
                  border: `2px solid ${template.colors.primary}`,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px', fontWeight: 600,
                  backgroundColor: 'transparent',
                  color: template.colors.primary,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = template.colors.primary;
                  (e.currentTarget as HTMLElement).style.color = '#FFF';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = template.colors.primary;
                }}
              >
                Read Our Story
              </button>
            </div>

            {/* Feature cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: '🎓', title: 'Academic Excellence', desc: 'Consistent top results in WAEC and NECO examinations' },
                { icon: '⚽', title: 'Sports & Arts', desc: 'Inter-house competitions and cultural programmes' },
                { icon: '🔬', title: 'Modern Facilities', desc: 'Fully equipped labs, library, and ICT centre' },
                { icon: '🤝', title: 'Strong Values', desc: 'Discipline, integrity, and leadership development' },
              ].map((feat, i) => (
                <div key={i} style={{
                  padding: '24px',
                  borderRadius: '12px',
                  backgroundColor: template.colors.background,
                  border: `1px solid ${template.colors.border}`,
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '12px' }}>{feat.icon}</div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px', fontWeight: 700,
                    color: template.colors.text,
                    marginBottom: '6px',
                  }}>{feat.title}</div>
                  <div style={{ fontSize: '13px', color: template.colors.textLight, lineHeight: 1.6 }}>{feat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* NEWS PREVIEW                                                        */}
      {/* ------------------------------------------------------------------ */}
      {news.length > 0 && (
        <section style={{ padding: '80px 24px', backgroundColor: template.colors.background }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
              <SectionHeading template={template} eyebrow="Latest News" title="What's Happening\nat School" />
              <button
                onClick={() => onNavigate('news')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '6px',
                  border: `1px solid ${template.colors.border}`,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px', fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: template.colors.textLight,
                }}
              >
                All News →
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
            }}>
              {news.slice(0, 3).map(post => (
                <article key={post.id} style={{
                  backgroundColor: template.colors.surface,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${template.colors.border}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                  onClick={() => onNavigate('news')}
                >
                  {post.coverImageUrl && (
                    <img src={post.coverImageUrl} alt={post.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  {!post.coverImageUrl && (
                    <div style={{
                      height: '8px',
                      backgroundColor: template.colors.secondary,
                    }} />
                  )}
                  <div style={{ padding: '24px' }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 500,
                      color: template.colors.secondary,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: '10px',
                    }}>
                      {new Date(post.publishedAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </div>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '17px', fontWeight: 700,
                      color: template.colors.text,
                      lineHeight: 1.4, marginBottom: '10px',
                    }}>
                      {post.title}
                    </h3>
                    <p style={{
                      fontSize: '14px', color: template.colors.textLight,
                      lineHeight: 1.6,
                    }}>
                      {post.excerpt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TESTIMONIALS                                                        */}
      {/* ------------------------------------------------------------------ */}
      {testimonials.length > 0 && (
        <section style={{
          padding: '80px 24px',
          backgroundColor: template.colors.primary,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '300px', height: '300px', borderRadius: '50%',
            backgroundColor: `${template.colors.secondary}15`,
          }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <SectionHeading
              template={template}
              eyebrow="Testimonials"
              title="What Our\nCommunity Says"
              light
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              marginTop: '48px',
            }}>
              {testimonials.slice(0, 3).map(t => (
                <div key={t.id} style={{
                  padding: '32px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{
                    fontSize: '40px', lineHeight: 1,
                    color: template.colors.secondary, marginBottom: '20px',
                    fontFamily: 'Georgia, serif',
                  }}>"</div>
                  <p style={{
                    fontSize: '15px', lineHeight: 1.8,
                    color: 'rgba(255,255,255,0.85)',
                    marginBottom: '24px',
                  }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      backgroundColor: template.colors.secondary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px', fontWeight: 700,
                      color: template.colors.primary,
                      flexShrink: 0,
                    }}>
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>{t.author}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADMISSIONS CTA BAND                                                 */}
      {/* ------------------------------------------------------------------ */}
      {config.admissions.isOpen && (
        <section style={{
          padding: '64px 24px',
          backgroundColor: template.colors.secondary,
        }}>
          <div style={{
            maxWidth: '700px', margin: '0 auto',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              color: template.colors.primary,
              marginBottom: '16px',
            }}>
              Admissions Open for {config.admissions.sessionLabel}
            </h2>
            <p style={{
              fontSize: '17px', color: template.colors.primary, opacity: 0.75,
              marginBottom: '32px', lineHeight: 1.6,
            }}>
              Secure your child's place at {config.schoolName}. Limited spaces available.
              {config.admissions.deadline && ` Apply before ${new Date(config.admissions.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
            </p>
            <button
              onClick={() => onNavigate('admissions')}
              style={{
                padding: '16px 48px',
                borderRadius: '8px',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '16px', fontWeight: 700,
                backgroundColor: template.colors.primary,
                color: '#FFFFFF',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              Start Application — {config.admissions.applicationFeeNaira > 0
                ? `₦${config.admissions.applicationFeeNaira.toLocaleString('en-NG')} Application Fee`
                : 'Free Application'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
