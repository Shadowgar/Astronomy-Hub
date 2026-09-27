import { ORAS_SITE } from '../../config/orasSite'

export function buildSkyOverOrasNowPath(now = new Date()): string {
  const params = new URLSearchParams({
    date: now.toISOString(),
    lat: String(ORAS_SITE.latitude),
    lng: String(ORAS_SITE.longitude),
    elev: String(ORAS_SITE.elevationMeters),
    fov: '120',
  })

  return `/sky-engine?${params.toString()}`
}

export const ORAS_OBSERVATORY_COORDINATES = ORAS_SITE
