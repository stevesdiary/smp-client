import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AdmissionsConfig, SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  Toggle,
  formatNaira,
  inputClassName,
  primaryButtonClassName,
} from './shared'

const schema = z.object({
  isOpen: z.boolean(),
  sessionLabel: z.string().min(1, 'Session label is required'),
  applicationFeeNaira: z.number().min(0, 'Fee cannot be negative'),
  availableClasses: z.array(z.string().min(1)).min(1, 'Add at least one available class'),
  requirements: z.array(z.string().min(1)).min(1, 'Add at least one requirement'),
  deadline: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AdmissionsSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: AdmissionsConfig) => void
}

function ChipInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState('')

  const addChip = () => {
    const normalized = draft.trim()
    if (!normalized || value.includes(normalized)) {
      setDraft('')
      return
    }

    onChange([...value, normalized])
    setDraft('')
  }

  return (
    <div>
      <FieldLabel label={label} />
      <div className="mt-2 rounded-3xl border border-gray-300 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
            >
              {item}
              <button type="button" onClick={() => onChange(value.filter((entry) => entry !== item))}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addChip()
            }
          }}
          onBlur={addChip}
          className="mt-3 w-full border-0 bg-transparent px-1 py-1 text-sm text-gray-800 outline-none"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export function AdmissionsSection({ config, onChange }: AdmissionsSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      isOpen: config.admissions.isOpen,
      sessionLabel: config.admissions.sessionLabel,
      applicationFeeNaira: config.admissions.applicationFeeNaira,
      availableClasses: config.admissions.availableClasses,
      requirements: config.admissions.requirements,
      deadline: config.admissions.deadline,
    }),
    [
      config.admissions.applicationFeeNaira,
      config.admissions.availableClasses,
      config.admissions.deadline,
      config.admissions.isOpen,
      config.admissions.requirements,
      config.admissions.sessionLabel,
    ],
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
      ...config.admissions,
      ...value,
      deadline: value.deadline || undefined,
      requiresPayment: value.applicationFeeNaira > 0,
    }),
    [config.admissions],
  )

  useSyncedFormSection({
    formValue,
    watch,
    reset,
    toPayload,
    onChange,
  })

  const feeValue = watch('applicationFeeNaira')
  const deadlineValue = watch('deadline')

  return (
    <SectionShell
      title="Admissions"
      description="Control whether applications are open and configure the metadata shown on the public admissions page."
    >
      <Controller
        control={control}
        name="isOpen"
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onChange={field.onChange}
            label="Admissions Open"
            description="This controls whether the public admissions form is visible."
            large
          />
        )}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FieldLabel label="Session Label" required />
          <input
            {...register('sessionLabel')}
            className={inputClassName}
            placeholder="2026/2027 Academic Session"
          />
          <FieldError message={errors.sessionLabel?.message} />
        </div>
        <div>
          <FieldLabel label="Application Fee in Naira" required />
          <input
            type="number"
            {...register('applicationFeeNaira', { valueAsNumber: true })}
            className={inputClassName}
            placeholder="5000"
          />
          <p className="mt-2 text-sm text-gray-500">
            {feeValue === 0 ? 'Free' : formatNaira(Number.isFinite(feeValue) ? feeValue : 0)}
          </p>
          <FieldError message={errors.applicationFeeNaira?.message} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Controller
          control={control}
          name="availableClasses"
          render={({ field }) => (
            <div>
              <ChipInput
                label="Available Classes"
                value={field.value}
                onChange={field.onChange}
                placeholder="Type a class name and press Enter"
              />
              <FieldError message={errors.availableClasses?.message} />
            </div>
          )}
        />

        <Controller
          control={control}
          name="requirements"
          render={({ field }) => (
            <div>
              <ChipInput
                label="Requirements"
                value={field.value}
                onChange={field.onChange}
                placeholder="Type a requirement and press Enter"
              />
              <FieldError message={errors.requirements?.message} />
            </div>
          )}
        />
      </div>

      <div className="max-w-sm">
        <FieldLabel label="Application Deadline" />
        <input type="date" {...register('deadline')} className={inputClassName} />
        <p className="mt-2 text-sm text-gray-500">
          {deadlineValue ? `Deadline set for ${deadlineValue}` : 'Rolling admissions'}
        </p>
      </div>
    </SectionShell>
  )
}
