/// <reference types="vite/client" />
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token)
    else p.reject(error)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const tenantId = localStorage.getItem('tenantId')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId
  return config
})

// Prisma serializes Decimal fields as strings in JSON. Coerce known monetary
// fields to numbers here so all downstream code can trust the TypeScript types.
const DECIMAL_FIELDS = new Set(['totalAmount', 'paidAmount', 'amount', 'commissionPercent'])

function coerceDecimals(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(coerceDecimals)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = DECIMAL_FIELDS.has(k) && typeof v === 'string' ? Number(v) : coerceDecimals(v)
    }
    return out
  }
  return value
}

api.interceptors.response.use(
  (res) => {
    res.data = coerceDecimals(res.data)
    return res
  },
  async (err) => {
    const originalRequest = err.config
    const requestUrl = typeof originalRequest?.url === 'string' ? originalRequest.url : ''
    const bypassRefresh =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout')

    if (err.response?.status !== 401 || originalRequest?._retry || bypassRefresh) {
      return Promise.reject(err)
    }

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      useAuthStore.getState().logout()
      window.location.replace('/login')
      return Promise.reject(err)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true
    originalRequest._retry = true

    try {
      const tenantId = localStorage.getItem('tenantId')
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: tenantId ? { 'X-Tenant-ID': tenantId } : {} }
      )

      useAuthStore.getState().setTokens(data.token, data.refreshToken)

      processQueue(null, data.token)
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${data.token}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      window.location.replace('/login')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
