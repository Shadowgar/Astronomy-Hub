import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

const OBJECTS_PATH = '/object'

export interface ObjectDetailQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

export const objectsKeys = {
  all: ['objects'] as const,
  detail: (objectId?: string, params?: ObjectDetailQueryParams) =>
    ['objects', 'detail', objectId || null, params || null] as const,
}

function toQueryParams(params?: ObjectDetailQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchObjectDetail(objectId: string, params?: ObjectDetailQueryParams) {
  return apiGet<unknown>(`${OBJECTS_PATH}/${encodeURIComponent(objectId)}`, {
    query: toQueryParams(params),
  })
}

export function normalizeObjectDetailPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    return ((payload as { data?: unknown }).data || payload)
  }
  return payload
}

export function useObjectDetailQuery(objectId?: string, params?: ObjectDetailQueryParams) {
  return useQuery({
    queryKey: objectsKeys.detail(objectId, params),
    enabled: Boolean(objectId),
    queryFn: () => fetchObjectDetail(objectId as string, params),
  })
}

export function useObjectDetailDataQuery(objectId?: string, params?: ObjectDetailQueryParams) {
  return useQuery({
    queryKey: objectsKeys.detail(objectId, params),
    enabled: Boolean(objectId),
    queryFn: () => fetchObjectDetail(objectId as string, params),
    select: normalizeObjectDetailPayload,
  })
}
