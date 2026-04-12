import { DEFAULT_SKY_ENGINE_SKYCULTURE_ID, SKY_ENGINE_SKYCULTURES } from './skycultures'
import type { SkyCultureConstellationDefinition, SkyCultureDefinition } from './skycultures/types'

export interface SkyEngineConstellationSegment {
  readonly id: string
  readonly label: string
  readonly cultureId: string
  readonly anchorStarIds: readonly string[]
  readonly pairs: readonly (readonly [string, string])[]
}

export interface SkyEngineSkyCulture {
  readonly id: string
  readonly region: string | null
  readonly fallbackToInternationalNames: boolean
  readonly constellations: readonly SkyEngineConstellationSegment[]
}

function normalizeId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toHipId(hip: number) {
  return `hip-${hip}`
}

export function resolveSkyCultureConstellationLabel(constellation: SkyCultureConstellationDefinition) {
  return (
    constellation.commonName.native ??
    constellation.commonName.english ??
    constellation.commonName.pronounce ??
    constellation.iau ??
    constellation.id
  )
}

function convertLineStripToPairs(lineStrip: readonly number[]) {
  const pairs: Array<readonly [string, string]> = []

  for (let index = 1; index < lineStrip.length; index += 1) {
    const left = lineStrip[index - 1]
    const right = lineStrip[index]

    if (!Number.isFinite(left) || !Number.isFinite(right) || left === right) {
      continue
    }

    pairs.push([toHipId(left), toHipId(right)] as const)
  }

  return pairs
}

function extractAnchorIds(lines: readonly (readonly number[])[]) {
  const anchors = new Set<string>()
  lines.forEach((line) => {
    line.forEach((hip) => {
      if (Number.isFinite(hip)) {
        anchors.add(toHipId(hip))
      }
    })
  })
  return Array.from(anchors)
}

function convertSkyCultureConstellation(cultureId: string, constellation: SkyCultureConstellationDefinition): SkyEngineConstellationSegment {
  const pairs = constellation.lines.flatMap((line) => convertLineStripToPairs(line))

  return {
    id: `${normalizeId(cultureId)}-${normalizeId(constellation.id)}`,
    cultureId,
    label: resolveSkyCultureConstellationLabel(constellation),
    anchorStarIds: extractAnchorIds(constellation.lines),
    pairs,
  }
}

function convertSkyCulture(culture: SkyCultureDefinition): SkyEngineSkyCulture {
  return {
    id: culture.id,
    region: culture.region,
    fallbackToInternationalNames: culture.fallbackToInternationalNames,
    constellations: culture.constellations.map((constellation) => convertSkyCultureConstellation(culture.id, constellation)),
  }
}

export const SKY_ENGINE_ACTIVE_SKYCULTURE_ID = DEFAULT_SKY_ENGINE_SKYCULTURE_ID

const SKY_ENGINE_SKYCULTURE_MAP: Readonly<Record<string, SkyEngineSkyCulture>> = Object.fromEntries(
  Object.values(SKY_ENGINE_SKYCULTURES).map((culture) => [culture.id, convertSkyCulture(culture)]),
) as Readonly<Record<string, SkyEngineSkyCulture>>

export function getSkyEngineSkyCulture(cultureId: string = SKY_ENGINE_ACTIVE_SKYCULTURE_ID): SkyEngineSkyCulture {
  const culture = SKY_ENGINE_SKYCULTURE_MAP[cultureId]

  if (culture) {
    return culture
  }

  return SKY_ENGINE_SKYCULTURE_MAP[SKY_ENGINE_ACTIVE_SKYCULTURE_ID]
}

export const SKY_ENGINE_CONSTELLATION_SEGMENTS = getSkyEngineSkyCulture().constellations
