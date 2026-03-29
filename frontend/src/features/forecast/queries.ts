import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'

export const forecastKeys = {
  all: ['forecast'] as const,
  byEndpoint: (endpointPath?: string) => ['forecast', endpointPath || null] as const,
}

export async function fetchForecast(endpointPath: string) {
  return apiGet<unknown>(endpointPath)
}

export function useForecastQuery(endpointPath?: string) {
  return useQuery({
    queryKey: forecastKeys.byEndpoint(endpointPath),
    enabled: Boolean(endpointPath),
    queryFn: () => fetchForecast(endpointPath as string),
  })
}
