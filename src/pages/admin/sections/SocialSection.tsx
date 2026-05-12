import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SchoolWebsiteConfig, SocialLinks } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import { FieldError, FieldLabel, SectionShell, inputClassName } from './shared'

const httpsUrlSchema = z.union([
  z.literal(''),
  z.string().url('Enter a valid URL').refine((value) => value.startsWith('https://'), 'Use an https URL'),
])

const schema = z.object({
  facebook: httpsUrlSchema,
  instagram: httpsUrlSchema,
  twitter: httpsUrlSchema,
  youtube: httpsUrlSchema,
})

type FormValues = z.infer<typeof schema>

interface SocialSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: SocialLinks) => void
}

function SocialIcon({ platform }: { platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' }) {
  const commonProps = {
    className: 'h-5 w-5 text-gray-500',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
  }

  switch (platform) {
    case 'facebook':
      return (
        <svg {...commonProps}>
          <path d="M14 8h2V4h-2c-2.8 0-5 2.2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1Z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'twitter':
      return (
        <svg {...commonProps}>
          <path d="m4 4 6.5 7.8L4.4 20H7l4.7-5.8L16.6 20H20l-6.8-8.1L19.2 4h-2.6l-4.2 5.2L7.6 4H4Z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...commonProps}>
          <path d="M22 12s0-3.2-.4-4.7A3 3 0 0 0 19.5 5C18 4.6 12 4.6 12 4.6S6 4.6 4.5 5A3 3 0 0 0 2.4 7.3C2 8.8 2 12 2 12s0 3.2.4 4.7A3 3 0 0 0 4.5 19c1.5.4 7.5.4 7.5.4s6 0 7.5-.4a3 3 0 0 0 2.1-2.3C22 15.2 22 12 22 12Z" />
          <path d="m10 15 5-3-5-3v6Z" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}

export function SocialSection({ config, onChange }: SocialSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      facebook: config.social.facebook ?? '',
      instagram: config.social.instagram ?? '',
      twitter: config.social.twitter ?? '',
      youtube: config.social.youtube ?? '',
    }),
    [config.social.facebook, config.social.instagram, config.social.twitter, config.social.youtube],
  )

  const {
    register,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formValue,
    mode: 'onChange',
  })

  const toPayload = useCallback(
    (value: FormValues) => ({
      facebook: value.facebook || undefined,
      instagram: value.instagram || undefined,
      twitter: value.twitter || undefined,
      youtube: value.youtube || undefined,
    }),
    [],
  )

  useSyncedFormSection({
    formValue,
    watch,
    reset,
    toPayload,
    onChange,
  })

  return (
    <SectionShell
      title="Social"
      description="Add optional social media profiles. Only valid https links are allowed."
    >
      {(['facebook', 'instagram', 'twitter', 'youtube'] as const).map((platform) => (
        <div key={platform}>
          <FieldLabel label={`${platform === 'twitter' ? 'Twitter/X' : platform[0].toUpperCase() + platform.slice(1)} URL`} />
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-300 bg-white px-4">
            <SocialIcon platform={platform} />
            <input
              {...register(platform)}
              className="h-12 flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none"
              placeholder={`https://${platform}.com/your-school`}
            />
          </div>
          <FieldError message={errors[platform]?.message} />
        </div>
      ))}
    </SectionShell>
  )
}
