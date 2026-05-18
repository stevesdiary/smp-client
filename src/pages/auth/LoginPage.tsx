import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LockKeyhole, School, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

const schoolCodeSchema = z.object({
  schoolCode: z.string().min(1, 'School portal code is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()

  const savedCode = searchParams.get('schoolCode') ?? localStorage.getItem('tenantId') ?? ''
  const [schoolCode, setSchoolCode] = useState(savedCode)
  const [showCodeInput, setShowCodeInput] = useState(!savedCode)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    if (!schoolCode) {
      setShowCodeInput(true)
      return
    }
    try {
      localStorage.setItem('tenantId', schoolCode.trim().toLowerCase())
      const res = await api.post('/auth/login', { email: data.email, password: data.password })
      login(res.data.token, res.data.user, res.data.refreshToken)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Login failed'))
    }
  }

  function handleSetSchoolCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const code = (fd.get('schoolCode') as string)?.trim().toLowerCase()
    const result = schoolCodeSchema.safeParse({ schoolCode: code })
    if (result.success) {
      setSchoolCode(code)
      localStorage.setItem('tenantId', code)
      setShowCodeInput(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Portal access"
      title="Sign in to your school portal"
      description="Use your school code and staff credentials to enter the live school workspace."
      sideTitle="One secure login for the full school operating layer."
      sideDescription="The richer interface now sits on top of the existing live client, so signing in takes you directly into the real routed application."
      icon={<School className="h-7 w-7" />}
      highlights={[
        'Role-aware navigation and dashboards after login.',
        'Works with the current tenant and auth flow already in smp-client.',
        'Built for admins, teachers, staff, parents, and students.',
      ]}
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          Setting up a new school?{' '}
          <Link to="/setup-school" className="font-medium text-primary hover:underline">Create your school portal</Link>
        </p>
      )}
    >
      {/* School code chip or input */}
      {showCodeInput ? (
        <form onSubmit={handleSetSchoolCode} className="mb-5 space-y-2">
          <Label className="text-sm font-medium">School Portal Code</Label>
          <div className="flex gap-2">
            <Input
              name="schoolCode"
              className="h-11 flex-1 rounded-2xl bg-background/85"
              placeholder="e.g. greenwood"
              defaultValue={schoolCode}
              autoFocus
            />
            <Button type="submit" size="sm" className="h-11 px-4">Set</Button>
          </div>
        </form>
      ) : (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <School className="h-4 w-4 text-primary" />
          <span className="flex-1 text-sm font-medium">{schoolCode}</span>
          <button
            type="button"
            onClick={() => setShowCodeInput(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input className="h-10 rounded-xl bg-background/85" type="email" placeholder="admin@yourschool.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Password</Label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput className="h-10 rounded-xl bg-background/85" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl text-base" disabled={isSubmitting || !schoolCode}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockKeyhole className="h-4 w-4 text-primary" />
            Protected school access
          </div>
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create staff account
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Student?{' '}
          <Link to="/student-login" className="font-medium text-primary hover:underline">
            Sign in with Student ID
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
