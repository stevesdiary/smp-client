import { useState } from 'react'
import { PencilLine, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SchoolWebsiteConfig, Testimonial } from '@/types/school-website'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  Toggle,
  inputClassName,
  primaryButtonClassName,
  textareaClassName,
  subtleButtonClassName,
} from './shared'

const schema = z.object({
  quote: z.string().min(1, 'Quote is required'),
  author: z.string().min(1, 'Author name is required'),
  role: z.string().min(1, 'Role is required'),
  avatarUrl: z.union([z.literal(''), z.string().url('Enter a valid URL')]),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface TestimonialsSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: Testimonial[]) => void
}

const emptyValues: FormValues = {
  quote: '',
  author: '',
  role: '',
  avatarUrl: '',
  isActive: true,
}

export function TestimonialsSection({ config, onChange }: TestimonialsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const beginCreate = () => {
    setIsFormOpen(true)
    setEditingId(null)
    reset(emptyValues)
  }

  const beginEdit = (testimonial: Testimonial) => {
    setIsFormOpen(true)
    setEditingId(testimonial.id)
    reset({
      quote: testimonial.quote,
      author: testimonial.author,
      role: testimonial.role,
      avatarUrl: testimonial.avatarUrl ?? '',
      isActive: testimonial.isActive,
    })
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    reset(emptyValues)
  }

  const removeTestimonial = (id: string) => {
    onChange(config.testimonials.filter((testimonial) => testimonial.id !== id))
  }

  const onSubmit = handleSubmit((values) => {
    const nextTestimonial: Testimonial = {
      id: editingId ?? crypto.randomUUID(),
      quote: values.quote,
      author: values.author,
      role: values.role,
      avatarUrl: values.avatarUrl || undefined,
      isActive: values.isActive,
    }

    if (editingId) {
      onChange(
        config.testimonials.map((testimonial) =>
          testimonial.id === editingId ? nextTestimonial : testimonial,
        ),
      )
    } else {
      onChange([...config.testimonials, nextTestimonial])
    }

    closeForm()
  })

  return (
    <SectionShell
      title="Testimonials"
      description="Showcase social proof from parents, alumni, and guardians on the public website."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Testimonials</h3>
          <p className="mt-1 text-sm text-gray-500">{config.testimonials.length} testimonials configured</p>
        </div>
        <button type="button" onClick={beginCreate} className={primaryButtonClassName}>
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </button>
      </div>

      <div className="space-y-4">
        {config.testimonials.map((testimonial) => (
          <article key={testimonial.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">{testimonial.author}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      testimonial.isActive ? 'bg-success-light text-emerald-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {testimonial.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{testimonial.role}</p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">{testimonial.quote}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => beginEdit(testimonial)} className={subtleButtonClassName}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeTestimonial(testimonial.id)}
                  className="inline-flex items-center rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {isFormOpen ? (
        <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
            </div>
            <button type="button" onClick={closeForm} className={subtleButtonClassName}>
              Cancel
            </button>
          </div>

          <div>
            <FieldLabel label="Quote" required />
            <textarea {...register('quote')} className={textareaClassName} />
            <FieldError message={errors.quote?.message} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <FieldLabel label="Author Name" required />
              <input {...register('author')} className={inputClassName} placeholder="Mrs. Adeyemi" />
              <FieldError message={errors.author?.message} />
            </div>
            <div>
              <FieldLabel label="Role" required />
              <input {...register('role')} className={inputClassName} placeholder="Parent, JSS 2" />
              <FieldError message={errors.role?.message} />
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel label="Avatar URL" />
            <input
              {...register('avatarUrl')}
              className={inputClassName}
              placeholder="https://example.com/avatar.jpg"
            />
            <FieldError message={errors.avatarUrl?.message} />
          </div>

          <div className="mt-6">
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Toggle
                  checked={field.value}
                  onChange={field.onChange}
                  label="Active testimonial"
                  description="Inactive testimonials stay saved but hidden from the public site."
                />
              )}
            />
          </div>

          <div className="mt-6">
            <button type="submit" disabled={isSubmitting} className={primaryButtonClassName}>
              {editingId ? 'Save Testimonial' : 'Save and Add Testimonial'}
            </button>
          </div>
        </form>
      ) : null}
    </SectionShell>
  )
}
