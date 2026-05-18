const ORAS_OBSERVATORY = {
  latitude: 41.321903,
  longitude: -79.585394,
  elevationMeters: 433,
}

export function buildSkyOverOrasNowPath(now = new Date()): string {
  const params = new URLSearchParams({
    date: now.toISOString(),
    lat: String(ORAS_OBSERVATORY.latitude),
    lng: String(ORAS_OBSERVATORY.longitude),
    elev: String(ORAS_OBSERVATORY.elevationMeters),
    fov: '120',
  })

  return `/sky-engine?${params.toString()}`
}

export const ORAS_OBSERVATORY_COORDINATES = ORAS_OBSERVATORY