import { useEffect, useMemo, useState } from 'react'
import { PencilLine, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { NewsPost, SchoolWebsiteConfig } from '@/types/school-website'
import {
  FieldError,
  FieldLabel,
  SectionShell,
  Toggle,
  inputClassName,
  primaryButtonClassName,
  textareaClassName,
  subtleButtonClassName,
  slugify,
} from './shared'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().min(1, 'Excerpt is required').max(200, 'Excerpt must be 200 characters or fewer'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().min(1, 'Author is required'),
  coverImageUrl: z.union([z.literal(''), z.string().url('Enter a valid URL')]),
  isPublished: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface NewsSectionProps {
  config: SchoolWebsiteConfig
  onChange: (data: NewsPost[]) => void
}

const emptyValues: FormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  author: '',
  coverImageUrl: '',
  isPublished: false,
}

export function NewsSection({ config, onChange }: NewsSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPublishedAt, setEditingPublishedAt] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    control,
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
    mode: 'onChange',
  })

  const titleValue = watch('title')
  const excerptValue = watch('excerpt')

  useEffect(() => {
    if (!slugEdited) {
      setValue('slug', slugify(titleValue), { shouldValidate: true })
    }
  }, [setValue, slugEdited, titleValue])

  const beginCreate = () => {
    setIsFormOpen(true)
    setEditingId(null)
    setEditingPublishedAt(null)
    setSlugEdited(false)
    reset(emptyValues)
  }

  const beginEdit = (post: NewsPost) => {
    setIsFormOpen(true)
    setEditingId(post.id)
    setEditingPublishedAt(post.publishedAt)
    setSlugEdited(post.slug !== slugify(post.title))
    reset({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      coverImageUrl: post.coverImageUrl ?? '',
      isPublished: post.isPublished,
    })
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setEditingPublishedAt(null)
    setSlugEdited(false)
    reset(emptyValues)
  }

  const removePost = (id: string) => {
    onChange(config.news.filter((post) => post.id !== id))
  }

  const onSubmit = handleSubmit((values) => {
    const nextPost: NewsPost = {
      id: editingId ?? crypto.randomUUID(),
      title: values.title,
      slug: values.slug,
      excerpt: values.excerpt,
      content: values.content,
      author: values.author,
      coverImageUrl: values.coverImageUrl || undefined,
      publishedAt: editingPublishedAt ?? new Date().toISOString(),
      isPublished: values.isPublished,
    }

    if (editingId) {
      onChange(config.news.map((post) => (post.id === editingId ? nextPost : post)))
    } else {
      onChange([nextPost, ...config.news])
    }

    closeForm()
  })

  return (
    <SectionShell
      title="News"
      description="Manage the public news feed and create draft or published posts."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Posts</h3>
          <p className="mt-1 text-sm text-gray-500">{config.news.length} posts configured</p>
        </div>
        <button type="button" onClick={beginCreate} className={primaryButtonClassName}>
          <Plus className="mr-2 h-4 w-4" />
          Add Post
        </button>
      </div>

      <div className="space-y-4">
        {config.news.map((post) => (
          <article key={post.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">{post.title}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      post.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {new Intl.DateTimeFormat('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(post.publishedAt))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => beginEdit(post)} className={subtleButtonClassName}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removePost(post.id)}
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
                {editingId ? 'Edit News Post' : 'Add News Post'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Drafts stay visible only in the editor until published.</p>
            </div>
            <button type="button" onClick={closeForm} className={subtleButtonClassName}>
              Cancel
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <FieldLabel label="Title" required />
              <input {...register('title')} className={inputClassName} placeholder="Admissions open for 2026/2027" />
              <FieldError message={errors.title?.message} />
            </div>
            <div>
              <FieldLabel label="Slug" required />
              <input
                {...register('slug')}
                className={inputClassName}
                placeholder="admissions-open-2026-2027"
                onChange={(event) => {
                  setSlugEdited(true)
                  setValue('slug', event.target.value, { shouldDirty: true, shouldValidate: true })
                }}
              />
              <FieldError message={errors.slug?.message} />
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel label="Excerpt" hint={`${excerptValue.length}/200`} required />
            <textarea {...register('excerpt')} className={textareaClassName} />
            <FieldError message={errors.excerpt?.message} />
          </div>

          <div className="mt-6">
            <FieldLabel label="Content" required />
            <textarea {...register('content')} className={`${textareaClassName} min-h-[220px]`} />
            <FieldError message={errors.content?.message} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <FieldLabel label="Author" required />
              <input {...register('author')} className={inputClassName} placeholder="Admissions Office" />
              <FieldError message={errors.author?.message} />
            </div>
            <div>
              <FieldLabel label="Cover Image URL" />
              <input
                {...register('coverImageUrl')}
                className={inputClassName}
                placeholder="https://example.com/cover.jpg"
              />
              <FieldError message={errors.coverImageUrl?.message} />
            </div>
          </div>

          <div className="mt-6">
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <Toggle
                  checked={field.value}
                  onChange={field.onChange}
                  label="Published"
                  description="Published posts appear on the public news page. Drafts stay hidden."
                />
              )}
            />
          </div>

          <div className="mt-6">
            <button type="submit" disabled={isSubmitting} className={primaryButtonClassName}>
              {editingId ? 'Save Post' : 'Save and Add Post'}
            </button>
          </div>
        </form>
      ) : null}
    </SectionShell>
  )
}
