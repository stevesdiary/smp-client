import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, CreditCard, Landmark, Zap, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Payment, Student } from '@/types'

const FEE_CATEGORIES = ['Tuition', 'Boarding', 'Books & Levy', 'Examination', 'Uniform', 'Other']
const METHODS = [
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Landmark },
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'POS', label: 'POS', icon: CreditCard },
  { key: 'PAYSTACK', label: 'Paystack', icon: Zap },
] as const

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function RecordPaymentDialog({ trigger }: { trigger: React.ReactNode }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [category, setCategory] = useState(FEE_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  const { data: studentsRaw } = useQuery({
    queryKey: ['students', 'select-100'],
    queryFn: () => api.get('/students', { params: { limit: 100 } }).then((r) => r.data),
    enabled: open,
  })
  const students: Student[] = Array.isArray(studentsRaw) ? studentsRaw : (studentsRaw?.data ?? [])
  const selected = students.find((s) => s.id === studentId)

  // Paid-to-date for the selected student (best-effort; empty on failure)
  const { data: history = [] } = useQuery<Payment[]>({
    queryKey: ['student-payments', studentId],
    queryFn: () => api.get(`/payments/student/${studentId}`).then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: open && !!studentId,
    retry: false,
  })
  const paidToDate = useMemo(
    () => history.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + Number(p.amount || 0), 0),
    [history],
  )
  const amountNum = Number(amount) || 0
  const afterThis = paidToDate + amountNum

  function resetForm() {
    setStudentId(''); setCategory(FEE_CATEGORIES[0]); setAmount(''); setMethod('BANK_TRANSFER')
    setReference(''); setDate(todayISO()); setNotes('')
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/payments', {
        studentId,
        amount: amountNum,
        method,
        feeCategory: category,
        reference: reference || undefined,
        paymentDate: date,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['student-payments', studentId] })
      toast.success('Payment recorded')
      setOpen(false); resetForm()
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || 'Could not record payment (endpoint may be unavailable)'),
  })

  const canSubmit = !!studentId && amountNum > 0 && !mutation.isPending

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-extrabold">Record Payment</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selected ? `Recording for ${selected.firstName} ${selected.lastName}` : 'Select a student to record a payment'}
          </p>
        </DialogHeader>

        {/* Paid-to-date strip */}
        {selected && (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-outline-variant/15">
            <div className="bg-surface-container-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Paid to date</p>
              <p className="mt-1 font-mono text-lg font-black text-on-surface">{formatCurrency(paidToDate)}</p>
            </div>
            <div className="bg-primary-fixed/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-secondary-fixed/70">After this payment</p>
              <p className="mt-1 font-mono text-lg font-black text-primary-container">{formatCurrency(afterThis)}</p>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); if (canSubmit) mutation.mutate() }}
          className="space-y-4"
        >
          {/* Student */}
          <div className="space-y-1.5">
            <Label>Student</Label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}{s.studentId ? ` · ${s.studentId}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fee category */}
          <div className="space-y-1.5">
            <Label>Fee Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
            >
              {FEE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Amount to Pay</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-outline">₦</span>
              <input
                type="number" min="0" inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest pl-9 pr-4 font-mono text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
              />
            </div>
          </div>

          {/* Method grid */}
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map((m) => {
                const active = method === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                      active
                        ? 'border-primary bg-primary-fixed/30 text-primary-container'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <m.icon className="h-4 w-4" strokeWidth={1.5} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reference + date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reference No.</Label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="TXN-998…"
                className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes / Remarks</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional remarks…"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary-container/30"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Receipt className="h-4 w-4" strokeWidth={1.5} />
              {mutation.isPending ? 'Recording…' : 'Confirm & Generate Receipt'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); resetForm() }}
              className="rounded-xl border border-outline-variant/30 px-5 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
