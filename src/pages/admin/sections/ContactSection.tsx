import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SchoolContact, SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  inputClassName,
  nigerianStates,
  selectClassName,
} from './shared'

const schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email('Enter a valid email address'),
  whatsapp: z.string().optional(),
  googleMapsUrl: z.union([z.literal(''), z.string().url('Enter a valid URL')]).optional(),
})

type FormValues = z.infer<typeof schema>

interface ContactSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: SchoolContact) => void
}

export function ContactSection({ config, onChange }: ContactSectionProps) {
  const formValue = useMemo<FormValues>(
    () => ({
      address: config.contact.address,
      city: config.contact.city,
      state: config.contact.state,
      phone: config.contact.phone,
      email: config.contact.email,
      whatsapp: config.contact.whatsapp,
      googleMapsUrl: config.contact.googleMapsUrl ?? '',
    }),
    [
      config.contact.address,
      config.contact.city,
      config.contact.email,
      config.contact.googleMapsUrl,
      config.contact.phone,
      config.contact.state,
      config.contact.whatsapp,
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
      address: value.address,
      city: value.city,
      state: value.state,
      phone: value.phone,
      email: value.email,
      whatsapp: value.whatsapp || undefined,
      googleMapsUrl: value.googleMapsUrl || undefined,
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
      title="Contact"
      description="Set the school address, support details, and map link shown on the public site."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FieldLabel label="Address" required />
          <input {...register('address')} className={inputClassName} placeholder="14 Academy Road, Lekki Phase 1" />
          <FieldError message={errors.address?.message} />
        </div>
        <div>
          <FieldLabel label="City" required />
          <input {...register('city')} className={inputClassName} placeholder="Lagos" />
          <FieldError message={errors.city?.message} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Controller
          control={control}
          name="state"
          render={({ field }) => (
            <div>
              <FieldLabel label="State" required />
              <select className={selectClassName} value={field.value} onChange={field.onChange}>
                <option value="">Select a state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <FieldError message={errors.state?.message} />
            </div>
          )}
        />
        <div>
          <FieldLabel label="Phone" required />
          <div className="mt-2 flex items-center rounded-2xl border border-gray-300 bg-white px-4">
            <span className="text-sm font-medium text-gray-500">+234</span>
            <input
              {...register('phone')}
              className="h-12 flex-1 border-0 bg-transparent px-3 text-sm text-gray-800 outline-none"
              placeholder="801 234 5678"
            />
          </div>
          <FieldError message={errors.phone?.message} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FieldLabel label="Email" required />
          <input {...register('email')} type="email" className={inputClassName} placeholder="info@school.edu.ng" />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <FieldLabel label="WhatsApp" />
          <input {...register('whatsapp')} className={inputClassName} placeholder="+234 801 234 5678" />
        </div>
      </div>

      <div>
        <FieldLabel label="Google Maps URL" />
        <input
          {...register('googleMapsUrl')}
          className={inputClassName}
          placeholder="https://maps.google.com/..."
        />
        <FieldError message={errors.googleMapsUrl?.message} />
      </div>
    </SectionShell>
  )
}
