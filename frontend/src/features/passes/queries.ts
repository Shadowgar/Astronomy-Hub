import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface PassesQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

const PASSES_PATH = '/passes'

export const passesKeys = {
  all: ['passes'] as const,
  list: (params?: PassesQueryParams) => ['passes', params || null] as const,
}

function toQueryParams(params?: PassesQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchPasses(params?: PassesQueryParams) {
  return apiGet<unknown>(PASSES_PATH, { query: toQueryParams(params) })
}

export function normalizePassesPayload(payload: unknown): unknown[] {
  const unwrapped =
    payload && typeof payload === 'object'
      ? ((payload as { data?: unknown }).data || payload)
      : payload
  return Array.isArray(unwrapped) ? unwrapped : []
}

export function usePassesQuery(params?: PassesQueryParams) {
  return useQuery({
    queryKey: passesKeys.list(params),
    queryFn: () => fetchPasses(params),
  })
}

export function usePassesListQuery(params?: PassesQueryParams) {
  return useQuery({
    queryKey: passesKeys.list(params),
    queryFn: () => fetchPasses(params),
    select: normalizePassesPayload,
    placeholderData: [],
  })
}
