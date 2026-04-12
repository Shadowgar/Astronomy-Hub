import type { SkyEngineAidVisibility } from './types'

const SKY_ENGINE_AID_VISIBILITY_STORAGE_KEY = 'astronomyHub.skyEngine.aidVisibility'

export const DEFAULT_SKY_ENGINE_AID_VISIBILITY: SkyEngineAidVisibility = {
  constellations: false,
  azimuthRing: false,
  altitudeRings: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function normalizePersistedAidVisibility(value: unknown): SkyEngineAidVisibility {
  if (!isRecord(value)) {
    return DEFAULT_SKY_ENGINE_AID_VISIBILITY
  }

  return {
    constellations: value.constellations === true,
    azimuthRing: value.azimuthRing === true,
    altitudeRings: value.altitudeRings === true,
  }
}

export function readPersistedAidVisibility(): SkyEngineAidVisibility {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return DEFAULT_SKY_ENGINE_AID_VISIBILITY
  }

  try {
    const storedValue = globalThis.localStorage.getItem(SKY_ENGINE_AID_VISIBILITY_STORAGE_KEY)

    if (!storedValue) {
      return DEFAULT_SKY_ENGINE_AID_VISIBILITY
    }

    return normalizePersistedAidVisibility(JSON.parse(storedValue))
  } catch {
    return DEFAULT_SKY_ENGINE_AID_VISIBILITY
  }
}

export function persistAidVisibility(aidVisibility: SkyEngineAidVisibility) {
  if (typeof globalThis === 'undefined' || !globalThis.localStorage) {
    return
  }

  try {
    globalThis.localStorage.setItem(
      SKY_ENGINE_AID_VISIBILITY_STORAGE_KEY,
      JSON.stringify(normalizePersistedAidVisibility(aidVisibility)),
    )
  } catch {
    // Ignore persistence failures caused by privacy mode or quota limits.
  }
}