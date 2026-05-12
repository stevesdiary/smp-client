import { useCallback, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  inputClassName,
  primaryButtonClassName,
  subtleButtonClassName,
  type UploadFileFn,
} from './shared'

const schema = z.object({
  schoolName: z.string().min(1, 'School name is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface IdentitySectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: Pick<SchoolWebsiteConfig, 'schoolName' | 'tagline' | 'logoUrl' | 'faviconUrl'>) => void
  uploadFile: UploadFileFn
}

export function IdentitySection({ config, onChange, uploadFile }: IdentitySectionProps) {
  const [uploadingField, setUploadingField] = useState<'logoUrl' | 'faviconUrl' | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const formValue = useMemo<FormValues>(
    () => ({
      schoolName: config.schoolName,
      tagline: config.tagline,
      logoUrl: config.logoUrl,
      faviconUrl: config.faviconUrl,
    }),
    [config.faviconUrl, config.logoUrl, config.schoolName, config.tagline],
  )

  const {
    control,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formValue,
    mode: 'onChange',
  })

  const toPayload = useCallback(
    (value: FormValues) => ({
      schoolName: value.schoolName,
      tagline: value.tagline,
      logoUrl: value.logoUrl || undefined,
      faviconUrl: value.faviconUrl || undefined,
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

  const handleAssetUpload = async (fieldName: 'logoUrl' | 'faviconUrl', file?: File) => {
    if (!file) {
      return
    }

    setUploadError(null)
    setUploadingField(fieldName)

    try {
      const url = await uploadFile(file, { domain: 'branding', entityId: 'shared' })
      setValue(fieldName, url, { shouldDirty: true, shouldValidate: true })
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setUploadingField(null)
    }
  }

  return (
    <SectionShell
      title="Identity"
      description="Update the school name, tagline, logo, and favicon used across the public website."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <FieldLabel label="School Name" required />
          <input {...register('schoolName')} className={inputClassName} placeholder="Victory Heights Academy" />
          <FieldError message={errors.schoolName?.message} />
        </div>
        <div>
          <FieldLabel label="Tagline" required />
          <input {...register('tagline')} className={inputClassName} placeholder="Shaping tomorrow's leaders today" />
          <FieldError message={errors.tagline?.message} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Controller
          control={control}
          name="logoUrl"
          render={({ field }) => (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <FieldLabel label="Logo" />
                  <p className="mt-2 text-sm text-gray-500">Upload a PNG, SVG, or JPG logo for the public site.</p>
                </div>
                {field.value ? (
                  <button
                    type="button"
                    onClick={() => setValue('logoUrl', undefined, { shouldDirty: true, shouldValidate: true })}
                    className={subtleButtonClassName}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white">
                  {field.value ? (
                    <img src={field.value} alt="School logo" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <label className={primaryButtonClassName}>
                  {uploadingField === 'logoUrl' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Logo'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleAssetUpload('logoUrl', event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          )}
        />

        <Controller
          control={control}
          name="faviconUrl"
          render={({ field }) => (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <FieldLabel label="Favicon" />
                  <p className="mt-2 text-sm text-gray-500">Used in browser tabs and search results.</p>
                </div>
                {field.value ? (
                  <button
                    type="button"
                    onClick={() =>
                      setValue('faviconUrl', undefined, { shouldDirty: true, shouldValidate: true })
                    }
                    className={subtleButtonClassName}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white">
                  {field.value ? (
                    <img src={field.value} alt="School favicon" className="h-full w-full object-contain" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <label className={primaryButtonClassName}>
                  {uploadingField === 'faviconUrl' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Favicon'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleAssetUpload('faviconUrl', event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          )}
        />
      </div>

      {uploadError ? <FieldError message={uploadError} /> : null}
    </SectionShell>
  )
}
