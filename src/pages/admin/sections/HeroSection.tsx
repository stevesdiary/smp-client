import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { HeroSection as HeroSectionConfig, SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  Toggle,
  inputClassName,
  textareaClassName,
} from './shared'

const schema = z.object({
  headline: z.string().min(1, 'Headline is required').max(60, 'Headline must be 60 characters or fewer'),
  subheadline: z
    .string()
    .min(1, 'Subheadline is required')
    .max(160, 'Subheadline must be 160 characters or fewer'),
  ctaText: z.string().min(1, 'CTA text is required').max(40, 'CTA text must be 40 characters or fewer'),
  showStats: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface HeroSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: HeroSectionConfig) => void
}

export function HeroSection({ config, onChange }: HeroSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      headline: config.hero.headline,
      subheadline: config.hero.subheadline,
      ctaText: config.hero.ctaText,
      showStats: config.hero.showStats,
    }),
    [config.hero.ctaText, config.hero.headline, config.hero.showStats, config.hero.subheadline],
  )

  const {
    control,
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
      ...config.hero,
      ...value,
    }),
    [config.hero],
  )

  useSyncedFormSection({
    formValue,
    watch,
    reset,
    toPayload,
    onChange,
  })

  const headlineValue = watch('headline')
  const subheadlineValue = watch('subheadline')
  const ctaTextValue = watch('ctaText')

  return (
    <SectionShell
      title="Hero"
      description="Control the landing copy and headline area that visitors see first."
    >
      <div>
        <FieldLabel label="Headline" hint={`${headlineValue.length}/60`} required />
        <textarea
          {...register('headline')}
          className={`${textareaClassName} min-h-[110px]`}
          placeholder="Excellence is our standard"
        />
        <FieldError message={errors.headline?.message} />
      </div>

      <div>
        <FieldLabel label="Subheadline" hint={`${subheadlineValue.length}/160`} required />
        <textarea
          {...register('subheadline')}
          className={`${textareaClassName} min-h-[130px]`}
          placeholder="A premier private school in the heart of Lagos."
        />
        <FieldError message={errors.subheadline?.message} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <FieldLabel label="CTA Button Text" hint={`${ctaTextValue.length}/40`} required />
          <input {...register('ctaText')} className={inputClassName} placeholder="Apply Now" />
          <FieldError message={errors.ctaText?.message} />
        </div>
        <Controller
          control={control}
          name="showStats"
          render={({ field }) => (
            <div>
              <FieldLabel label="Show Stats" />
              <div className="mt-2">
                <Toggle
                  checked={field.value}
                  onChange={field.onChange}
                  label="Display the stats band below the hero"
                  description="Turn this off to keep the homepage intro cleaner."
                />
              </div>
            </div>
          )}
        />
      </div>
    </SectionShell>
  )
}
