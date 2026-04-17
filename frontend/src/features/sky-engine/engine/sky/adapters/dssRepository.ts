export interface DssPatchRecord {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly radiusDeg: number
  readonly intensity: number
}

interface DssManifestPayload {
  readonly source: string
  readonly generated_at: string
  readonly patches: readonly DssPatchRecord[]
}

const DSS_MANIFEST_PATH = '/sky-engine-assets/catalog/dss/manifest.json'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseDssPatchRecord(value: unknown): DssPatchRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !isFiniteNumber(candidate.rightAscensionHours) ||
    !isFiniteNumber(candidate.declinationDeg) ||
    !isFiniteNumber(candidate.radiusDeg) ||
    !isFiniteNumber(candidate.intensity)
  ) {
    return null
  }
  return {
    id: candidate.id,
    name: candidate.name,
    rightAscensionHours: candidate.rightAscensionHours,
    declinationDeg: candidate.declinationDeg,
    radiusDeg: candidate.radiusDeg,
    intensity: candidate.intensity,
  }
}

function parseDssManifestPayload(value: unknown): DssManifestPayload | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.source !== 'string' ||
    typeof candidate.generated_at !== 'string' ||
    !Array.isArray(candidate.patches)
  ) {
    return null
  }
  const patches: DssPatchRecord[] = []
  for (const patch of candidate.patches) {
    const parsed = parseDssPatchRecord(patch)
    if (!parsed) {
      return null
    }
    patches.push(parsed)
  }
  return {
    source: candidate.source,
    generated_at: candidate.generated_at,
    patches,
  }
}

let cachedManifestPromise: Promise<readonly DssPatchRecord[]> | null = null

export async function loadDssPatches(): Promise<readonly DssPatchRecord[]> {
  cachedManifestPromise ??= fetch(DSS_MANIFEST_PATH)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`DSS manifest load failed (${response.status})`)
      }
      const payload = parseDssManifestPayload(await response.json())
      if (!payload) {
        throw new Error('DSS manifest parse failed')
      }
      return payload.patches
    })
    .catch((error) => {
      cachedManifestPromise = null
      throw error
    })
  return cachedManifestPromise
}
