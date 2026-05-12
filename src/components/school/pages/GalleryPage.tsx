'use client'

import { useState } from 'react'
import type { GalleryImage, SchoolWebsiteConfig, Template } from '@/types/school-website'
import { SectionHeading } from '../SectionHeading'

interface Props {
  config: SchoolWebsiteConfig
  template: Template
}

const CATEGORIES = ['all', 'academics', 'sports', 'events', 'facilities', 'graduation'] as const

export function GalleryPage({ config, template }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)

  const filtered =
    activeCategory === 'all'
      ? config.gallery
      : config.gallery.filter((galleryImage) => galleryImage.category === activeCategory)

  return (
    <div style={{ padding: '64px 24px 80px', backgroundColor: template.colors.background }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeading template={template} eyebrow="Our School" title="Gallery" />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '8px 20px',
                borderRadius: '100px',
                border: `1.5px solid ${
                  activeCategory === category ? template.colors.primary : template.colors.border
                }`,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: activeCategory === category ? template.colors.primary : 'transparent',
                color: activeCategory === category ? '#FFF' : template.colors.textLight,
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <div style={{ columns: '3', columnGap: '16px' }}>
          {filtered.map((image) => (
            <div
              key={image.id}
              onClick={() => setLightbox(image)}
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <img
                src={image.url}
                alt={image.caption ?? ''}
                style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'scale(1.03)'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'scale(1)'
                }}
              />
              {image.caption && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    color: '#FFF',
                    fontSize: '13px',
                  }}
                >
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: template.colors.textLight }}>
            No images in this category yet.
          </div>
        )}

        {lightbox && (
          <div
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? ''}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onClick={(event) => event.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#FFF',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
