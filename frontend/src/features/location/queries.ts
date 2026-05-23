import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'

const LOCATION_SEARCH_PATH = '/location/search'

export const locationKeys = {
  all: ['location'] as const,
  search: (q?: string) => ['location', 'search', q || null] as const,
}

export async function fetchLocationSearch(q: string) {
  return apiGet<unknown>(LOCATION_SEARCH_PATH, { query: { q } })
}

export function normalizeLocationSearchPayload(payload: unknown): unknown[] {
  const unwrapped =
    payload && typeof payload === 'object'
      ? ((payload as { data?: unknown }).data || payload)
      : payload
  return Array.isArray(unwrapped) ? unwrapped : []
}

export function useLocationSearchQuery(queryText?: string) {
  const q = (queryText || '').trim()
  return useQuery({
    queryKey: locationKeys.search(q),
    enabled: q.length >= 3,
    queryFn: () => fetchLocationSearch(q),
  })
}

export function useLocationSearchListQuery(queryText?: string) {
  const q = (queryText || '').trim()
  return useQuery({
    queryKey: locationKeys.search(q),
    enabled: q.length >= 3,
    queryFn: () => fetchLocationSearch(q),
    select: normalizeLocationSearchPayload,
    placeholderData: [],
  })
}
