import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCustomDomain } from '@/hooks/useCustomDomain'

const retryStoragePrefix = 'schoolos-domain-retry:'
const retryCooldownMs = 60 * 60 * 1000
const sslEscalationMs = 10 * 60 * 1000
const supportWhatsappUrl =
  'https://api.whatsapp.com/send?text=I%20need%20help%20with%20custom%20domain%20verification%20on%20SchoolOS.'

const steps = [
  { id: 1, label: 'Enter Domain' },
  { id: 2, label: 'Add CNAME Record' },
  { id: 3, label: 'Verification' },
  { id: 4, label: 'SSL & Live' },
] as const

const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i

function sanitizeDomainForBlur(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '')
}

function getReasonCopy(reason: 'DNS_NOT_PROPAGATED' | 'WRONG_TARGET' | 'LOOKUP_FAILED' | null) {
  switch (reason) {
    case 'DNS_NOT_PROPAGATED':
      return 'DNS has not propagated yet. Wait a bit longer and check again.'
    case 'WRONG_TARGET':
      return 'Your domain is pointed to the wrong target or already points somewhere else.'
    case 'LOOKUP_FAILED':
      return 'We could not complete the DNS lookup right now. Try again shortly.'
    default:
      return 'Verification could not be completed.'
  }
}

export default function CustomDomainSetup() {
  const {
    currentStep,
    setCurrentStep,
    domain,
    setDomain,
    normalizedDomain,
    cnameTarget,
    host,
    verificationStatus,
    verificationReason,
    sslStatus,
    isLoading,
    error,
    initiateDomain,
    verifyDomain,
    pollSslStatus,
  } = useCustomDomain()

  const [stepOneError, setStepOneError] = useState<string | null>(null)
  const [retryAvailableAt, setRetryAvailableAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [sslPollingStartedAt, setSslPollingStartedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!normalizedDomain) {
      return
    }

    const stored = window.localStorage.getItem(`${retryStoragePrefix}${normalizedDomain}`)
    setRetryAvailableAt(stored ? Number(stored) : null)
  }, [normalizedDomain])

  useEffect(() => {
    if (!retryAvailableAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [retryAvailableAt])

  useEffect(() => {
    if (currentStep !== 4 || sslStatus === 'active' || sslStatus === 'failed' || !sslPollingStartedAt) {
      return
    }

    if (Date.now() - sslPollingStartedAt >= sslEscalationMs) {
      return
    }

    const intervalId = window.setInterval(() => {
      void pollSslStatus()
    }, 10_000)

    return () => window.clearInterval(intervalId)
  }, [currentStep, pollSslStatus, sslPollingStartedAt, sslStatus])

  useEffect(() => {
    if (currentStep === 4 && sslPollingStartedAt && Date.now() - sslPollingStartedAt >= sslEscalationMs && sslStatus !== 'active') {
      void pollSslStatus()
    }
  }, [currentStep, pollSslStatus, sslPollingStartedAt, sslStatus])

  const retryDisabled = !!retryAvailableAt && retryAvailableAt > now
  const retryCountdown = retryDisabled
    ? Math.ceil((retryAvailableAt - now) / 60_000)
    : 0
  const sslTimedOut =
    currentStep === 4 &&
    sslPollingStartedAt !== null &&
    Date.now() - sslPollingStartedAt >= sslEscalationMs &&
    sslStatus !== 'active'

  const liveDomainUrl = useMemo(() => {
    if (!domain) {
      return null
    }

    return `https://${domain}`
  }, [domain])

  const handleContinue = async () => {
    setStepOneError(null)
    const sanitized = sanitizeDomainForBlur(domain)

    if (!domainPattern.test(sanitized)) {
      setStepOneError('Use a valid domain name like www.victoryacademy.edu.ng.')
      return
    }

    const result = await initiateDomain(domain)
    if (!result.success) {
      return
    }

    toast.success('Domain saved. Add the DNS record below, then verify it.')
  }

  const handleVerify = async () => {
    const result = await verifyDomain()

    if (result.verified) {
      toast.success('Domain verified.')
      return
    }

    const availableAt = Date.now() + retryCooldownMs
    window.localStorage.setItem(`${retryStoragePrefix}${normalizedDomain}`, String(availableAt))
    setRetryAvailableAt(availableAt)
    toast.error(getReasonCopy(result.reason))
  }

  const handleRetryLater = () => {
    if (retryDisabled) {
      return
    }

    setCurrentStep(2)
  }

  const handleStartSsl = async () => {
    setCurrentStep(4)
    setSslPollingStartedAt(Date.now())
    await pollSslStatus()
  }

  const progressStep = sslStatus === 'active' ? 4 : currentStep

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-info">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Custom Domain Setup</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect a school-owned domain like <span className="font-medium">www.victoryacademy.edu.ng</span> to the SchoolOS-hosted website.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step) => {
            const completed = progressStep > step.id
            const active = progressStep === step.id

            return (
              <div
                key={step.id}
                className={`rounded-3xl border px-4 py-4 ${
                  completed
                    ? 'border-emerald-200 bg-emerald-50'
                    : active
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      completed
                        ? 'bg-emerald-600 text-white'
                        : active
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {completed ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Step {step.id}
                    </p>
                    <p className="text-sm font-medium text-gray-800">{step.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {currentStep === 1 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900">Step 1 — Enter Domain</h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter the custom domain you want visitors to use for the school website.
            </p>
            <label className="mt-6 block text-sm font-medium text-gray-700">Your domain name</label>
            <input
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value)
                setStepOneError(null)
              }}
              onBlur={() => setDomain(sanitizeDomainForBlur(domain))}
              placeholder="www.victoryacademy.edu.ng"
              className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            {stepOneError ? <p className="mt-2 text-sm text-red-600">{stepOneError}</p> : null}
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={isLoading}
              className="mt-6 inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Step 2 — Add CNAME Record</h2>
            <p className="mt-2 text-sm text-gray-500">
              Add the DNS record below in your domain registrar dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Record Type</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">CNAME</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Host / Name</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{host}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Points To / Value</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{cnameTarget}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(cnameTarget)
                      toast.success('CNAME target copied.')
                    }}
                    className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">TTL</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">3600 (or Auto)</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-blue-900">
              DNS changes can take up to 24–48 hours to propagate. Most Nigerian registrars
              (Web4Africa, Whogohost, DomainKing) update within 1–2 hours.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={isLoading}
              className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              I&apos;ve added the record — Check Now
            </button>
            <div className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
              Status:&nbsp;
              <span
                className={
                  verificationStatus === 'verified'
                    ? 'text-success'
                    : verificationStatus === 'failed'
                      ? 'text-red-600'
                      : 'text-warning'
                }
              >
                {verificationStatus === 'idle'
                  ? 'Pending'
                  : verificationStatus[0].toUpperCase() + verificationStatus.slice(1)}
              </span>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {verificationStatus === 'verified' ? (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="mt-1 h-8 w-8 text-success" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Domain Verified</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{domain}</span> is now connected to your SchoolOS website.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleStartSsl()}
                className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Continue to SSL &amp; Live
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <XCircle className="mt-1 h-8 w-8 text-red-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
                  <p className="mt-2 text-sm text-gray-600">{getReasonCopy(verificationReason)}</p>
                  {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryLater}
                  disabled={retryDisabled}
                  className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  {retryDisabled ? `Try Again in ${retryCountdown} min` : 'Try Again in 1 Hour'}
                </button>
                <a
                  href={supportWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {currentStep === 4 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {!sslTimedOut && sslStatus !== 'active' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-8 w-8 text-info" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Step 4 — SSL &amp; Live</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Your SSL certificate is being provisioned. This takes 2–5 minutes.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-info">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock3 className="mr-2 h-4 w-4" />}
                SSL status: {sslStatus === 'idle' ? 'provisioning' : sslStatus}
              </div>
            </div>
          ) : null}

          {sslStatus === 'active' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="mt-1 h-8 w-8 text-success" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Your website is live</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Your website is live at{' '}
                    <a
                      href={liveDomainUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-info hover:underline"
                    >
                      {domain}
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {sslTimedOut ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-1 h-8 w-8 text-warning" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manual support needed</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    SSL provisioning has taken more than 10 minutes. Contact support so we can inspect the custom hostname setup manually.
                  </p>
                </div>
              </div>
              <a
                href={supportWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Support on WhatsApp
              </a>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
