import type { ObserverSnapshot } from '../contracts/observer'
import {
  createObserverAstrometrySnapshot,
  type ObserverAstrometrySnapshot,
} from '../transforms/coordinates'
import { stellariumFrameAstrometryFromEraAstrom } from './erfaAbLdsun'
import type { SkyObserverDerivedGeometry } from './observerDerivedGeometry'

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
