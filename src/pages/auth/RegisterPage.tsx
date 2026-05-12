import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ShieldCheck, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { passwordComplexityHint, passwordSchema } from '@/lib/passwordPolicy'
import { getApiErrorMessage } from '@/lib/utils'
import api from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'

const schema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: passwordSchema,
  roleId: z.string().min(1, 'Role ID is required'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    try {
      localStorage.setItem('tenantId', values.tenantId)
      await api.post('/auth/register', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        roleId: values.roleId,
      })
      toast.success('Account created. Sign in to continue.')
      navigate('/login')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to register account'))
    }
  }

  return (
    <AuthShell
      eyebrow="Team onboarding"
      title="Create a staff account"
      description="Join an existing school portal with the invitation details provided by your administrator."
      sideTitle="Bring staff into the platform without exposing admin setup."
      sideDescription="This flow keeps onboarding inside an existing tenant while preserving the live API-backed registration path."
      icon={<UserPlus className="h-7 w-7" />}
      highlights={[
        'Use the school portal code already assigned to your institution.',
        'Paste the invitation or role ID from the admin who provisioned access.',
        'After registration, sign in to enter the richer live workspace.',
      ]}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          Already have school access?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">School Portal Code</Label>
          <Input className="h-12 rounded-2xl bg-background/85" placeholder="greenwood-college" {...register('tenantId')} />
          {errors.tenantId && <p className="text-xs text-destructive">{errors.tenantId.message}</p>}
          <p className="text-xs text-muted-foreground">Use the school code or portal ID your administrator shared with you.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">First Name</Label>
            <Input className="h-12 rounded-2xl bg-background/85" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Name</Label>
            <Input className="h-12 rounded-2xl bg-background/85" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Email</Label>
          <Input className="h-12 rounded-2xl bg-background/85" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Password</Label>
          <PasswordInput className="h-12 rounded-2xl bg-background/85" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          <p className="text-xs text-muted-foreground">{passwordComplexityHint}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Invitation / Role ID</Label>
          <Input className="h-12 rounded-2xl bg-background/85" placeholder="Paste the role ID from your school admin" {...register('roleId')} />
          {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
        </div>

        <div className="rounded-2xl bg-secondary/55 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Portal membership</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registration adds your account to the existing school tenant rather than creating a new one.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Staff Account'}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Registration is still handled by the current `smp-client` auth API.
        </div>
      </form>
    </AuthShell>
  )
}
