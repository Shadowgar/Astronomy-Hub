import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api/client'
import { normalizeTonight } from './model'
export function useTonightQuery(date?: string) {
 return useQuery({ queryKey:['tonight.v1',date || 'current-observing-night'],
  queryFn: async () => normalizeTonight(await apiGet<unknown>('/api/tonight',{query:{date}})),
  staleTime:60_000,refetchInterval:600_000 })
}
