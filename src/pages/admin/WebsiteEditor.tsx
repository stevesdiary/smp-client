import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Globe, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'
import { getWebsiteConfig } from '@/api/website-editor.api'
import { useWebsiteEditor } from '@/hooks/useWebsiteEditor'
import type { SchoolWebsiteConfig } from '@/types/school-website'
import { AboutSection } from './sections/AboutSection'
import { AdmissionsSection } from './sections/AdmissionsSection'
import { ContactSection } from './sections/ContactSection'
import { GallerySection } from './sections/GallerySection'
import { HeroSection } from './sections/HeroSection'
import { IdentitySection } from './sections/IdentitySection'
import { NewsSection } from './sections/NewsSection'
import { SEOSection } from './sections/SEOSection'
import { SocialSection } from './sections/SocialSection'
import { TemplateSection } from './sections/TemplateSection'
import { TestimonialsSection } from './sections/TestimonialsSection'

const sections = [
  { id: 'template', label: 'Template' },
  { id: 'identity', label: 'Identity' },
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'news', label: 'News' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social' },
  { id: 'seo', label: 'SEO' },
] as const

type SectionId = (typeof sections)[number]['id']

function buildLiveSiteUrl(config: SchoolWebsiteConfig | null) {
  if (!config) {
    return null
  }

  if (config.customDomainVerified && config.customDomain) {
    return config.customDomain.startsWith('http')
      ? config.customDomain
      : `https://${config.customDomain}`
  }

  const base = import.meta.env.VITE_SCHOOL_WEBSITE_BASE_URL
  if (!base) {
    return null
  }

  return new URL(config.slug, `${base.replace(/\/$/, '')}/`).toString()
}

export default function WebsiteEditor() {
  const [activeSection, setActiveSection] = useState<SectionId>('template')
  const [initialConfig, setInitialConfig] = useState<SchoolWebsiteConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const { config, updateSection, save, isDirty, isSaving, hasUnsavedChanges } = useWebsiteEditor(initialConfig)

  const liveSiteUrl = useMemo(() => buildLiveSiteUrl(config), [config])

  const loadConfig = async () => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await getWebsiteConfig()
      setInitialConfig(response)
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load website settings.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadConfig()
  }, [])

  const uploadFile = async (file: File, target: { domain: 'branding' | 'gallery'; entityId: string }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('domain', target.domain)
    formData.append('entityId', target.entityId)

    const response = await api.post<{ url: string; key: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response.data.url
  }

  const handleSave = async () => {
    const result = await save()
    if (result.success) {
      toast.success('Website settings saved.')
      return
    }

    toast.error(result.error ?? 'Failed to save website settings.')
  }

  const renderSection = () => {
    if (!config) {
      return null
    }

    switch (activeSection) {
      case 'template':
        return <TemplateSection config={config} onChange={(data) => updateSection('template', data)} />
      case 'identity':
        return (
          <IdentitySection
            config={config}
            onChange={(data) => updateSection('identity', data)}
            uploadFile={uploadFile}
          />
        )
      case 'hero':
        return <HeroSection config={config} onChange={(data) => updateSection('hero', data)} />
      case 'about':
        return <AboutSection config={config} onChange={(data) => updateSection('about', data)} />
      case 'gallery':
        return (
          <GallerySection
            config={config}
            onChange={(data) => updateSection('gallery', data)}
            uploadFile={uploadFile}
          />
        )
      case 'news':
        return <NewsSection config={config} onChange={(data) => updateSection('news', data)} />
      case 'testimonials':
        return (
          <TestimonialsSection
            config={config}
            onChange={(data) => updateSection('testimonials', data)}
          />
        )
      case 'admissions':
        return (
          <AdmissionsSection
            config={config}
            onChange={(data) => updateSection('admissions', data)}
          />
        )
      case 'contact':
        return <ContactSection config={config} onChange={(data) => updateSection('contact', data)} />
      case 'social':
        return <SocialSection config={config} onChange={(data) => updateSection('social', data)} />
      case 'seo':
        return <SEOSection config={config} onChange={(data) => updateSection('seo', data)} />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded-full bg-gray-100" />
          <div className="mt-4 h-4 w-80 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[240px,1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="mb-3 h-12 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mb-4 h-12 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <Globe className="mt-1 h-5 w-5 text-red-600" />
          <div>
            <h1 className="text-xl font-semibold text-red-900">Website editor unavailable</h1>
            <p className="mt-2 text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadConfig()}
              className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Website Editor</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure the school&apos;s public website without leaving the SchoolOS dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {liveSiteUrl ? (
              <a
                href={liveSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live Site
              </a>
            ) : (
              <span className="inline-flex items-center rounded-2xl border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-400">
                View Live Site unavailable
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!isDirty || isSaving}
              className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
        {hasUnsavedChanges ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have unsaved changes.
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[240px,1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium transition ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{renderSection()}</div>
      </div>
    </div>
  )
}
