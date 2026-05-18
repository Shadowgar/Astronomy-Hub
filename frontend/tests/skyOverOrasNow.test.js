import { describe, expect, it } from 'vitest'

import { ORAS_OBSERVATORY_COORDINATES, buildSkyOverOrasNowPath } from '../src/features/sky-engine/skyOverOrasNow'

describe('sky over ORAS now route builder', () => {
  it('builds a sky-engine URL with ORAS observatory coordinates', () => {
    const now = new Date('2026-05-18T13:00:00.000Z')
    const path = buildSkyOverOrasNowPath(now)
    const [pathname, query = ''] = path.split('?')
    const params = new URLSearchParams(query)

    expect(pathname).toBe('/sky-engine')
    expect(params.get('date')).toBe('2026-05-18T13:00:00.000Z')
    expect(params.get('lat')).toBe(String(ORAS_OBSERVATORY_COORDINATES.latitude))
    expect(params.get('lng')).toBe(String(ORAS_OBSERVATORY_COORDINATES.longitude))
    expect(params.get('elev')).toBe(String(ORAS_OBSERVATORY_COORDINATES.elevationMeters))
    expect(params.get('fov')).toBe('120')
  })
})