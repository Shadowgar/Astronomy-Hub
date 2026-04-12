import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  SKY_ENGINE_CONSTELLATION_SEGMENTS,
  getSkyEngineSkyCulture,
  resolveSkyCultureConstellationLabel,
} from '../src/features/sky-engine/constellations'

const CONSTELLATIONS_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/constellations.ts')
const OVERLAY_SOURCE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/directOverlayLayer.ts')

describe('skyculture constellation data port', () => {
  it('loads constellation segments from skyculture datasets instead of handcrafted stubs', () => {
    const culture = getSkyEngineSkyCulture()
    const totalSegments = SKY_ENGINE_CONSTELLATION_SEGMENTS.reduce((count, constellation) => count + constellation.pairs.length, 0)

    expect(culture.id).toBe('western')
    expect(culture.constellations.length).toBeGreaterThanOrEqual(80)
    expect(totalSegments).toBeGreaterThan(600)
    expect(SKY_ENGINE_CONSTELLATION_SEGMENTS.every((constellation) => constellation.pairs.length > 0)).toBe(true)
    expect(
      SKY_ENGINE_CONSTELLATION_SEGMENTS.every((constellation) =>
        constellation.pairs.every(([left, right]) => left.startsWith('hip-') && right.startsWith('hip-')),
      ),
    ).toBe(true)
  })

  it('supports runtime skyculture switching with distinct constellation datasets', () => {
    const western = getSkyEngineSkyCulture('western')
    const belarusian = getSkyEngineSkyCulture('belarusian')
    const westernSegments = western.constellations.reduce((count, constellation) => count + constellation.pairs.length, 0)
    const belarusianSegments = belarusian.constellations.reduce((count, constellation) => count + constellation.pairs.length, 0)

    expect(western.id).toBe('western')
    expect(belarusian.id).toBe('belarusian')
    expect(western.constellations.length).toBeGreaterThan(belarusian.constellations.length)
    expect(westernSegments).toBeGreaterThan(belarusianSegments)
  })

  it('uses bounded constellation label fallback policy: native -> english -> pronounce -> identifier', () => {
    expect(resolveSkyCultureConstellationLabel({
      id: 'fallback-a',
      iau: 'FA',
      commonName: {
        native: 'Native Name',
        english: 'English Name',
        pronounce: 'Pronounce Name',
      },
      lines: [],
    })).toBe('Native Name')

    expect(resolveSkyCultureConstellationLabel({
      id: 'fallback-b',
      iau: 'FB',
      commonName: {
        native: null,
        english: 'English Name',
        pronounce: 'Pronounce Name',
      },
      lines: [],
    })).toBe('English Name')

    expect(resolveSkyCultureConstellationLabel({
      id: 'fallback-c',
      iau: null,
      commonName: {
        native: null,
        english: null,
        pronounce: 'Pronounce Name',
      },
      lines: [],
    })).toBe('Pronounce Name')
  })

  it('removes handcrafted constellation segment definitions from constellations.ts', () => {
    const source = fs.readFileSync(CONSTELLATIONS_SOURCE_PATH, 'utf8')

    expect(source).toContain('SKY_ENGINE_SKYCULTURES')
    expect(source).toContain('convertLineStripToPairs')
    expect(source).not.toContain('summer-triangle')
    expect(source).not.toContain('cygnus-stem')
  })

  it('integrates constellation labels into the overlay label pipeline', () => {
    const overlaySource = fs.readFileSync(OVERLAY_SOURCE_PATH, 'utf8')

    expect(overlaySource).toContain('constellation-label-')
    expect(overlaySource).toContain('anchorObjectId')
    expect(overlaySource).toContain('constellationLabels.forEach')
    expect(overlaySource).toContain('getSkyEngineSkyCulture(skyCultureId).constellations')
  })
})
