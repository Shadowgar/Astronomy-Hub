import { ORAS_SITE } from '../../config/orasSite'
import { parseLocationQuery } from '../shared/locationQuery'

export type ObserveCategory = 'all' | 'solar-system' | 'deep-sky' | 'stars' | 'satellites'

export type SkyDarknessState = 'daylight' | 'civil_twilight' | 'nautical_twilight' | 'astronomical_twilight' | 'astronomical_night' | 'unknown'

export interface ObservabilityContext {
  schema_version: 'observability.v1'
  observer: { lat: number; lng: number; elev: number }
  horizon_model: 'geometric'
  site_horizon_status: 'not_modeled'
  sky_darkness: { state: SkyDarknessState; sun_altitude_deg: number | null; in_astronomical_darkness: boolean | null; source: string | null }
  moon: { altitude_deg: number | null; azimuth_deg: number | null; above_geometric_horizon: boolean | null; ra_deg: number | null; dec_deg: number | null; ra_icrf_deg: number | null; dec_icrf_deg: number | null; source: string | null }
  weather: { status: 'current_fresh' | 'stale' | 'unavailable' | 'degraded' | 'not_evaluated_for_selected_time'; source: string; last_updated: string | null; cloud_cover_pct?: number; visibility_m?: number; temperature_c?: number; humidity_pct?: number; wind_mph?: number; dew_point_c?: number; weather_code?: number }
  limitations: string[]
}

export interface TargetObservability {
  above_geometric_horizon: boolean | null
  altitude_deg: number | null
  azimuth_deg: number | null
  sky_state: SkyDarknessState
  in_astronomical_darkness: boolean | null
  moon_angular_separation_deg: number | null
  assessment: string
  limitations: string[]
}

export interface ObserveObject {
  catalog: string
  source_id: string
  model: string
  name: string
  type: string
  alt: number
  az: number
  is_visible: true
  above_geometric_horizon?: boolean
  observability?: TargetObservability
  sky_engine_url?: string
  magnitude?: number | null
  reason?: string
  object_type_label?: string
  constellation?: string
  aliases?: string[]
  common_names?: string[]
  angular_size?: { major_arcmin?: number | null; minor_arcmin?: number | null }
}

export interface ObservePayload {
  objects: ObserveObject[]
  time: string
  observer: { lat: number; lng: number; elev: number }
  observabilityContext?: ObservabilityContext
}

export interface ObserveContext {
  latitude: number
  longitude: number
  elevationMeters?: number
  at?: string
  isOras: boolean
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validCoordinate(value: string | undefined, min: number, max: number): number | null {
  if (!value || !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max ? number : null
}

export function getObserveContext(search: string): ObserveContext {
  const query = parseLocationQuery(search)
  const lat = validCoordinate(query.lat, -90, 90)
  const lon = validCoordinate(query.lon, -180, 180)
  const isOras = lat === null || lon === null
  const elevationFeet = validCoordinate(query.elevation_ft, -2000, 30000)
  return {
    latitude: isOras ? ORAS_SITE.latitude : lat,
    longitude: isOras ? ORAS_SITE.longitude : lon,
    elevationMeters: isOras ? ORAS_SITE.elevationMeters : elevationFeet === null ? undefined : elevationFeet * 0.3048,
    at: query.at,
    isOras,
  }
}

export function getObservePath(search: string): string {
  const context = getObserveContext(search)
  const query = parseLocationQuery(search)
  const params = new URLSearchParams()
  if (!context.isOras) {
    params.set('lat', String(context.latitude))
    params.set('lon', String(context.longitude))
    if (query.elevation_ft !== undefined) params.set('elevation_ft', query.elevation_ft)
  }
  if (context.at) params.set('at', context.at)
  return `/observe${params.size ? `?${params}` : ''}`
}

export function normalizeObservePayload(payload: unknown): ObservePayload {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid observing data')
  const envelope = payload as Record<string, unknown>
  const data = envelope.data as Record<string, unknown> | undefined
  const meta = envelope.meta as Record<string, unknown> | undefined
  const observer = meta?.observer as Record<string, unknown> | undefined
  if (envelope.status !== 'ok' || !Array.isArray(data?.objects) ||
      typeof meta?.time !== 'string' || !observer ||
      !finite(observer.lat) || !finite(observer.lng) || !finite(observer.elev)) {
    throw new Error('Invalid observing data')
  }
  const seen = new Set<string>()
  const objects = data.objects.filter((entry): entry is ObserveObject => {
    if (!entry || typeof entry !== 'object') return false
    const object = entry as Record<string, unknown>
    if (typeof object.catalog !== 'string' || typeof object.source_id !== 'string' ||
        typeof object.model !== 'string' || typeof object.name !== 'string' ||
        typeof object.type !== 'string' || !finite(object.alt) || !finite(object.az) ||
        object.alt <= 0 || object.is_visible !== true) return false
    const key = `${object.catalog}\0${object.source_id}\0${object.model}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return {
    objects,
    time: meta.time,
    observer: { lat: observer.lat, lng: observer.lng, elev: observer.elev },
    observabilityContext: meta.observability_context as ObservabilityContext | undefined,
  }
}

export function categoryForObject(object: Pick<ObserveObject, 'model'>): ObserveCategory | null {
  if (['sun', 'moon', 'planet', 'solar_system'].includes(object.model)) return 'solar-system'
  if (object.model === 'dso') return 'deep-sky'
  if (object.model === 'star') return 'stars'
  if (object.model === 'tle_satellite') return 'satellites'
  return null
}

const CATEGORY_ORDER: ObserveCategory[] = ['all', 'solar-system', 'deep-sky', 'stars', 'satellites']

export function categoriesForObjects(objects: ObserveObject[]): ObserveCategory[] {
  const present = new Set(objects.map(categoryForObject))
  return CATEGORY_ORDER.filter((category) => category === 'all' || present.has(category))
}

export function skyEngineUrlForObject(object: ObserveObject): string | null {
  if (typeof object.sky_engine_url !== 'string' || !object.sky_engine_url.startsWith('/oras-sky-engine/skysource/')) {
    return null
  }
  const url = new URL(object.sky_engine_url, 'http://local.invalid')
  if (url.searchParams.get('catalog') !== object.catalog ||
      url.searchParams.get('source_id') !== object.source_id ||
      url.searchParams.get('model') !== object.model ||
      !url.searchParams.has('ra') || !url.searchParams.has('dec')) return null
  return `${url.pathname}${url.search}`
}
