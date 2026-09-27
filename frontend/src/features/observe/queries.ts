import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import { normalizeObservePayload, type ObserveContext, type ObservePayload } from './model'

export async function fetchObserveSky(context: ObserveContext): Promise<ObservePayload> {
  const response = await apiGet<unknown>('/api/above-me', {
    query: {
      lat: context.latitude,
      lng: context.longitude,
      elev: context.elevationMeters,
      time: context.at,
      limit: 100,
    },
  })
  return normalizeObservePayload(response)
}

export function useObserveSkyQuery(context: ObserveContext) {
  return useQuery({
    queryKey: ['observe', context.latitude, context.longitude, context.elevationMeters, context.at || 'now'],
    queryFn: () => fetchObserveSky(context),
    staleTime: 30_000,
    refetchInterval: context.at ? false : 60_000,
    retry: 1,
  })
}
