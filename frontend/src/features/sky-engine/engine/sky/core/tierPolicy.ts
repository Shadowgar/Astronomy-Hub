import type { ObserverSnapshot } from '../contracts/observer'
import type { SkyRuntimeTier } from '../contracts/stars'
import { formatSkyRuntimeTier, SKY_RUNTIME_TIER_MAG_MAX } from './magnitudePolicy'

export function resolveActiveTiers(_observer: ObserverSnapshot, limitingMagnitude: number): SkyRuntimeTier[] {
  const activeTiers: SkyRuntimeTier[] = [formatSkyRuntimeTier(0)]

  SKY_RUNTIME_TIER_MAG_MAX.forEach((maxMagnitude, index) => {
    if (limitingMagnitude > maxMagnitude) {
      activeTiers.push(formatSkyRuntimeTier(index + 1))
    }
  })

  return activeTiers
}