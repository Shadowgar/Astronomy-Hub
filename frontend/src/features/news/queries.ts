import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface NewsQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
  scope?: string
  engine?: string
  limit?: string | number
}

const NEWS_PATH = '/news'

export const newsKeys = {
  all: ['news'] as const,
  list: (params?: NewsQueryParams) => ['news', params || null] as const,
}

function toQueryParams(params?: NewsQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
    scope: params.scope,
    engine: params.engine,
    limit: params.limit,
  }
}

export async function fetchNews(params?: NewsQueryParams) {
  return apiGet<unknown>(NEWS_PATH, { query: toQueryParams(params) })
}

export function normalizeNewsPayload(payload: unknown): unknown[] {
  const unwrapped =
    payload && typeof payload === 'object'
      ? ((payload as { data?: unknown }).data || payload)
      : payload
  return Array.isArray(unwrapped) ? unwrapped : []
}

export function useNewsQuery(params?: NewsQueryParams) {
  return useQuery({
    queryKey: newsKeys.list(params),
    queryFn: () => fetchNews(params),
  })
}

export function useNewsListQuery(params?: NewsQueryParams) {
  return useQuery({
    queryKey: newsKeys.list(params),
    queryFn: () => fetchNews(params),
    select: normalizeNewsPayload,
    placeholderData: [],
  })
}
