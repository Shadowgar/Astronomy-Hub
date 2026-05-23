import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface TargetsQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

const TARGETS_PATH = '/targets'

export const targetsKeys = {
  all: ['targets'] as const,
  list: (params?: TargetsQueryParams) => ['targets', params || null] as const,
}

function toQueryParams(params?: TargetsQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchTargets(params?: TargetsQueryParams) {
  return apiGet<unknown>(TARGETS_PATH, { query: toQueryParams(params) })
}

export function normalizeTargetsPayload(payload: unknown): unknown[] {
  const unwrapped =
    payload && typeof payload === 'object'
      ? ((payload as { data?: unknown }).data || payload)
      : payload
  return Array.isArray(unwrapped) ? unwrapped : []
}

export function useTargetsQuery(params?: TargetsQueryParams) {
  return useQuery({
    queryKey: targetsKeys.list(params),
    queryFn: () => fetchTargets(params),
  })
}

export function useTargetsListQuery(params?: TargetsQueryParams) {
  return useQuery({
    queryKey: targetsKeys.list(params),
    queryFn: () => fetchTargets(params),
    select: normalizeTargetsPayload,
    placeholderData: [],
  })
}
