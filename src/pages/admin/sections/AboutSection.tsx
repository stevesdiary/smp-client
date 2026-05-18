import { useCallback, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AboutSection as AboutSectionConfig, SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  inputClassName,
  primaryButtonClassName,
  textareaClassName,
} from './shared'

const statSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
})

const schema = z.object({
  mission: z.string().min(1, 'Mission is required'),
  vision: z.string().min(1, 'Vision is required'),
  story: z.string().min(1, 'Story is required'),
  foundedYear: z
    .union([z.number().int().min(1800).max(3000), z.nan()])
    .optional(),
  stats: z.array(statSchema).max(6, 'You can add up to 6 stats'),
})

type FormValues = {
  mission: string
  vision: string
  story: string
  foundedYear?: number
  stats: { label: string; value: string }[]
}

interface AboutSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: AboutSectionConfig) => void
}

export function AboutSection({ config, onChange }: AboutSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      mission: config.about.mission,
      vision: config.about.vision,
      story: config.about.story,
      foundedYear: config.about.foundedYear,
      stats: config.about.stats,
    }),
    [config.about.foundedYear, config.about.mission, config.about.stats, config.about.story, config.about.vision],
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'stats',
  })

  const toPayload = useCallback(
    (value: FormValues) => ({
      ...config.about,
      mission: value.mission,
      vision: value.vision,
      story: value.story,
      foundedYear: typeof value.foundedYear === 'number' && !Number.isNaN(value.foundedYear) ? value.foundedYear : undefined,
      stats: value.stats,
    }),
    [config.about],
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
      title="About"
      description="Tell the school story and highlight the credibility stats shown on the public site."
    >
      <div className="grid gap-6">
        <div>
          <FieldLabel label="Mission" required />
          <textarea {...register('mission')} className={textareaClassName} placeholder="To provide world-class education..." />
          <FieldError message={errors.mission?.message} />
        </div>
        <div>
          <FieldLabel label="Vision" required />
          <textarea {...register('vision')} className={textareaClassName} placeholder="To be the most respected private school..." />
          <FieldError message={errors.vision?.message} />
        </div>
        <div>
          <FieldLabel label="Story" required />
          <textarea
            {...register('story')}
            className={`${textareaClassName} min-h-[200px]`}
            placeholder="Founded in 2001, Victory Heights Academy began..."
          />
          <FieldError message={errors.story?.message} />
        </div>
      </div>

      <div className="max-w-sm">
        <FieldLabel label="Founded Year" />
        <input
          type="number"
          {...register('foundedYear', { valueAsNumber: true })}
          className={inputClassName}
          placeholder="2001"
        />
        <FieldError message={errors.foundedYear?.message} />
      </div>

      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Stats</h3>
            <p className="mt-1 text-sm text-gray-500">Add up to six homepage stats.</p>
          </div>
          <button
            type="button"
            onClick={() => append({ label: '', value: '' })}
            disabled={fields.length >= 6}
            className={primaryButtonClassName}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stat
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
                <div>
                  <FieldLabel label="Label" required />
                  <input
                    {...register(`stats.${index}.label`)}
                    className={inputClassName}
                    placeholder="Years of Excellence"
                  />
                  <FieldError message={errors.stats?.[index]?.label?.message} />
                </div>
                <div>
                  <FieldLabel label="Value" required />
                  <input {...register(`stats.${index}.value`)} className={inputClassName} placeholder="25+" />
                  <FieldError message={errors.stats?.[index]?.value?.message} />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <FieldError message={errors.stats?.message} />
      </div>
    </SectionShell>
  )
}
