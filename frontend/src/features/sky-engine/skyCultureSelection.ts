import { DEFAULT_SKY_ENGINE_SKYCULTURE_ID, SKY_ENGINE_SKYCULTURES } from './skycultures'

const SKY_ENGINE_SKYCULTURE_STORAGE_KEY = 'astronomyHub.skyEngine.skyCultureId'

export function isKnownSkyCultureId(cultureId: string): boolean {
  return Object.prototype.hasOwnProperty.call(SKY_ENGINE_SKYCULTURES, cultureId)
}

export function normalizeSkyCultureId(cultureId: string | null | undefined): string {
  if (!cultureId) {
    return DEFAULT_SKY_ENGINE_SKYCULTURE_ID
  }

  return isKnownSkyCultureId(cultureId) ? cultureId : DEFAULT_SKY_ENGINE_SKYCULTURE_ID
}

export function readPersistedSkyCultureId(): string {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return DEFAULT_SKY_ENGINE_SKYCULTURE_ID
  }

  try {
    const storedValue = globalThis.localStorage.getItem(SKY_ENGINE_SKYCULTURE_STORAGE_KEY)
    return normalizeSkyCultureId(storedValue)
  } catch {
    return DEFAULT_SKY_ENGINE_SKYCULTURE_ID
  }
}

export function persistSkyCultureId(cultureId: string) {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return
  }

  try {
    globalThis.localStorage.setItem(SKY_ENGINE_SKYCULTURE_STORAGE_KEY, normalizeSkyCultureId(cultureId))
  } catch {
    // Ignore persistence failures caused by privacy mode or quota limits.
  }
}
