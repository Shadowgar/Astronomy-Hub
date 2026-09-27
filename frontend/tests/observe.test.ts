import { afterEach, describe, expect, it, vi } from 'vitest'

import { ORAS_SITE } from '../src/config/orasSite'
import {
  categoryForObject,
  categoriesForObjects,
  getObserveContext,
  getObservePath,
  normalizeObservePayload,
  skyEngineUrlForObject,
} from '../src/features/observe/model'
import { fetchObserveSky } from '../src/features/observe/queries'

const m31 = {
  catalog: 'Messier (local)', source_id: 'M31', model: 'dso', name: 'Andromeda Galaxy',
  type: 'galaxy', alt: 52.3, az: 101.2, is_visible: true,
  sky_engine_url: '/oras-sky-engine/skysource/AndromedaGalaxy?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.68&dec=41.269',
}
const moon = {
  ...m31, catalog: 'Solar System (JPL)', source_id: 'moon', model: 'moon',
  name: 'Moon', type: 'moon',
  sky_engine_url: '/oras-sky-engine/skysource/Moon?catalog=Solar+System+%28JPL%29&source_id=moon&model=moon&ra=10&dec=20',
}
const satellite = {
  ...m31, catalog: 'Local TLE', source_id: '25544', model: 'tle_satellite',
  name: 'ISS', type: 'satellite',
  sky_engine_url: '/oras-sky-engine/skysource/ISS?catalog=Local+TLE&source_id=25544&model=tle_satellite&ra=10&dec=20',
}

describe('ORAS Observe data contract', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the canonical ORAS site without a query override', () => {
    expect(ORAS_SITE).toMatchObject({ latitude: 41.321903, longitude: -79.585394, elevationMeters: 432.816 })
    expect(getObserveContext('')).toMatchObject({
      latitude: 41.321903, longitude: -79.585394, elevationMeters: 432.816,
      isOras: true,
    })
  })

  it('preserves supported location and time query context', () => {
    const search = '?lat=42&lon=-80&elevation_ft=1200&at=2026-10-01T02%3A00%3A00Z&debug=1'
    expect(getObserveContext(search)).toMatchObject({
      latitude: 42, longitude: -80, elevationMeters: 365.76,
      at: '2026-10-01T02:00:00Z', isOras: false,
    })
    expect(getObservePath(search)).toBe('/observe?lat=42&lon=-80&elevation_ft=1200&at=2026-10-01T02%3A00%3A00Z')
  })

  it('leaves elevation unspecified for a custom location without elevation', () => {
    expect(getObserveContext('?lat=34&lon=-118')).toMatchObject({
      latitude: 34, longitude: -118, isOras: false,
    })
    expect(getObserveContext('?lat=34&lon=-118').elevationMeters).toBeUndefined()
  })

  it('keeps only source-backed above-horizon records and exact identity links', () => {
    const payload = normalizeObservePayload({
      status: 'ok', data: { objects: [m31, moon, { ...m31, source_id: 'below', alt: -2, is_visible: false }] },
      meta: { time: '2026-09-27T06:00:00Z', observer: { lat: 41.321903, lng: -79.585394, elev: 432.816 } },
    })
    expect(payload.objects).toHaveLength(2)
    expect(payload.time).toBe('2026-09-27T06:00:00Z')
    expect(skyEngineUrlForObject(payload.objects[0])).toBe(m31.sky_engine_url)
    expect(skyEngineUrlForObject({ ...m31, sky_engine_url: '/oras-sky-engine/skysource/X?catalog=Wrong&source_id=M31&model=dso' })).toBeNull()
  })

  it('shows only categories backed by returned objects', () => {
    expect(categoryForObject(m31)).toBe('deep-sky')
    expect(categoryForObject(moon)).toBe('solar-system')
    expect(categoriesForObjects([m31, moon])).toEqual(['all', 'solar-system', 'deep-sky'])
    expect(categoryForObject(satellite)).toBe('satellites')
    expect(categoriesForObjects([m31, satellite])).toEqual(['all', 'deep-sky', 'satellites'])
  })

  it('requests the curated API with ORAS coordinates and a bounded result count', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:4173' } })
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      status: 'ok', data: { objects: [m31] },
      meta: { time: '2026-09-27T06:00:00Z', observer: { lat: 41.321903, lng: -79.585394, elev: 432.816 } },
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchObserveSky(getObserveContext(''))
    expect(result.objects).toHaveLength(1)
    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost:4173')
    expect(url.pathname).toBe('/api/above-me')
    expect(url.searchParams.get('lat')).toBe('41.321903')
    expect(url.searchParams.get('lng')).toBe('-79.585394')
    expect(url.searchParams.get('elev')).toBe('432.816')
    expect(url.searchParams.get('limit')).toBe('100')
  })

  it('omits elevation from custom-site requests when it is unknown', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:4173' } })
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      status: 'ok', data: { objects: [] },
      meta: { time: '2026-09-27T06:00:00Z', observer: { lat: 34, lng: -118, elev: 0 } },
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchObserveSky(getObserveContext('?lat=34&lon=-118'))
    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost:4173')
    expect(url.searchParams.has('elev')).toBe(false)
  })
})
