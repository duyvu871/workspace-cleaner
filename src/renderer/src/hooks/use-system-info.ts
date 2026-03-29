import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/electron-api'
import type { SystemInfo } from '@shared/types'

export function useSystemInfo() {
  return useQuery<SystemInfo, Error>({
    queryKey: ['system-info'],
    queryFn: async () => {
      const result = await api.getSystemInfo()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    staleTime: Infinity, // system info doesn't change while app is open
  })
}
