import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Building2, School, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'

const schema = z.object({
  schoolName: z.string().min(2, 'School name is required'),
  schoolCode: z
    .string()
    .min(3, 'School portal code is required')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only'),
  adminName: z.string().min(2, 'Administrator name is required'),
  adminEmail: z.string().email('Invalid email'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  schoolType: z.enum(['PRIMARY', 'SECONDARY', 'PRIMARY_SECONDARY']),
  studentTier: z.enum(['STARTER', 'GROWING', 'STANDARD', 'LARGE', 'MEGA']),
})

type FormData = z.infer<typeof schema>

export default function SchoolSetupPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      schoolType: 'PRIMARY_SECONDARY',
      studentTier: 'STARTER',
    },
  })

  const onSubmit = async (values: FormData) => {
    try {
      const payload = {
        ...values,
        schoolCode: values.schoolCode.trim().toLowerCase(),
      }
      const res = await api.post('/onboarding/school', payload)
      login(res.data.token, res.data.user)
      toast.success(`Your school portal is live for ${res.data.tenant.name}.`)
      navigate('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to set up your school'))
    }
  }

  return (
    <AuthShell
      eyebrow="School launch"
      title="Set up your school"
      description="Create the school portal, administrator account, and the initial tenant workspace in one flow."
      sideTitle="Launch a complete school portal with one onboarding pass."
      sideDescription="This setup flow stays connected to the existing onboarding endpoint while presenting a stronger first-run experience."
      icon={<Building2 className="h-7 w-7" />}
      highlights={[
        'Create the tenant, portal code, and first administrator in one submission.',
        'Choose the school type and student tier before entering the live dashboard.',
        'Staff can use the generated school code immediately after setup.',
      ]}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          Already have a school portal?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">School Name</Label>
          <Input className="h-12 rounded-2xl bg-background/85" placeholder="Bright Future Academy" {...register('schoolName')} />
          {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">School Portal Code</Label>
          <Input className="h-12 rounded-2xl bg-background/85" placeholder="bright-future-academy" {...register('schoolCode')} />
          {errors.schoolCode && <p className="text-xs text-destructive">{errors.schoolCode.message}</p>}
          <p className="text-xs text-muted-foreground">This is the code your staff will use when signing in.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Administrator Name</Label>
            <Input className="h-12 rounded-2xl bg-background/85" placeholder="Amina Yusuf" {...register('adminName')} />
            {errors.adminName && <p className="text-xs text-destructive">{errors.adminName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Administrator Email</Label>
            <Input className="h-12 rounded-2xl bg-background/85" type="email" placeholder="admin@school.com" {...register('adminEmail')} />
            {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Password</Label>
          <Input className="h-12 rounded-2xl bg-background/85" type="password" placeholder="At least 8 characters" {...register('adminPassword')} />
          {errors.adminPassword && <p className="text-xs text-destructive">{errors.adminPassword.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">School Type</Label>
            <select
              {...register('schoolType')}
              className="flex h-12 w-full rounded-2xl border border-input bg-background/85 px-3 py-2 text-sm"
            >
              <option value="PRIMARY">Primary School</option>
              <option value="SECONDARY">Secondary School</option>
              <option value="PRIMARY_SECONDARY">Primary and Secondary</option>
            </select>
            {errors.schoolType && <p className="text-xs text-destructive">{errors.schoolType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Student Tier</Label>
            <select
              {...register('studentTier')}
              className="flex h-12 w-full rounded-2xl border border-input bg-background/85 px-3 py-2 text-sm"
            >
              <option value="STARTER">Up to 50 students</option>
              <option value="GROWING">Up to 100 students</option>
              <option value="STANDARD">Up to 200 students</option>
              <option value="LARGE">Up to 500 students</option>
              <option value="MEGA">Up to 1,000 students</option>
            </select>
            {errors.studentTier && <p className="text-xs text-destructive">{errors.studentTier.message}</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-secondary/55 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Portal provisioning</p>
              <p className="mt-1 text-sm text-muted-foreground">
                School onboarding provisions the tenant, logs you in, and drops you into the live dashboard.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting}>
          {isSubmitting ? 'Creating School Portal...' : 'Create School Portal'}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Setup still uses the current onboarding API path in `smp-client`.
        </div>
      </form>
    </AuthShell>
  )
}
