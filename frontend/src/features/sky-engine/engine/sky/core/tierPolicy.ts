import type { ObserverSnapshot } from '../contracts/observer'
import type { SkyRuntimeTier } from '../contracts/stars'

export function resolveActiveTiers(observer: ObserverSnapshot, limitingMagnitude: number): SkyRuntimeTier[] {
  const activeTiers: SkyRuntimeTier[] = ['T0', 'T1']

  if (limitingMagnitude >= 6.4 || observer.fovDeg <= 40) {
    activeTiers.push('T2')
  }

  if (limitingMagnitude >= 10.8 || observer.fovDeg <= 5) {
    activeTiers.push('T3')
  }

  return activeTiers
}