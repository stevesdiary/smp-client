import { useCallback, useMemo, useState } from 'react'
import api from '@/lib/api'
import { getApiErrorMessage } from '@/lib/utils'

export type VerificationStatus = 'idle' | 'pending' | 'verified' | 'failed'
export type SslStatus = 'idle' | 'provisioning' | 'active' | 'failed'
export type VerificationReason = 'DNS_NOT_PROPAGATED' | 'WRONG_TARGET' | 'LOOKUP_FAILED' | null

const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i

function sanitizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/g, '')
}

export function useCustomDomain() {
  const [currentStep, setCurrentStep] = useState(1)
  const [domain, setDomain] = useState('')
  const [cnameTarget, setCnameTarget] = useState('websites.schoolos.ng')
  const [host, setHost] = useState('www')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle')
  const [verificationReason, setVerificationReason] = useState<VerificationReason>(null)
  const [sslStatus, setSslStatus] = useState<SslStatus>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedDomain = useMemo(() => sanitizeDomain(domain), [domain])

  const initiateDomain = useCallback(async (value: string) => {
    const sanitized = sanitizeDomain(value)

    if (!domainPattern.test(sanitized)) {
      setError('Enter a valid domain name.')
      return { success: false as const }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post<{ success: boolean; cnameTarget: string; host: string }>(
        '/api/admin/website/domain/initiate',
        { domain: sanitized },
      )

      setDomain(sanitized)
      setCnameTarget(response.data.cnameTarget)
      setHost(response.data.host)
      setVerificationStatus('pending')
      setVerificationReason(null)
      setSslStatus('idle')
      setCurrentStep(2)

      return { success: true as const, cnameTarget: response.data.cnameTarget, host: response.data.host }
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to initiate custom domain setup.'))
      return { success: false as const }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyDomain = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post<
        | { verified: true; domain: string; sslStatus: 'provisioning' }
        | { verified: false; reason: Exclude<VerificationReason, null> }
      >('/api/admin/website/domain/verify')

      if (response.data.verified) {
        setVerificationStatus('verified')
        setVerificationReason(null)
        setSslStatus(response.data.sslStatus)
        setCurrentStep(3)
        return response.data
      }

      setVerificationStatus('failed')
      setVerificationReason(response.data.reason)
      setCurrentStep(3)
      return response.data
    } catch (error) {
      setVerificationStatus('failed')
      setVerificationReason('LOOKUP_FAILED')
      setError(getApiErrorMessage(error, 'Unable to verify DNS right now.'))
      setCurrentStep(3)
      return { verified: false as const, reason: 'LOOKUP_FAILED' as const }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const pollSslStatus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.get<{ sslStatus: 'provisioning' | 'active' | 'failed'; domain: string }>(
        '/api/admin/website/domain/ssl-status',
      )
      setSslStatus(response.data.sslStatus)
      setDomain(response.data.domain)
      return response.data
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to check SSL status right now.'))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
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
  }
}
