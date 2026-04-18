import type { ObserverSnapshot } from '../contracts/observer'
import {
  createObserverAstrometrySnapshot,
  type ObserverAstrometrySnapshot,
} from '../transforms/coordinates'
import { stellariumFrameAstrometryFromEraAstrom } from './erfaAbLdsun'
import type { SkyObserverDerivedGeometry } from './observerDerivedGeometry'

const PROP_SYNC_DECIMALS = 8

function roundForPropSync(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Number(value.toFixed(PROP_SYNC_DECIMALS))
}

/**
 * Compact signature so `SkyCore.syncProps` runs when Module 0 matrices / seam drift
 * while other props fields (selection, aids, …) are unchanged.
 */
export function computeObserverFrameAstrometrySignatureForPropSync(
  snap: ObserverAstrometrySnapshot,
): string {
  const seam = snap.observerSeam
  const m = snap.matrices?.ri2h
  if (!seam || !m) {
    return 'na'
  }
  const flat = m
    .map((row) => row.map((v) => String(roundForPropSync(v))).join(','))
    .join(';')
  return [
    roundForPropSync(seam.eralRad),
    roundForPropSync(seam.phiRad),
    roundForPropSync(seam.elongRad),
    flat,
  ].join(':')
}

/**
 * Full **`ObserverAstrometrySnapshot`** for scene assembly / Milky Way: base refraction + LST from `observer`,
 * matrices + **`stellariumAstrom`** from **`deriveObserverGeometry`** (Module 0 CIO + aberration path).
 */
export function mergeObserverSnapshotWithDerivedGeometry(
  observer: ObserverSnapshot,
  derived: SkyObserverDerivedGeometry,
): ObserverAstrometrySnapshot {
  const base = createObserverAstrometrySnapshot(observer)
  return {
    ...base,
    polarMotion: derived.polarMotion,
    observerSeam: derived.observerSeam,
    stellariumAstrom: stellariumFrameAstrometryFromEraAstrom(derived.astrom),
    matrices: {
      ri2h: derived.matrices.ri2h,
      rh2i: derived.matrices.rh2i,
      icrsToHorizontal: derived.matrices.icrsToHorizontal,
      horizontalToIcrs: derived.matrices.horizontalToIcrs,
    },
  }
}
