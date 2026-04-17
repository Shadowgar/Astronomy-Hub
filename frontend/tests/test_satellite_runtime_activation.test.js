import { describe, expect, it } from 'vitest'

import { computeSatelliteSceneObjects } from '../src/features/sky-engine/astronomy.ts'
import { parseBackendSatelliteScenePayload } from '../src/features/scene/contracts'

const TEST_OBSERVER = {
  label: 'ORAS Observatory',
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

const SATELLITE_PAYLOAD = {
  scope: 'earth',
  engine: 'satellites',
  filter: 'visible_now',
  timestamp: '2026-03-31T12:00:00Z',
  objects: [
    {
      id: 'sat-opal',
      type: 'satellite',
      name: 'OPAL',
      engine: 'satellite',
      provider_source: 'satnogs',
      summary: 'Visible low-earth-orbit pass.',
      position: {
        azimuth: 132.5,
        elevation: 47.2,
      },
      visibility: {
        is_visible: true,
        visibility_window_start: '2026-03-31T11:58:00Z',
        visibility_window_end: '2026-03-31T12:04:00Z',
      },
      relevance_score: 0.94,
      detail_route: '/satellites/opal',
    },
    {
      id: 'sat-jugnu',
      type: 'satellite',
      name: 'JUGNU',
      engine: 'satellite',
      provider_source: 'satnogs',
      summary: 'Smallsat visible above the eastern horizon.',
      position: {
        azimuth: 98.3,
        elevation: 18.1,
      },
      visibility: {
        is_visible: true,
        visibility_window_start: '2026-03-31T11:59:00Z',
        visibility_window_end: '2026-03-31T12:03:00Z',
      },
      relevance_score: 0.76,
    },
    {
      id: 'sat-hidden',
      type: 'satellite',
      name: 'HiddenSat',
      engine: 'satellite',
      provider_source: 'satnogs',
      summary: 'Below horizon test fixture.',
      position: {
        azimuth: 250.4,
        elevation: -4.5,
      },
      visibility: {
        is_visible: true,
      },
      relevance_score: 0.99,
    },
    {
      id: 'sat-not-visible',
      type: 'satellite',
      name: 'InvisibleSat',
      engine: 'satellite',
      provider_source: 'satnogs',
      summary: 'Filtered because the provider marks it invisible.',
      position: {
        azimuth: 201.2,
        elevation: 31.4,
      },
      visibility: {
        is_visible: false,
      },
      relevance_score: 0.91,
    },
  ],
}

describe('Satellite runtime activation', () => {
  it('parses the backend satellite scene payload contract', () => {
    const parsedPayload = parseBackendSatelliteScenePayload(SATELLITE_PAYLOAD)

    expect(parsedPayload).toBeTruthy()
    expect(parsedPayload?.scope).toBe('earth')
    expect(parsedPayload?.engine).toBe('satellites')
    expect(parsedPayload?.objects).toHaveLength(4)
    expect(parsedPayload?.objects[0]?.position.azimuth).toBe(132.5)
    expect(parsedPayload?.objects[0]?.visibility.visibility_window_end).toBe('2026-03-31T12:04:00Z')
  })

  it('converts only currently visible backend satellites into dedicated scene objects', () => {
    const parsedPayload = parseBackendSatelliteScenePayload(SATELLITE_PAYLOAD)
    const objects = computeSatelliteSceneObjects(TEST_OBSERVER, SATELLITE_PAYLOAD.timestamp, parsedPayload?.objects ?? [], 3)

    expect(objects).toHaveLength(2)
    expect(objects.map((object) => object.id)).toEqual(['sat-opal', 'sat-jugnu'])
    expect(objects.every((object) => object.type === 'satellite')).toBe(true)
    expect(objects.every((object) => object.source === 'backend_satellite_scene')).toBe(true)
    expect(objects.every((object) => object.trackingMode === 'static')).toBe(true)
    expect(objects[0]?.azimuthDeg).toBe(132.5)
    expect(objects[0]?.altitudeDeg).toBe(47.2)
    expect(objects[0]?.providerSource).toBe('satnogs')
    expect(objects[0]?.visibilityWindowStartIso).toBe('2026-03-31T11:58:00Z')
    expect(objects[0]?.detailRoute).toBe('/satellites/opal')
    expect(objects[0]?.description).toContain('without orbit lines or photometric brightness modelling')
    expect(objects[0]?.truthNote).toContain('Provider source: satnogs')
  })

  it('derives fallback orbital metadata from TLE when contract fields are absent', () => {
    const parsedPayload = parseBackendSatelliteScenePayload({
      ...SATELLITE_PAYLOAD,
      objects: [
        {
          id: 'sat-iss',
          type: 'satellite',
          name: 'ISS',
          engine: 'satellite',
          provider_source: 'space_track',
          summary: 'Visible TLE-backed pass.',
          position: {
            azimuth: 145.2,
            elevation: 51.8,
          },
          visibility: {
            is_visible: true,
            visibility_window_start: '2026-03-31T11:58:00Z',
            visibility_window_end: '2026-03-31T12:04:00Z',
          },
          model_data: {
            tle_line1: '1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991',
            tle_line2: '2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901',
            stdmag: 1.2,
          },
        },
      ],
    })
    const objects = computeSatelliteSceneObjects(TEST_OBSERVER, SATELLITE_PAYLOAD.timestamp, parsedPayload?.objects ?? [])

    expect(objects).toHaveLength(1)
    expect(objects[0]?.orbitalInclinationDeg).toBeCloseTo(51.6433, 4)
    expect(objects[0]?.orbitalPeriodMinutes).toBeCloseTo(92.9, 1)
  })
})