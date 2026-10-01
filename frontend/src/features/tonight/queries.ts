import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api/client'
import { normalizeTonight } from './model'
import { currentObservingNight, subscribeObservingNight, subscribeFixedNight } from './nightClock'
export function useTonightQuery(date?: string) {
 const implicitDate = useSyncExternalStore(date ? subscribeFixedNight : subscribeObservingNight, currentObservingNight, currentObservingNight)
 const resolvedDate = date || implicitDate
 return useQuery({ queryKey:['tonight.v1',resolvedDate],
  queryFn: async () => normalizeTonight(await apiGet<unknown>('/api/tonight',{query:{date:resolvedDate}})),
  staleTime:60_000,refetchInterval:600_000 })
}
