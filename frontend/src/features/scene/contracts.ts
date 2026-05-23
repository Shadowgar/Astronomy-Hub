export interface BackendSkySceneStarObject {
  id: string
  type: 'star'
  name: string
  engine: 'sky_engine'
  right_ascension: number
  declination: number
  magnitude: number
  color_index?: number | null
}

export interface BackendSatelliteSceneObject {
  id: string
  type: 'satellite'
  name: string
  engine: 'satellite'
  provider_source: string
  summary: string
  position: {
    azimuth: number
    elevation: number
  }
  visibility: {
    is_visible: boolean
    visibility_window_start?: string | null
    visibility_window_end?: string | null
  }
  relevance_score?: number
  detail_route?: string
  model_data?: {
    tle_line1?: string
    tle_line2?: string
    stdmag?: number
    epoch?: string
    inclination_deg?: number
    period_minutes?: number
    norad_cat_id?: string
  }
}

export interface BackendSkyStarTileDescriptor {
  tier: 1 | 2
  tile_id: string
  lookup_key: string
  source: 'bright_star_catalog' | 'hipparcos_subset'
  object_count: number
  magnitude_min: number
  magnitude_max: number
}

export interface BackendSkyStarTileManifestPayload {
  scope: 'sky'
  engine: 'sky_engine'
  manifest_version: 'tier2'
  generated_at: string
  tiles: BackendSkyStarTileDescriptor[]
  degraded: boolean
  missing_sources: string[]
}

export interface BackendSkyScenePayload {
  scope: 'sky'
  engine: 'sky_engine'
  filter: 'visible_now'
  timestamp: string
  observer: {
    label: string
    latitude: number
    longitude: number
    elevation_ft?: number | null
    elevation_m?: number | null
  }
  scene_state: {
    projection: 'stereographic'
    center_alt_deg: number
    center_az_deg: number
    fov_deg: number
    stars_ready: boolean
  }
  objects: BackendSkySceneStarObject[]
}

export interface BackendSatelliteScenePayload {
  scope: 'earth'
  engine: 'satellites'
  filter: string
  timestamp: string
  objects: BackendSatelliteSceneObject[]
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseBackendSkySceneStarObject(value: unknown): BackendSkySceneStarObject | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.id !== 'string' ||
    candidate.type !== 'star' ||
    typeof candidate.name !== 'string' ||
    candidate.engine !== 'sky_engine' ||
    !isFiniteNumber(candidate.right_ascension) ||
    !isFiniteNumber(candidate.declination) ||
    !isFiniteNumber(candidate.magnitude)
  ) {
    return null
  }

  if (
    candidate.color_index !== undefined &&
    candidate.color_index !== null &&
    !isFiniteNumber(candidate.color_index)
  ) {
    return null
  }

  return {
    id: candidate.id,
    type: 'star',
    name: candidate.name,
    engine: 'sky_engine',
    right_ascension: candidate.right_ascension,
    declination: candidate.declination,
    magnitude: candidate.magnitude,
    color_index: candidate.color_index,
  }
}

function parseBackendSatelliteSceneObject(value: unknown): BackendSatelliteSceneObject | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const position = candidate.position as Record<string, unknown> | undefined
  const visibility = candidate.visibility as Record<string, unknown> | undefined

  if (
    typeof candidate.id !== 'string' ||
    candidate.type !== 'satellite' ||
    typeof candidate.name !== 'string' ||
    candidate.engine !== 'satellite' ||
    typeof candidate.provider_source !== 'string' ||
    typeof candidate.summary !== 'string' ||
    !position ||
    !visibility ||
    !isFiniteNumber(position.azimuth) ||
    !isFiniteNumber(position.elevation) ||
    typeof visibility.is_visible !== 'boolean'
  ) {
    return null
  }

  if (
    visibility.visibility_window_start !== undefined &&
    visibility.visibility_window_start !== null &&
    typeof visibility.visibility_window_start !== 'string'
  ) {
    return null
  }

  if (
    visibility.visibility_window_end !== undefined &&
    visibility.visibility_window_end !== null &&
    typeof visibility.visibility_window_end !== 'string'
  ) {
    return null
  }

  if (candidate.relevance_score !== undefined && !isFiniteNumber(candidate.relevance_score)) {
    return null
  }

  if (candidate.detail_route !== undefined && typeof candidate.detail_route !== 'string') {
    return null
  }

  if (candidate.model_data !== undefined && candidate.model_data !== null) {
    if (typeof candidate.model_data !== 'object') {
      return null
    }
    const modelData = candidate.model_data as Record<string, unknown>
    if (modelData.tle_line1 !== undefined && typeof modelData.tle_line1 !== 'string') {
      return null
    }
    if (modelData.tle_line2 !== undefined && typeof modelData.tle_line2 !== 'string') {
      return null
    }
    if (modelData.stdmag !== undefined && !isFiniteNumber(modelData.stdmag)) {
      return null
    }
    if (modelData.epoch !== undefined && typeof modelData.epoch !== 'string') {
      return null
    }
    if (modelData.inclination_deg !== undefined && !isFiniteNumber(modelData.inclination_deg)) {
      return null
    }
    if (modelData.period_minutes !== undefined && !isFiniteNumber(modelData.period_minutes)) {
      return null
    }
    if (modelData.norad_cat_id !== undefined && typeof modelData.norad_cat_id !== 'string') {
      return null
    }
  }

  return {
    id: candidate.id,
    type: 'satellite',
    name: candidate.name,
    engine: 'satellite',
    provider_source: candidate.provider_source,
    summary: candidate.summary,
    position: {
      azimuth: position.azimuth,
      elevation: position.elevation,
    },
    visibility: {
      is_visible: visibility.is_visible,
      visibility_window_start: visibility.visibility_window_start as string | null | undefined,
      visibility_window_end: visibility.visibility_window_end as string | null | undefined,
    },
    relevance_score: candidate.relevance_score,
    detail_route: candidate.detail_route as string | undefined,
    model_data: candidate.model_data as BackendSatelliteSceneObject['model_data'],
  }
}

