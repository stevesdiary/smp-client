import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'
import api from '@/lib/api'

const emailSchema = z.object({
  schoolCode: z.string().min(1, 'School portal code is required'),
  email: z.string().email('Enter a valid email'),
})

const resetSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[0-9]/, 'Needs a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  const initialSchoolCode = localStorage.getItem('tenantId') ?? ''
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { schoolCode: initialSchoolCode } })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const onRequestOtp = async (values: EmailForm) => {
    try {
      localStorage.setItem('tenantId', values.schoolCode.trim().toLowerCase())
      await api.post('/auth/forgot-password', { email: values.email })
      setEmail(values.email)
      setStep('reset')
      toast.success('If this email exists, a reset code has been sent.')
    } catch {
      toast.success('If this email exists, a reset code has been sent.')
      setEmail(values.email)
      setStep('reset')
    }
  }

  const onReset = async (values: ResetForm) => {
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      })
      toast.success('Password reset successfully. Please log in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed')
    }
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title={step === 'email' ? 'Reset your password' : 'Enter reset code'}
      description={
        step === 'email'
          ? 'Enter the email attached to your school account and we will send a 6-digit reset code.'
          : `A 6-digit code was sent to ${email}. Enter it below with your new password.`
      }
      sideTitle="Recover access without reopening school setup."
      sideDescription="Password recovery uses a one-time code that expires in 10 minutes."
      icon={step === 'email' ? <Mail className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
      highlights={[
        'One-time code expires in 10 minutes.',
        'Maximum 5 verification attempts per code.',
        'All active sessions are revoked on reset.',
      ]}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      }
    >
      {step === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">School Code</Label>
            <Input className="h-12 rounded-2xl bg-background/85" placeholder="e.g. greenwood" {...emailForm.register('schoolCode')} />
            {emailForm.formState.errors.schoolCode && <p className="text-xs text-destructive">{emailForm.formState.errors.schoolCode.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input className="h-12 rounded-2xl bg-background/85" type="email" placeholder="you@school.com" {...emailForm.register('email')} />
            {emailForm.formState.errors.email && <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>}
          </div>

          <div className="rounded-2xl bg-secondary/55 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Private account recovery</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The form does not confirm whether an email exists, which keeps account recovery discreet.
                </p>
              </div>
            </div>
          </div>

          <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={emailForm.formState.isSubmitting}>
            {emailForm.formState.isSubmitting ? 'Sending...' : 'Send Reset Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">6-digit code</Label>
            <Input
              className="h-12 rounded-2xl bg-background/85 text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              placeholder="000000"
              {...resetForm.register('otp')}
            />
            {resetForm.formState.errors.otp && <p className="text-xs text-destructive">{resetForm.formState.errors.otp.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">New password</Label>
            <PasswordInput className="h-12 rounded-2xl bg-background/85" placeholder="Min 8 chars, upper + lower + number" {...resetForm.register('newPassword')} />
            {resetForm.formState.errors.newPassword && <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirm password</Label>
            <PasswordInput className="h-12 rounded-2xl bg-background/85" {...resetForm.register('confirmPassword')} />
            {resetForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={resetForm.formState.isSubmitting}>
            {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>

          <button type="button" onClick={() => setStep('email')} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
            Use a different email
          </button>
        </form>
      )}
    </AuthShell>
  )
}
