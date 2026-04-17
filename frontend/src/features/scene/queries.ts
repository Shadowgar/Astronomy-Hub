import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../../lib/api/client'
import type { QueryParams } from '../../lib/api/types'

export interface SceneQueryParams {
  scope?: string
  engine?: string
  filter?: string
  lat?: string | number
  lon?: string | number
  elevation_ft?: string | number
  at?: string
}

const SCENE_ABOVE_ME_PATH = '/api/v1/scene/above-me'
const SCENE_BY_SCOPE_PATH = '/api/v1/scene'
const SKY_STAR_TILE_MANIFEST_PATH = '/api/v1/scene/sky/star-tiles/manifest'

export const sceneKeys = {
  all: ['scene'] as const,
  aboveMe: (params?: SceneQueryParams) => ['scene', 'above-me', params || null] as const,
  byScope: (params?: SceneQueryParams) => ['scene', 'scope', params || null] as const,
  skyStarTileManifest: (params?: Pick<SceneQueryParams, 'at'>) => ['scene', 'sky', 'star-tiles', 'manifest', params || null] as const,
}

function toQueryParams(params?: SceneQueryParams): QueryParams | undefined {
  if (!params) return undefined
  return {
    scope: params.scope,
    engine: params.engine,
    filter: params.filter,
    lat: params.lat,
    lon: params.lon,
    elevation_ft: params.elevation_ft,
    at: params.at,
  }
}

export async function fetchSceneAboveMe(params?: SceneQueryParams) {
  return apiGet<unknown>(SCENE_ABOVE_ME_PATH, { query: toQueryParams(params) })
}

export async function fetchSceneByScope(params?: SceneQueryParams) {
  return apiGet<unknown>(SCENE_BY_SCOPE_PATH, { query: toQueryParams(params) })
}

export async function fetchSkyStarTileManifest(params?: Pick<SceneQueryParams, 'at'>) {
  return apiGet<unknown>(SKY_STAR_TILE_MANIFEST_PATH, { query: toQueryParams(params) })
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

export function useSceneByScopeDataQuery(params?: SceneQueryParams) {
  return useQuery({
    queryKey: sceneKeys.byScope(params),
    queryFn: () => fetchSceneByScope(params),
    select: normalizeScenePayload,
  })
}

export function useSkyStarTileManifestDataQuery(params?: Pick<SceneQueryParams, 'at'>) {
  return useQuery({
    queryKey: sceneKeys.skyStarTileManifest(params),
    queryFn: () => fetchSkyStarTileManifest(params),
    select: normalizeScenePayload,
  })
}
