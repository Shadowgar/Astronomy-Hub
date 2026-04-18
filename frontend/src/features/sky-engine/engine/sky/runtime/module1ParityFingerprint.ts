/**
 * Stable fingerprint for `SkyTileRepositoryLoadResult` (module1 / HiPS-tile path, G4).
 * Sorts tiles and stars for order-independence; fixed decimal rounding for FP stability.
 */

import type { SkyTilePayload, SkyTileRepositoryLoadResult } from '../contracts/tiles'

const DECIMALS = 12

function q(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(DECIMALS))
}

function fingerprintStar(star: SkyTilePayload['stars'][number]): string {
  const pieces = [
    star.id,
    q(star.raDeg),
    q(star.decDeg),
    q(star.mag),
    star.tier,
    star.catalog ?? '',
    star.sourceId ?? '',
    q(star.pmRaMasYr ?? Number.NaN),
    q(star.pmDecMasYr ?? Number.NaN),
    q(star.parallaxMas ?? Number.NaN),
    q(star.colorIndex ?? Number.NaN),
    star.properName ?? '',
    star.bayer ?? '',
    star.flamsteed ?? '',
    star.flags != null ? String(star.flags) : '',
  ]
  return pieces.join(',')
}

function fingerprintTile(tile: SkyTilePayload): string {
  const b = tile.bounds
  const labelCandidates = [...(tile.labelCandidates ?? [])]
    .sort((a, c) => a.starId.localeCompare(c.starId))
    .map((c) => `${c.starId}:${c.label}:${c.priority}`)
  const stars = [...tile.stars]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(fingerprintStar)
  const prov = tile.provenance
  const provPieces = prov
    ? [
        prov.catalog,
        prov.sourcePath ?? '',
        prov.generator ?? '',
        prov.generatedAt ?? '',
        String(prov.sourceRecordCount ?? ''),
        (prov.tierSet ?? []).slice().sort().join('+'),
      ]
    : ['', '', '', '', '', '']

  const pieces = [
    tile.tileId,
    String(tile.level),
    tile.parentTileId ?? '',
    [...tile.childTileIds].slice().sort().join('+'),
    q(b.raMinDeg),
    q(b.raMaxDeg),
    q(b.decMinDeg),
    q(b.decMaxDeg),
    q(tile.magMin),
    q(tile.magMax),
    String(tile.starCount),
    stars.join(';'),
    labelCandidates.join(';'),
    ...provPieces,
  ]
  return pieces.join('|')
}

/**
 * Canonical string for a tile load result. Two structurally equivalent results (after sort) MUST match.
 */
export function computeModule1TileLoadFingerprint(result: SkyTileRepositoryLoadResult): string {
  const m = result.manifest
  const manifestPieces = m
    ? [
        m.schemaVersion,
        m.catalog,
        m.tileIndex,
        m.generatedAt,
        m.generator,
        m.sourcePath,
        String(m.sourceRecordCount),
        String(m.maxLevel),
        String(m.tileCount),
        String(m.totalStarRecords),
      ]
    : []

  const tiles = [...result.tiles]
    .sort((a, b) => a.tileId.localeCompare(b.tileId))
    .map(fingerprintTile)

  const head = [
    result.mode,
    result.sourceLabel,
    result.sourceError ?? '',
    ...manifestPieces,
  ]

  return [...head, ...tiles].join('::')
}
