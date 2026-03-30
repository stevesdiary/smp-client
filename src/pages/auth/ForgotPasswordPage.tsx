import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/auth/AuthShell'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    await Promise.resolve(values.email)
    toast.success('If this email exists, a reset instruction has been sent.')
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset your password"
      description="Enter the email attached to your school account and we will send reset instructions if it exists."
      sideTitle="Recover access without reopening school setup."
      sideDescription="Password recovery stays lightweight but now fits the same visual system as the rest of the auth flow."
      icon={<Mail className="h-7 w-7" />}
      highlights={[
        'Uses the existing email-based recovery placeholder flow.',
        'Keeps the school workspace and setup paths separate.',
        'Designed to feel consistent with the richer portal experience.',
      ]}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input className="h-12 rounded-2xl bg-background/85" type="email" placeholder="you@school.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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

        <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Send Reset Link'}
        </Button>
      </form>
    </AuthShell>
  )
}
