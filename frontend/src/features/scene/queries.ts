import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface SceneQueryParams {
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
}

const SCENE_ABOVE_ME_PATH = '/scene/above-me'

export const sceneKeys = {
  all: ['scene'] as const,
  aboveMe: (params?: SceneQueryParams) => ['scene', 'above-me', params || null] as const,
}

function toQueryParams(params?: SceneQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
  }
}

export async function fetchSceneAboveMe(params?: SceneQueryParams) {
  return apiGet<unknown>(SCENE_ABOVE_ME_PATH, { query: toQueryParams(params) })
}

export function normalizeScenePayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    return ((payload as { data?: unknown }).data || payload)
  }
  return payload
}

export function useSceneAboveMeQuery(params?: SceneQueryParams) {
  return useQuery({
    queryKey: sceneKeys.aboveMe(params),
    queryFn: () => fetchSceneAboveMe(params),
  })
}

export function useSceneAboveMeDataQuery(params?: SceneQueryParams) {
  return useQuery({
    queryKey: sceneKeys.aboveMe(params),
    queryFn: () => fetchSceneAboveMe(params),
    select: normalizeScenePayload,
  })
}
