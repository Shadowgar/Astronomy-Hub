import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface ConditionsQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

const CONDITIONS_PATH = '/conditions'

export const conditionsKeys = {
  all: ['conditions'] as const,
  list: (params?: ConditionsQueryParams) => ['conditions', params || null] as const,
}

function toQueryParams(params?: ConditionsQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchConditions(params?: ConditionsQueryParams) {
  return apiGet<unknown>(CONDITIONS_PATH, { query: toQueryParams(params) })
}

export function useConditionsQuery(params?: ConditionsQueryParams) {
  return useQuery({
    queryKey: conditionsKeys.list(params),
    queryFn: () => fetchConditions(params),
  })
}
