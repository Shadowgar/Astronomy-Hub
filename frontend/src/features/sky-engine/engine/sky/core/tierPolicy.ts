import type { ObserverSnapshot } from '../contracts/observer'
import type { SkyRuntimeTier } from '../contracts/stars'

export function resolveActiveTiers(observer: ObserverSnapshot, limitingMagnitude: number): SkyRuntimeTier[] {
  const activeTiers: SkyRuntimeTier[] = ['T0', 'T1']

  if (limitingMagnitude >= 8.5 || observer.fovDeg <= 40) {
    activeTiers.push('T2')
  }

  if (limitingMagnitude >= 12.0 || observer.fovDeg <= 5) {
    activeTiers.push('T3')
  }

  return activeTiers
}