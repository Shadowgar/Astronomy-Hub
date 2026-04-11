import type { ObserverSnapshot } from '../contracts/observer'
import type { SkyRuntimeTier } from '../contracts/stars'
import { SKY_RUNTIME_TIER_MAG_MAX } from './magnitudePolicy'

export function resolveActiveTiers(_observer: ObserverSnapshot, limitingMagnitude: number): SkyRuntimeTier[] {
  const activeTiers: SkyRuntimeTier[] = ['T0']

  if (limitingMagnitude > SKY_RUNTIME_TIER_MAG_MAX.T0) {
    activeTiers.push('T1')
  }

  if (limitingMagnitude > SKY_RUNTIME_TIER_MAG_MAX.T1) {
    activeTiers.push('T2')
  }

  if (limitingMagnitude > SKY_RUNTIME_TIER_MAG_MAX.T2) {
    activeTiers.push('T3')
  }

  return activeTiers
}