export interface DssPatchRecord {
  readonly id: string
  readonly name: string
  readonly rightAscensionHours: number
  readonly declinationDeg: number
  readonly radiusDeg: number
  readonly intensity: number
}

export interface DssSurveyRecord {
  readonly id: string
  readonly title: string
  readonly hipsServiceUrl?: string
  readonly frame?: string
  readonly tileFormat?: string
  readonly visibleByDefault: boolean
}

export interface DssManifestPayload {
  readonly source: string
  readonly generated_at: string
  readonly surveys: readonly DssSurveyRecord[]
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

function parseDssSurveyRecord(value: unknown): DssSurveyRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'string' || typeof candidate.title !== 'string') {
    return null
  }
  if (candidate.hipsServiceUrl !== undefined && typeof candidate.hipsServiceUrl !== 'string') {
    return null
  }
  if (candidate.frame !== undefined && typeof candidate.frame !== 'string') {
    return null
  }
  if (candidate.tileFormat !== undefined && typeof candidate.tileFormat !== 'string') {
    return null
  }
  if (candidate.visibleByDefault !== undefined && typeof candidate.visibleByDefault !== 'boolean') {
    return null
  }
  return {
    id: candidate.id,
    title: candidate.title,
    hipsServiceUrl: candidate.hipsServiceUrl as string | undefined,
    frame: candidate.frame as string | undefined,
    tileFormat: candidate.tileFormat as string | undefined,
    visibleByDefault: candidate.visibleByDefault ?? true,
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
  const surveys: DssSurveyRecord[] = []
  if (candidate.surveys !== undefined) {
    if (!Array.isArray(candidate.surveys)) {
      return null
    }
    for (const survey of candidate.surveys) {
      const parsedSurvey = parseDssSurveyRecord(survey)
      if (!parsedSurvey) {
        return null
      }
      surveys.push(parsedSurvey)
    }
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
    surveys,
    patches,
  }
}

let cachedManifestPromise: Promise<DssManifestPayload> | null = null

export async function loadDssManifest(): Promise<DssManifestPayload> {
  cachedManifestPromise ??= fetch(DSS_MANIFEST_PATH)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`DSS manifest load failed (${response.status})`)
      }
      const payload = parseDssManifestPayload(await response.json())
      if (!payload) {
        throw new Error('DSS manifest parse failed')
      }
      return payload
    })
    .catch((error) => {
      cachedManifestPromise = null
      throw error
    })
  return cachedManifestPromise
}

export async function loadDssPatches(): Promise<readonly DssPatchRecord[]> {
  const manifest = await loadDssManifest()
  return manifest.patches
}
