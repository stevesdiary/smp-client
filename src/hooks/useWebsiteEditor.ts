import { useEffect, useMemo, useState } from 'react'
import { saveWebsiteConfig } from '@/api/website-editor.api'
import { getApiErrorMessage } from '@/lib/utils'
import type {
  AboutSection,
  AdmissionsConfig,
  GalleryImage,
  HeroSection,
  NewsPost,
  SchoolContact,
  SchoolWebsiteConfig,
  SocialLinks,
  TemplateId,
  Testimonial,
} from '@/types/school-website'

type SectionName =
  | 'template'
  | 'identity'
  | 'hero'
  | 'about'
  | 'gallery'
  | 'news'
  | 'testimonials'
  | 'admissions'
  | 'contact'
  | 'social'
  | 'seo'

type SectionDataMap = {
  template: { templateId: TemplateId }
  identity: Pick<SchoolWebsiteConfig, 'schoolName' | 'tagline' | 'logoUrl' | 'faviconUrl'>
  hero: HeroSection
  about: AboutSection
  gallery: GalleryImage[]
  news: NewsPost[]
  testimonials: Testimonial[]
  admissions: AdmissionsConfig
  contact: SchoolContact
  social: SocialLinks
  seo: Pick<SchoolWebsiteConfig, 'metaDescription' | 'ogImageUrl'>
}

interface SaveResult {
  success: boolean
  error?: string
}

export function useWebsiteEditor(initialConfig: SchoolWebsiteConfig | null) {
  const [config, setConfig] = useState<SchoolWebsiteConfig | null>(initialConfig)
  const [savedConfig, setSavedConfig] = useState<SchoolWebsiteConfig | null>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setConfig(initialConfig)
    setSavedConfig(initialConfig)
  }, [initialConfig])

  const isDirty = useMemo(() => {
    if (!config || !savedConfig) {
      return false
    }

    return JSON.stringify(config) !== JSON.stringify(savedConfig)
  }, [config, savedConfig])

  const updateSection = (section: SectionName, data: SectionDataMap[SectionName]) => {
    setConfig((current) => {
      if (!current) {
        return current
      }

      switch (section) {
        case 'template':
          return { ...current, templateId: (data as SectionDataMap['template']).templateId }
        case 'identity':
          return { ...current, ...(data as SectionDataMap['identity']) }
        case 'hero':
          return { ...current, hero: data as SectionDataMap['hero'] }
        case 'about':
          return { ...current, about: data as SectionDataMap['about'] }
        case 'gallery':
          return { ...current, gallery: data as SectionDataMap['gallery'] }
        case 'news':
          return { ...current, news: data as SectionDataMap['news'] }
        case 'testimonials':
          return { ...current, testimonials: data as SectionDataMap['testimonials'] }
        case 'admissions':
          return { ...current, admissions: data as SectionDataMap['admissions'] }
        case 'contact':
          return { ...current, contact: data as SectionDataMap['contact'] }
        case 'social':
          return { ...current, social: data as SectionDataMap['social'] }
        case 'seo':
          return { ...current, ...(data as SectionDataMap['seo']) }
        default:
          return current
      }
    })
  }

  const save = async (): Promise<SaveResult> => {
    if (!config) {
      return { success: false, error: 'Website config is not loaded yet.' }
    }

    setIsSaving(true)

    try {
      const response = await saveWebsiteConfig(config)
      if (!response.success) {
        return { success: false, error: 'Failed to save website settings.' }
      }

      setSavedConfig(config)
      return { success: true }
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error, 'Failed to save website settings.') }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    config,
    updateSection,
    isSaving,
    isDirty,
    hasUnsavedChanges: isDirty,
    save,
  }
}
