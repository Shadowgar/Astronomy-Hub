import { DEFAULT_SKY_ENGINE_SKYCULTURE_ID, SKY_ENGINE_SKYCULTURES } from './skycultures'
import type {
  SkyCultureBoundaryDefinition,
  SkyCultureConstellationDefinition,
  SkyCultureDefinition,
} from './skycultures/types'

export interface SkyEngineConstellationBoundarySegment {
  readonly id: string
  readonly leftIau: string
  readonly rightIau: string
  readonly startRightAscensionHours: number
  readonly startDeclinationDeg: number
  readonly endRightAscensionHours: number
  readonly endDeclinationDeg: number
}

export interface SkyEngineConstellationImageMetadata {
  readonly file: string
  readonly anchorStarIds: readonly string[]
}

export interface SkyEngineConstellationNameMetadata {
  readonly english: string | null
  readonly native: string | null
  readonly pronounce: string | null
  readonly resolvedLabel: string
}

export interface SkyEngineConstellationSegment {
  readonly id: string
  readonly label: string
  readonly canonicalCode: string
  readonly cultureId: string
  readonly cultureRegion: string | null
  readonly description: string | null
  readonly names: SkyEngineConstellationNameMetadata
  readonly representativeAnchorStarId: string | null
  readonly image: SkyEngineConstellationImageMetadata | null
  readonly anchorStarIds: readonly string[]
  readonly boundarySegments: readonly SkyEngineConstellationBoundarySegment[]
  readonly pairs: readonly (readonly [string, string])[]
}

export interface SkyEngineSkyCulture {
  readonly id: string
  readonly region: string | null
  readonly fallbackToInternationalNames: boolean
  readonly langsUseNativeNames: readonly string[]
  readonly boundaries: readonly SkyEngineConstellationBoundarySegment[]
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

function getSkyCultureConstellationCode(constellation: SkyCultureConstellationDefinition) {
  return constellation.iau ?? constellation.id
}

function convertBoundarySegment(boundary: SkyCultureBoundaryDefinition): SkyEngineConstellationBoundarySegment {
  return {
    id: boundary.id,
    leftIau: boundary.leftIau,
    rightIau: boundary.rightIau,
    startRightAscensionHours: boundary.start.rightAscensionHours,
    startDeclinationDeg: boundary.start.declinationDeg,
    endRightAscensionHours: boundary.end.rightAscensionHours,
    endDeclinationDeg: boundary.end.declinationDeg,
  }
}

function normalizeConstellationCodeKey(code: string) {
  return code.trim().toUpperCase()
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

function extractAnchorIds(constellation: SkyCultureConstellationDefinition) {
  const anchors = new Set<string>()
  constellation.lines.forEach((line) => {
    line.forEach((hip) => {
      if (Number.isFinite(hip)) {
        anchors.add(toHipId(hip))
      }
    })
  })
  constellation.image?.anchors.forEach((anchor) => {
    if (Number.isFinite(anchor.hip)) {
      anchors.add(toHipId(anchor.hip))
    }
  })
  return Array.from(anchors)
}

function buildBoundaryMap(boundaries: readonly SkyCultureBoundaryDefinition[]) {
  const byConstellationCode = new Map<string, SkyEngineConstellationBoundarySegment[]>()
  const convertedBoundaries = boundaries.map((boundary) => convertBoundarySegment(boundary))

  convertedBoundaries.forEach((boundary) => {
    const constellationCodes = [boundary.leftIau, boundary.rightIau]
    constellationCodes.forEach((constellationCode) => {
      const normalizedCode = normalizeConstellationCodeKey(constellationCode)
      const current = byConstellationCode.get(normalizedCode) ?? []
      current.push(boundary)
      byConstellationCode.set(normalizedCode, current)
    })
  })

  return {
    byConstellationCode,
    convertedBoundaries,
  }
}

function convertSkyCultureConstellation(
  cultureId: string,
  cultureRegion: string | null,
  constellation: SkyCultureConstellationDefinition,
  boundariesByConstellationCode: ReadonlyMap<string, readonly SkyEngineConstellationBoundarySegment[]>,
): SkyEngineConstellationSegment {
  const pairs = constellation.lines.flatMap((line) => convertLineStripToPairs(line))
  const label = resolveSkyCultureConstellationLabel(constellation)
  const canonicalCode = getSkyCultureConstellationCode(constellation)
  const anchorStarIds = extractAnchorIds(constellation)
  const representativeAnchorStarId = constellation.image?.anchors[0]?.hip
    ? toHipId(constellation.image.anchors[0].hip)
    : (anchorStarIds[0] ?? null)
  const imageAnchorStarIds = constellation.image?.anchors.map((anchor) => toHipId(anchor.hip)) ?? []

  return {
    id: `${normalizeId(cultureId)}-${normalizeId(constellation.id)}`,
    cultureId,
    label,
    canonicalCode,
    cultureRegion,
    description: constellation.description,
    names: {
      english: constellation.commonName.english,
      native: constellation.commonName.native,
      pronounce: constellation.commonName.pronounce,
      resolvedLabel: label,
    },
    representativeAnchorStarId,
    image: constellation.image
      ? {
          file: constellation.image.file,
          anchorStarIds: imageAnchorStarIds,
        }
      : null,
    anchorStarIds,
    boundarySegments: boundariesByConstellationCode.get(normalizeConstellationCodeKey(canonicalCode)) ?? [],
    pairs,
  }
}

function convertSkyCulture(culture: SkyCultureDefinition): SkyEngineSkyCulture {
  const { byConstellationCode, convertedBoundaries } = buildBoundaryMap(culture.boundaries)

  return {
    id: culture.id,
    region: culture.region,
    fallbackToInternationalNames: culture.fallbackToInternationalNames,
    langsUseNativeNames: culture.langsUseNativeNames,
    boundaries: convertedBoundaries,
    constellations: culture.constellations.map((constellation) =>
      convertSkyCultureConstellation(culture.id, culture.region, constellation, byConstellationCode),
    ),
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
