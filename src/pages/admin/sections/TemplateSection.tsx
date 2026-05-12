import { useCallback, useMemo } from 'react'
import { Check } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TEMPLATES, type SchoolWebsiteConfig, type TemplateId } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import { FieldError, SectionShell } from './shared'

const schema = z.object({
  templateId: z.custom<TemplateId>(),
})

type FormValues = z.infer<typeof schema>

interface TemplateSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: { templateId: TemplateId }) => void
}

export function TemplateSection({ config, onChange }: TemplateSectionProps) {
  const formValue = useMemo<FormValues>(() => ({ templateId: config.templateId }), [config.templateId])

  const {
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formValue,
  })

  const toPayload = useCallback((value: FormValues) => ({ templateId: value.templateId }), [])

  useSyncedFormSection({
    formValue,
    watch,
    reset,
    toPayload,
    onChange,
  })

  return (
    <SectionShell
      title="Template"
      description="Choose the website template schools will use on the public site."
    >
      <Controller
        control={control}
        name="templateId"
        render={({ field }) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TEMPLATES.map((template) => {
              const active = field.value === template.id

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => field.onChange(template.id)}
                  className={`relative rounded-3xl border p-5 text-left transition ${
                    active
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                >
                  {active ? (
                    <span className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full border border-white shadow"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <span
                      className="h-5 w-5 rounded-full border border-white shadow"
                      style={{ backgroundColor: template.colors.secondary }}
                    />
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Typography
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      {template.typography.displayFont} / {template.typography.bodyFont}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      />
      <FieldError message={errors.templateId?.message} />
    </SectionShell>
  )
}
