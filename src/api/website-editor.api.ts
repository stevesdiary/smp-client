import api from '@/lib/api'
import type { SchoolWebsiteConfig } from '@/types/school-website'

export async function getWebsiteConfig(): Promise<SchoolWebsiteConfig> {
  const response = await api.get<SchoolWebsiteConfig>('/api/admin/website')
  return response.data
}

export async function saveWebsiteConfig(
  config: SchoolWebsiteConfig,
): Promise<{ success: boolean }> {
  const response = await api.patch<{ success: boolean }>('/api/admin/website', config)
  return response.data
}
