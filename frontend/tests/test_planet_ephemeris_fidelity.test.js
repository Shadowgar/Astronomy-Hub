import { describe, expect, it } from 'vitest'

import { computeMoonSceneObject, computePlanetSceneObjects } from '../src/features/sky-engine/astronomy'

const TEST_OBSERVER = {
  label: 'ORAS Observatory',
  latitude: 41.321903,
  longitude: -79.585394,
  elevationFt: 1420,
}

describe('planet ephemeris fidelity upgrade', () => {
  it('includes major planets through a timestamp-driven ephemeris path', () => {
    const planets = computePlanetSceneObjects(TEST_OBSERVER, '2026-04-12T03:00:00Z')
    const ids = new Set(planets.map((planet) => planet.id))

    expect(planets.length).toBeGreaterThanOrEqual(7)
    expect(ids.has('sky-planet-mercury')).toBe(true)
    expect(ids.has('sky-planet-venus')).toBe(true)
    expect(ids.has('sky-planet-mars')).toBe(true)
    expect(ids.has('sky-planet-jupiter')).toBe(true)
    expect(ids.has('sky-planet-saturn')).toBe(true)
    expect(ids.has('sky-planet-uranus')).toBe(true)
    expect(ids.has('sky-planet-neptune')).toBe(true)
    expect(planets.every((planet) => planet.source === 'computed_ephemeris')).toBe(true)
    expect(planets.every((planet) => Number.isFinite(planet.magnitude))).toBe(true)
    expect(planets.every((planet) => Number.isFinite(planet.apparentSizeDeg ?? Number.NaN))).toBe(true)
  })

  it('changes planetary placement and brightness over time', () => {
    const early = computePlanetSceneObjects(TEST_OBSERVER, '2026-04-12T03:00:00Z')
    const later = computePlanetSceneObjects(TEST_OBSERVER, '2026-04-19T03:00:00Z')
    const earlyJupiter = early.find((planet) => planet.id === 'sky-planet-jupiter')
    const laterJupiter = later.find((planet) => planet.id === 'sky-planet-jupiter')
    const earlyVenus = early.find((planet) => planet.id === 'sky-planet-venus')
    const laterVenus = later.find((planet) => planet.id === 'sky-planet-venus')

    expect(earlyJupiter).toBeTruthy()
    expect(laterJupiter).toBeTruthy()
    expect(earlyVenus).toBeTruthy()
    expect(laterVenus).toBeTruthy()
    expect(Math.abs(earlyJupiter.altitudeDeg - laterJupiter.altitudeDeg)).toBeGreaterThan(0.2)
    expect(Math.abs(earlyJupiter.azimuthDeg - laterJupiter.azimuthDeg)).toBeGreaterThan(0.2)
    expect(Math.abs(earlyVenus.magnitude - laterVenus.magnitude)).toBeGreaterThan(0.01)
  })

  it('uses dynamic moon distance for apparent size and magnitude', () => {
    const near = computeMoonSceneObject(TEST_OBSERVER, '2026-01-03T03:00:00Z')
    const far = computeMoonSceneObject(TEST_OBSERVER, '2026-01-17T03:00:00Z')

    expect(near.apparentSizeDeg).toBeTruthy()
    expect(far.apparentSizeDeg).toBeTruthy()
    expect(Math.abs((near.apparentSizeDeg ?? 0) - (far.apparentSizeDeg ?? 0))).toBeGreaterThan(0.01)
    expect(Math.abs(near.magnitude - far.magnitude)).toBeGreaterThan(0.05)
  })
})

