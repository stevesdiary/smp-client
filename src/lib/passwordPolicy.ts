import { z } from 'zod'

export const passwordComplexityHint = 'Use at least 8 characters with uppercase, lowercase, number, and special character.'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (value) =>
      /[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9]/.test(value),
    'Password must include uppercase, lowercase, number, and special character'
  )
