import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2, CreditCard, Crown, Shield, Users, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModuleHero } from '@/components/shared/ModuleHero'
import { formatDate } from '@/lib/utils'
import api from '@/lib/api'

type Subscription = {
  id: string
  tenantId: string
  studentCount: number
  billingCycle: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  amount: number
  trialEndsAt?: string
  activatedAt?: string
  expiresAt?: string
  createdAt: string
}

type PricingTier = {
  studentCount: number
  ratePerStudent: number
  termAmount: number
  sessionAmount: number
}

const statusConfig = {
  TRIAL: { label: 'Free Trial', variant: 'warning' as const, icon: Zap, color: 'text-amber-600' },
  ACTIVE: { label: 'Active', variant: 'success' as const, icon: CheckCircle2, color: 'text-green-600' },
  EXPIRED: { label: 'Expired', variant: 'destructive' as const, icon: Shield, color: 'text-red-600' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' as const, icon: Shield, color: 'text-muted-foreground' },
}

const paySchema = z.object({
  studentCount: z.coerce.number().int().min(1).max(100000),
  billingCycle: z.enum(['per_term', 'per_session']),
  email: z.string().email(),
})
type PayForm = z.infer<typeof paySchema>

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount)
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function BillingPage() {
  const [payOpen, setPayOpen] = useState(false)
  const qc = useQueryClient()

  const { data: subData } = useQuery<{ subscription: Subscription | null }>({
    queryKey: ['billing', 'subscription'],
    queryFn: () => api.get('/billing/subscription').then(r => r.data),
  })

  const { data: pricingData } = useQuery<{ pricing: PricingTier[] }>({
    queryKey: ['billing', 'pricing'],
    queryFn: () => api.get('/billing/pricing').then(r => r.data),
  })

  const subscription = subData?.subscription
  const pricing = pricingData?.pricing ?? []
  const status = subscription?.status ?? 'TRIAL'
  const cfg = statusConfig[status]

  const form = useForm<PayForm>({
    resolver: zodResolver(paySchema) as any,
    defaultValues: {
      studentCount: subscription?.studentCount ?? 200,
      billingCycle: (subscription?.billingCycle as 'per_term' | 'per_session') ?? 'per_term',
      email: '',
    },
  })

  const initMutation = useMutation({
    mutationFn: (data: PayForm) => api.post('/billing/initialize', data),
    onSuccess: (res) => {
      const { authorizationUrl } = res.data
      if (authorizationUrl) {
        window.open(authorizationUrl, '_blank')
        toast.success('Redirecting to Paystack...')
        setPayOpen(false)
      } else {
        toast.error('No payment URL returned')
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Payment initialization failed'),
  })

  const verifyMutation = useMutation({
    mutationFn: (reference: string) => api.post('/billing/verify', { reference }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing', 'subscription'] })
      toast.success('Payment verified — subscription activated!')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed'),
  })

  const trialDays = daysUntil(subscription?.trialEndsAt)
  const expiryDays = daysUntil(subscription?.expiresAt)

  return (
    <div className="space-y-8">
      <ModuleHero
        eyebrow="Billing"
        title="Manage your school's subscription and payment."
        description="View your current plan, upgrade student capacity, and manage billing cycles through Paystack."
        stats={[
          { label: 'Plan status', value: cfg.label, detail: status === 'TRIAL' && trialDays !== null ? `${trialDays} days remaining in trial` : status === 'ACTIVE' && expiryDays !== null ? `Renews in ${expiryDays} days` : 'No active subscription' },
          { label: 'Student capacity', value: subscription?.studentCount ?? 0, detail: 'Maximum students on current plan.' },
          { label: 'Amount', value: subscription ? formatNaira(subscription.amount) : '—', detail: subscription?.billingCycle === 'per_session' ? 'Per session (15% discount)' : 'Per term' },
        ]}
      />

      {/* Current subscription card */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge variant={cfg.variant} className="text-sm px-3 py-1">
                <cfg.icon className="mr-1.5 h-3.5 w-3.5" />{cfg.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Students</p>
                    <p className="mt-1 text-2xl font-semibold">{subscription.studentCount}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Billing</p>
                    <p className="mt-1 text-2xl font-semibold">{subscription.billingCycle === 'per_session' ? 'Session' : 'Term'}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="mt-1 text-2xl font-semibold">{formatNaira(subscription.amount)}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <p className="text-xs text-muted-foreground">{status === 'TRIAL' ? 'Trial ends' : 'Expires'}</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {status === 'TRIAL' && trialDays !== null ? `${trialDays}d` : expiryDays !== null ? `${expiryDays}d` : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {subscription.activatedAt && (
                    <div><span className="text-muted-foreground">Activated:</span> {formatDate(subscription.activatedAt)}</div>
                  )}
                  {subscription.expiresAt && (
                    <div><span className="text-muted-foreground">Expires:</span> {formatDate(subscription.expiresAt)}</div>
                  )}
                  {subscription.trialEndsAt && status === 'TRIAL' && (
                    <div><span className="text-muted-foreground">Trial ends:</span> {formatDate(subscription.trialEndsAt)}</div>
                  )}
                  <div><span className="text-muted-foreground">Created:</span> {formatDate(subscription.createdAt)}</div>
                </div>

                <Button className="h-12 w-full rounded-2xl" onClick={() => setPayOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {status === 'TRIAL' || status === 'EXPIRED' ? 'Activate Subscription' : 'Upgrade / Renew'}
                </Button>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/50 p-8 text-center">
                <Crown className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-medium">No subscription found</p>
                <p className="mt-1 text-sm text-muted-foreground">Set up your school's billing to unlock full platform access.</p>
                <Button className="mt-4 h-11 rounded-2xl" onClick={() => setPayOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick verify card */}
        <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
          <CardHeader><CardTitle>Verify Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you've completed a Paystack payment but your subscription hasn't updated, paste the reference here.
            </p>
            <div className="flex gap-2">
              <Input
                id="verify-ref"
                className="h-11 rounded-2xl"
                placeholder="sub_84177414_1714..."
              />
              <Button
                className="h-11 rounded-2xl px-5"
                disabled={verifyMutation.isPending}
                onClick={() => {
                  const ref = (document.getElementById('verify-ref') as HTMLInputElement)?.value
                  if (ref) verifyMutation.mutate(ref)
                  else toast.error('Enter a reference')
                }}
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pricing table */}
      <Card className="rounded-[28px] border-white/60 bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-white/10 dark:bg-card/85">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <p className="text-sm text-muted-foreground">
            ₦500/student for up to 1,000 students. ₦400/student for 1,000+. Minimum ₦50,000/term. 15% discount for per-session billing.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="py-3 text-left font-medium text-muted-foreground">Students</th>
                  <th className="py-3 text-left font-medium text-muted-foreground">Rate/Student</th>
                  <th className="py-3 text-left font-medium text-muted-foreground">Per Term</th>
                  <th className="py-3 text-left font-medium text-muted-foreground">Per Session (15% off)</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((tier) => (
                  <tr key={tier.studentCount} className="border-b border-border/40">
                    <td className="py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {tier.studentCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3">{formatNaira(tier.ratePerStudent)}</td>
                    <td className="py-3 font-medium">{formatNaira(tier.termAmount)}</td>
                    <td className="py-3 font-medium text-green-700 dark:text-green-400">{formatNaira(tier.sessionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="rounded-[28px] max-w-md">
          <DialogHeader><DialogTitle>Initialize Payment</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => initMutation.mutate(d as PayForm))} className="space-y-5">
            <div className="space-y-2">
              <Label>Number of Students</Label>
              <Input className="h-11 rounded-2xl" type="number" {...form.register('studentCount')} />
              {form.formState.errors.studentCount && <p className="text-xs text-destructive">{form.formState.errors.studentCount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select defaultValue={form.getValues('billingCycle')} onValueChange={v => form.setValue('billingCycle', v as 'per_term' | 'per_session')}>
                <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_term">Per Term</SelectItem>
                  <SelectItem value="per_session">Per Session (15% discount)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Email</Label>
              <Input className="h-11 rounded-2xl" type="email" placeholder="admin@school.com" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>

            <div className="rounded-2xl bg-secondary/50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Secure payment via Paystack</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                You'll be redirected to Paystack to complete payment. Your subscription activates immediately after successful payment.
              </p>
            </div>

            <Button type="submit" className="h-12 w-full rounded-2xl" disabled={initMutation.isPending}>
              <CreditCard className="mr-2 h-4 w-4" />
              {initMutation.isPending ? 'Initializing...' : 'Pay with Paystack'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
