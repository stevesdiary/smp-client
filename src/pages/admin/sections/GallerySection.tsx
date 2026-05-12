import { useCallback, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { GalleryImage, SchoolWebsiteConfig } from '@/types/school-website'
import { useSyncedFormSection } from './formSync'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  inputClassName,
  primaryButtonClassName,
  selectClassName,
  type UploadFileFn,
} from './shared'

const galleryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  caption: z.string().optional(),
  category: z.enum(['academics', 'sports', 'events', 'facilities', 'graduation']),
})

const schema = z.object({
  gallery: z.array(galleryItemSchema).max(50, 'A maximum of 50 gallery images is allowed'),
})

type FormValues = z.infer<typeof schema>

interface GallerySectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: GalleryImage[]) => void
  uploadFile: UploadFileFn
}

const categoryOptions = ['academics', 'sports', 'events', 'facilities', 'graduation'] as const

export function GallerySection({ config, onChange, uploadFile }: GallerySectionProps) {
  const [uploadingCount, setUploadingCount] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const formValue = useMemo<FormValues>(() => ({ gallery: config.gallery }), [config.gallery])

  const {
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: formValue,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'gallery',
  })

  const toPayload = useCallback((value: FormValues) => value.gallery, [])

  useSyncedFormSection({
    formValue,
    watch,
    reset,
    toPayload,
    onChange,
  })

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList) {
      return
    }

    const currentCount = fields.length
    const allowed = 50 - currentCount

    if (allowed <= 0) {
      setUploadError('Gallery image limit reached.')
      return
    }

    const files = Array.from(fileList).slice(0, allowed)
    if (files.length !== fileList.length) {
      setUploadError('Only the first 50 gallery images can be kept.')
    } else {
      setUploadError(null)
    }

    setUploadingCount(files.length)

    const results = await Promise.allSettled(
      files.map((file) => uploadFile(file, { domain: 'gallery', entityId: 'shared' })),
    )
    const successfulUploads = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map((result) => result.value)

    successfulUploads.forEach((url) => {
      append({
        id: crypto.randomUUID(),
        url,
        caption: '',
        category: 'academics',
      })
    })

    if (successfulUploads.length !== files.length) {
      setUploadError('Some images failed to upload. Try again for the missing files.')
    }

    setUploadingCount(0)
  }

  return (
    <SectionShell
      title="Gallery"
      description="Upload and organize public gallery images by category. Maximum 50 images."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Images</h3>
          <p className="mt-1 text-sm text-gray-500">{fields.length}/50 images uploaded</p>
        </div>
        <label className={primaryButtonClassName}>
          <ImagePlus className="mr-2 h-4 w-4" />
          Upload Images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </label>
      </div>

      {uploadError ? <FieldError message={uploadError} /> : null}
      <FieldError message={errors.gallery?.message} />

      <div className="grid gap-4 xl:grid-cols-3">
        {fields.map((field, index) => (
          <div key={field.id} className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-50">
            <div className="aspect-[4/3] bg-gray-100">
              <img src={field.url} alt={field.caption || 'Gallery image'} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-4 p-4">
              <Controller
                control={control}
                name={`gallery.${index}.category`}
                render={({ field: categoryField }) => (
                  <div>
                    <FieldLabel label="Category" />
                    <select
                      className={selectClassName}
                      value={categoryField.value}
                      onChange={categoryField.onChange}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`gallery.${index}.caption`}
                render={({ field: captionField }) => (
                  <div>
                    <FieldLabel label="Caption" />
                    <input
                      className={inputClassName}
                      value={captionField.value || ''}
                      onChange={captionField.onChange}
                      placeholder="Science lab tour"
                    />
                  </div>
                )}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="inline-flex items-center rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: uploadingCount }).map((_, index) => (
          <div key={`uploading-${index}`} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="flex aspect-[4/3] items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
            <div className="space-y-3 p-4">
              <div className="h-10 rounded-2xl bg-gray-100" />
              <div className="h-10 rounded-2xl bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
