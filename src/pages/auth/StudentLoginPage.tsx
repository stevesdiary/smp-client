import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { AuthShell } from '@/components/auth/AuthShell'

const schema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  password: z.string().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

export default function StudentLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: '', password: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      // Extract school code from student ID prefix for tenant resolution
      const code = data.studentId.replace(/[0-9]/g, '').toLowerCase()
      if (code) localStorage.setItem('tenantId', code)

      const res = await api.post('/auth/student-login', {
        studentId: data.studentId.toUpperCase(),
        password: data.password,
      })
      login(res.data.token, res.data.user, res.data.refreshToken)

      if (res.data.mustChangePassword) {
        toast.info('Please change your default password')
        navigate('/settings')
      } else {
        toast.success('Welcome back!')
        navigate('/dashboard')
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Login failed'))
    }
  }

  return (
    <AuthShell
      eyebrow="Student access"
      title="Sign in with your Student ID"
      description="Enter the student ID and password provided by your school."
      sideTitle="Your learning portal awaits."
      sideDescription="View your timetable, grades, attendance, and course materials all in one place."
      icon={<GraduationCap className="h-7 w-7" />}
      highlights={[
        'View your timetable, grades, and attendance.',
        'Access e-learning courses and quizzes.',
        'Track your academic progress.',
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Student ID</Label>
          <Input
            className="h-12 rounded-2xl bg-background/85 uppercase"
            placeholder="e.g. GWD250042"
            {...register('studentId')}
          />
          {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Password</Label>
          <PasswordInput className="h-12 rounded-2xl bg-background/85" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="h-12 w-full rounded-2xl" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Staff member?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Staff login
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
