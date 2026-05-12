'use client'

import { SectionHeading } from '../SectionHeading'
import type { SchoolWebsiteConfig, Template } from '@/types/school-website'

interface Props {
  config: SchoolWebsiteConfig
  template: Template
}

export function NewsPage({ config, template }: Props) {
  const { news } = config

  return (
    <div style={{ padding: '64px 24px 80px', backgroundColor: template.colors.background }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <SectionHeading template={template} eyebrow="Latest Updates" title="News & Announcements" />

        {news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: template.colors.textLight }}>
            No news posts yet.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '28px',
            }}
          >
            {news.map((post) => (
              <article
                key={post.id}
                style={{
                  backgroundColor: template.colors.surface,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${template.colors.border}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-4px)'
                  event.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)'
                  event.currentTarget.style.boxShadow = 'none'
                }}
              >
                {post.coverImageUrl ? (
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: '6px', backgroundColor: template.colors.secondary }} />
                )}
                <div style={{ padding: '28px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: template.colors.secondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '10px',
                    }}
                  >
                    {new Date(post.publishedAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: template.colors.text,
                      lineHeight: 1.4,
                      marginBottom: '12px',
                    }}
                  >
                    {post.title}
                  </h2>
                  <p style={{ fontSize: '14px', color: template.colors.textLight, lineHeight: 1.7 }}>
                    {post.excerpt}
                  </p>
                  <div style={{ marginTop: '20px', fontSize: '12px', color: template.colors.textLight }}>
                    By {post.author}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
