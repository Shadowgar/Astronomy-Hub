/**
 * Stable, text-only fingerprint of Module 0 observer-derived geometry for deterministic replay (G4 / BLK-000).
 * Excludes wall-clock; inputs are observer + scene ISO only. Uses fixed decimal rounding for FP stability.
 */

import type { SkyEngineObserver } from '../../../types'
import { deriveObserverGeometry, type SkyObserverDerivedGeometry } from './observerDerivedGeometry'

const DECIMALS = 12

function q(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(DECIMALS))
}

type Matrix3 = SkyObserverDerivedGeometry['matrices']['ri2h']

function matrixFlat(m: Matrix3): string {
  const out: number[] = []
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      out.push(q(m[i][j]))
    }
  }
  return out.join(',')
}

/**
 * Canonical string for `(observer, sceneTimestampIso)` with `updateMode === 'full'` and `previous === null`.
 * Two calls with the same arguments MUST yield identical strings on a given build (Vitest replay contract).
 */
export function computeModule0ObserverGeometryFingerprint(
  observer: SkyEngineObserver,
  sceneTimestampIso: string,
): string {
  const g = deriveObserverGeometry(observer, sceneTimestampIso, 'full', null)
  const m = g.matrices
  const pm = g.polarMotion
  const seam = g.observerSeam
  const mjd = g.timeModifiedJulianDate
  const cip = g.cipRad
  const pieces = [
    sceneTimestampIso,
    observer.label,
    q(observer.latitude),
    q(observer.longitude),
    q(observer.elevationFt),
    g.updateMode,
    q(g.utcJulianDate),
    q(g.ttJulianDate),
    q(g.ut1JulianDate),
    q(g.dut1Seconds),
    q(g.latitudeRad),
    q(g.longitudeRad),
    q(g.elevationMeters),
    q(g.localSiderealTimeDeg),
    q(g.refraction.refA),
    q(g.refraction.refB),
    matrixFlat(m.ri2h),
    matrixFlat(m.rh2i),
    matrixFlat(m.ro2v),
    matrixFlat(m.rv2o),
    matrixFlat(m.ri2v),
    matrixFlat(m.rc2v),
    matrixFlat(m.bpn),
    matrixFlat(m.icrsToHorizontal),
    matrixFlat(m.horizontalToIcrs),
    matrixFlat(m.ri2e),
    matrixFlat(m.re2i),
    q(g.earthPv[0]),
    q(g.earthPv[1]),
    q(g.earthPv[2]),
    q(g.sunPv[0]),
    q(g.sunPv[1]),
    q(g.sunPv[2]),
    g.lastAccurateSceneTimestampIso,
    q(pm.xpRad),
    q(pm.ypRad),
    q(pm.xplRad),
    q(pm.yplRad),
    q(seam.elongRad),
    q(seam.phiRad),
    q(seam.hmMeters),
    q(seam.eralRad),
    q(mjd.tt),
    q(mjd.utc),
    q(mjd.ut1),
    q(cip.x),
    q(cip.y),
    q(g.cioLocatorSRad),
    q(g.equationOfOriginsRad),
  ]
  return pieces.join('|')
}
