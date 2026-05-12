import type { ReactNode } from 'react'

export type UploadTarget = {
  domain: 'branding' | 'gallery'
  entityId: string
}

export type UploadFileFn = (file: File, target: UploadTarget) => Promise<string>

export const panelClassName = 'rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'
export const inputClassName =
  'mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
export const textareaClassName = `${inputClassName} min-h-[120px] resize-y`
export const selectClassName = inputClassName
export const subtleButtonClassName =
  'inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50'
export const primaryButtonClassName =
  'inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300'
export const destructiveButtonClassName =
  'inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100'

export function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className={panelClassName}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

export function FieldLabel({
  label,
  hint,
  required = false,
}: {
  label: string
  hint?: string
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
    </div>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="mt-2 text-sm text-red-600">{message}</p>
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  large = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
  large?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between rounded-3xl border px-5 py-4 text-left transition ${
        checked
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      } ${large ? 'min-h-[88px]' : ''}`}
    >
      <div>
        <div className={`font-medium text-gray-900 ${large ? 'text-base' : 'text-sm'}`}>{label}</div>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      <div
        className={`relative rounded-full transition ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${large ? 'h-8 w-14' : 'h-7 w-12'}`}
      >
        <span
          className={`absolute top-1 rounded-full bg-white shadow transition ${
            checked ? (large ? 'left-7 h-6 w-6' : 'left-6 h-5 w-5') : large ? 'left-1 h-6 w-6' : 'left-1 h-5 w-5'
          }`}
        />
      </div>
    </button>
  )
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const
