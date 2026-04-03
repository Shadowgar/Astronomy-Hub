export interface LocationQueryParams {
  lat?: string
  lon?: string
  elevation_ft?: string
  at?: string
}

export function parseLocationQuery(locationQuery?: string): LocationQueryParams {
  const query = (locationQuery || '').replace(/^\?/, '')
  if (!query) return {}
  const params = new URLSearchParams(query)
  return {
    lat: params.get('lat') || undefined,
    lon: params.get('lon') || undefined,
    elevation_ft: params.get('elevation_ft') || undefined,
    at: params.get('at') || undefined,
  }
}
