'use client'

import type { Template } from '@/types/school-website'

interface SectionHeadingProps {
  template: Template
  eyebrow: string
  title: string
  light?: boolean
  centered?: boolean
}

export function SectionHeading({
  template,
  eyebrow,
  title,
  light = false,
  centered = false,
}: SectionHeadingProps) {
  return (
    <div style={{ marginBottom: '48px', textAlign: centered ? 'center' : 'left' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: template.colors.secondary,
          marginBottom: '12px',
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 800,
          color: light ? '#FFFFFF' : template.colors.text,
          lineHeight: 1.15,
          whiteSpace: 'pre-line',
        }}
      >
        {title}
      </h2>
    </div>
  )
}