function parseBackendSkyStarTileDescriptor(value: unknown): BackendSkyStarTileDescriptor | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const source = candidate.source

  if (
    (candidate.tier !== 1 && candidate.tier !== 2) ||
    typeof candidate.tile_id !== 'string' ||
    typeof candidate.lookup_key !== 'string' ||
    (source !== 'bright_star_catalog' && source !== 'hipparcos_subset') ||
    !isFiniteNumber(candidate.object_count) ||
    !Number.isInteger(candidate.object_count) ||
    candidate.object_count < 0 ||
    !isFiniteNumber(candidate.magnitude_min) ||
    !isFiniteNumber(candidate.magnitude_max)
  ) {
    return null
  }

  return {
    tier: candidate.tier,
    tile_id: candidate.tile_id,
    lookup_key: candidate.lookup_key,
    source,
    object_count: candidate.object_count,
    magnitude_min: candidate.magnitude_min,
    magnitude_max: candidate.magnitude_max,
  }
}

export function parseBackendSkyScenePayload(payload: unknown): BackendSkyScenePayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as Record<string, unknown>
  const observer = candidate.observer as Record<string, unknown> | undefined
  const sceneState = candidate.scene_state as Record<string, unknown> | undefined
  const objects = Array.isArray(candidate.objects) ? candidate.objects : null

  if (candidate.scope !== 'sky' || candidate.engine !== 'sky_engine' || typeof candidate.timestamp !== 'string') {
    return null
  }

  if (!observer || !sceneState || !objects) {
    return null
  }

  if (
    typeof observer.label !== 'string' ||
    !isFiniteNumber(observer.latitude) ||
    !isFiniteNumber(observer.longitude) ||
    sceneState.projection !== 'stereographic' ||
    !isFiniteNumber(sceneState.center_alt_deg) ||
    !isFiniteNumber(sceneState.center_az_deg) ||
    !isFiniteNumber(sceneState.fov_deg) ||
    typeof sceneState.stars_ready !== 'boolean'
  ) {
    return null
  }

  const parsedStars: BackendSkySceneStarObject[] = []

  for (const object of objects) {
    const parsedObject = parseBackendSkySceneStarObject(object)

    if (!parsedObject) {
      return null
    }

    parsedStars.push(parsedObject)
  }

  return {
    ...(candidate as Omit<BackendSkyScenePayload, 'objects'>),
    objects: parsedStars,
  }
}

export function parseBackendSatelliteScenePayload(payload: unknown): BackendSatelliteScenePayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as Record<string, unknown>
  const objects = Array.isArray(candidate.objects) ? candidate.objects : null

  if (
    candidate.scope !== 'earth' ||
    candidate.engine !== 'satellites' ||
    typeof candidate.filter !== 'string' ||
    typeof candidate.timestamp !== 'string' ||
    !objects
  ) {
    return null
  }

  const parsedObjects: BackendSatelliteSceneObject[] = []

  for (const object of objects) {
    const parsedObject = parseBackendSatelliteSceneObject(object)

    if (!parsedObject) {
      return null
    }

    parsedObjects.push(parsedObject)
  }

  return {
    scope: 'earth',
    engine: 'satellites',
    filter: candidate.filter,
    timestamp: candidate.timestamp,
    objects: parsedObjects,
  }
}

export function parseBackendSkyStarTileManifestPayload(payload: unknown): BackendSkyStarTileManifestPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as Record<string, unknown>
  const tiles = Array.isArray(candidate.tiles) ? candidate.tiles : null

  if (
    candidate.scope !== 'sky' ||
    candidate.engine !== 'sky_engine' ||
    candidate.manifest_version !== 'tier2' ||
    typeof candidate.generated_at !== 'string' ||
    typeof candidate.degraded !== 'boolean' ||
    !Array.isArray(candidate.missing_sources) ||
    !tiles
  ) {
    return null
  }

  const parsedTiles: BackendSkyStarTileDescriptor[] = []

  for (const tile of tiles) {
    const parsedTile = parseBackendSkyStarTileDescriptor(tile)

    if (!parsedTile) {
      return null
    }

    parsedTiles.push(parsedTile)
  }

  if (!candidate.missing_sources.every((value) => typeof value === 'string')) {
    return null
  }

  return {
    scope: 'sky',
    engine: 'sky_engine',
    manifest_version: 'tier2',
    generated_at: candidate.generated_at,
    tiles: parsedTiles,
    degraded: candidate.degraded,
    missing_sources: candidate.missing_sources,
  }
}