import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import { FieldError, FieldLabel, SectionShell, inputClassName, textareaClassName } from './shared'

const schema = z.object({
  metaDescription: z
    .string()
    .max(160, 'Meta description must be 160 characters or fewer')
    .optional(),
  ogImageUrl: z.union([z.literal(''), z.string().url('Enter a valid URL')]).optional(),
})

type FormValues = z.infer<typeof schema>

interface SEOSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: Pick<SchoolWebsiteConfig, 'metaDescription' | 'ogImageUrl'>) => void
}

export function SEOSection({ config, onChange }: SEOSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      metaDescription: config.metaDescription ?? '',
      ogImageUrl: config.ogImageUrl ?? '',
    }),
    [config.metaDescription, config.ogImageUrl],
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
      metaDescription: value.metaDescription || undefined,
      ogImageUrl: value.ogImageUrl || undefined,
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

  const metaDescription = watch('metaDescription') ?? ''
  const remaining = 160 - metaDescription.length

  return (
    <SectionShell
      title="SEO"
      description="Improve how the school website appears in search results and link previews."
    >
      <div>
        <FieldLabel label="Meta Description" hint={`${remaining} remaining`} />
        <textarea {...register('metaDescription')} className={textareaClassName} />
        <p className={`mt-2 text-sm ${remaining < 20 ? 'text-red-600' : 'text-gray-500'}`}>
          {remaining < 20 ? 'You are close to the 160 character limit.' : 'Shorter descriptions perform better in search results.'}
        </p>
        <FieldError message={errors.metaDescription?.message} />
      </div>

      <div>
        <FieldLabel label="OG Image URL" />
        <input
          {...register('ogImageUrl')}
          className={inputClassName}
          placeholder="https://example.com/social-preview.jpg"
        />
        <FieldError message={errors.ogImageUrl?.message} />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Google Preview</p>
        <div className="mt-4 max-w-2xl space-y-1">
          <div className="text-xl text-[#1a0dab]">{config.schoolName}</div>
          <div className="text-sm text-[#006621]">
            {config.customDomainVerified && config.customDomain
              ? config.customDomain
              : `schoolos.ng/${config.slug}`}
          </div>
          <p className="text-sm text-[#4d5156]">
            {metaDescription || 'Add a meta description to preview how the school appears in Google search results.'}
          </p>
        </div>
      </div>
    </SectionShell>
  )
}
