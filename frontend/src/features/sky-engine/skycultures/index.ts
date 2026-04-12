import { BELARUSIAN_SKYCULTURE } from './belarusian'
import { WESTERN_SKYCULTURE } from './western'
import type { SkyCultureDefinition } from './types'

export const SKY_ENGINE_SKYCULTURES: Readonly<Record<string, SkyCultureDefinition>> = {
  [WESTERN_SKYCULTURE.id]: WESTERN_SKYCULTURE,
  [BELARUSIAN_SKYCULTURE.id]: BELARUSIAN_SKYCULTURE,
}

export const DEFAULT_SKY_ENGINE_SKYCULTURE_ID = WESTERN_SKYCULTURE.id
