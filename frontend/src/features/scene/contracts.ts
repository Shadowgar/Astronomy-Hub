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
    color_index: candidate.color_index as number | null | undefined,
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