import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface AlertsQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

const ALERTS_PATH = '/alerts'

export const alertsKeys = {
  all: ['alerts'] as const,
  list: (params?: AlertsQueryParams) => ['alerts', params || null] as const,
}

function toQueryParams(params?: AlertsQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchAlerts(params?: AlertsQueryParams) {
  return apiGet<unknown>(ALERTS_PATH, { query: toQueryParams(params) })
}

export function normalizeAlertsPayload(payload: unknown): unknown[] {
  const unwrapped =
    payload && typeof payload === 'object'
      ? ((payload as { data?: unknown }).data || payload)
      : payload
  return Array.isArray(unwrapped) ? unwrapped : []
}

export function useAlertsQuery(params?: AlertsQueryParams) {
  return useQuery({
    queryKey: alertsKeys.list(params),
    queryFn: () => fetchAlerts(params),
  })
}

export function useAlertsListQuery(params?: AlertsQueryParams) {
  return useQuery({
    queryKey: alertsKeys.list(params),
    queryFn: () => fetchAlerts(params),
    select: normalizeAlertsPayload,
    placeholderData: [],
  })
}
