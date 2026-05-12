'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import { SectionHeading } from '../SectionHeading'
import type { SchoolWebsiteConfig, Template } from '@/types/school-website'

interface Props {
  config: SchoolWebsiteConfig
  template: Template
}

export function ContactPage({ config, template }: Props) {
  const { contact, social } = config
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  const handleSend = (event: FormEvent) => {
    event.preventDefault()
    setSent(true)
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1.5px solid ${template.colors.border}`,
    backgroundColor: template.colors.surface,
    color: template.colors.text,
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '64px 24px 80px', backgroundColor: template.colors.background }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <SectionHeading template={template} eyebrow="Get in Touch" title="Contact Us" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' }}>
          <div>
            {[
              { icon: '📍', label: 'Address', value: `${contact.address}, ${contact.city}, ${contact.state}` },
              { icon: '📞', label: 'Phone', value: contact.phone },
              { icon: '✉️', label: 'Email', value: contact.email },
              ...(contact.whatsapp ? [{ icon: '💬', label: 'WhatsApp', value: contact.whatsapp }] : []),
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: `${template.colors.secondary}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: template.colors.textLight,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '4px',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: '15px', color: template.colors.text, fontWeight: 500 }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}

            {Object.entries(social).filter(([, value]) => !!value).length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: template.colors.textLight,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '16px',
                  }}
                >
                  Follow Us
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {Object.entries(social)
                    .filter(([, value]) => !!value)
                    .map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `1px solid ${template.colors.border}`,
                          color: template.colors.text,
                          fontSize: '13px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          textTransform: 'capitalize',
                          backgroundColor: template.colors.surface,
                        }}
                      >
                        {platform}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: template.colors.surface,
              padding: '40px',
              borderRadius: '16px',
              border: `1px solid ${template.colors.border}`,
            }}
          >
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    color: template.colors.text,
                    marginBottom: '12px',
                  }}
                >
                  Message Sent!
                </h3>
                <p style={{ color: template.colors.textLight }}>We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: 700,
                    color: template.colors.primary,
                    marginBottom: '28px',
                  }}
                >
                  Send a Message
                </h3>
                {[
                  { label: 'Your Name', field: 'name', type: 'text', placeholder: 'Full name' },
                  {
                    label: 'Email Address',
                    field: 'email',
                    type: 'email',
                    placeholder: 'your@email.com',
                  },
                  {
                    label: 'Phone Number',
                    field: 'phone',
                    type: 'tel',
                    placeholder: '+234 801 234 5678',
                  },
                ].map((field) => (
                  <div key={field.field} style={{ marginBottom: '20px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: template.colors.text,
                        marginBottom: '6px',
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required
                      style={inputStyle}
                      value={form[field.field as keyof typeof form]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field.field]: event.target.value }))
                      }
                    />
                  </div>
                ))}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: template.colors.text,
                      marginBottom: '6px',
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Your message..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, message: event.target.value }))
                    }
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    fontWeight: 700,
                    backgroundColor: template.colors.primary,
                    color: '#FFF',
                  }}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
