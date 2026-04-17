import type { DeepSkyDefinition } from '../../../astronomy'

export interface DsoCatalogPayload {
  readonly source: string
  readonly generated_at: string
  readonly objects: readonly DeepSkyDefinition[]
}

const DSO_CATALOG_PATH = '/sky-engine-assets/catalog/dso/catalog.json'

let cachedPromise: Promise<readonly DeepSkyDefinition[]> | null = null

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseObject(value: unknown): DeepSkyDefinition | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const v = value as Record<string, unknown>
  if (
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    !isFiniteNumber(v.rightAscensionHours) ||
    !isFiniteNumber(v.declinationDeg) ||
    !isFiniteNumber(v.magnitude) ||
    !isFiniteNumber(v.apparentSizeDeg) ||
    typeof v.deepSkyClass !== 'string' ||
    !isFiniteNumber(v.orientationDeg) ||
    !isFiniteNumber(v.majorAxis) ||
    !isFiniteNumber(v.minorAxis) ||
    typeof v.colorHex !== 'string' ||
    typeof v.constellation !== 'string' ||
    typeof v.summary !== 'string' ||
    typeof v.description !== 'string'
  ) {
    return null
  }
  return {
    id: v.id,
    name: v.name,
    rightAscensionHours: v.rightAscensionHours,
    declinationDeg: v.declinationDeg,
    magnitude: v.magnitude,
    apparentSizeDeg: v.apparentSizeDeg,
    deepSkyClass: v.deepSkyClass as DeepSkyDefinition['deepSkyClass'],
    orientationDeg: v.orientationDeg,
    majorAxis: v.majorAxis,
    minorAxis: v.minorAxis,
    colorHex: v.colorHex,
    constellation: v.constellation,
    summary: v.summary,
    description: v.description,
  }
}

function parsePayload(value: unknown): DsoCatalogPayload | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const v = value as Record<string, unknown>
  if (typeof v.source !== 'string' || typeof v.generated_at !== 'string' || !Array.isArray(v.objects)) {
    return null
  }
  const objects: DeepSkyDefinition[] = []
  for (const object of v.objects) {
    const parsed = parseObject(object)
    if (!parsed) {
      return null
    }
    objects.push(parsed)
  }
  return {
    source: v.source,
    generated_at: v.generated_at,
    objects,
  }
}

export async function loadDsoCatalog(): Promise<readonly DeepSkyDefinition[]> {
  cachedPromise ??= fetch(DSO_CATALOG_PATH)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`DSO catalog load failed (${response.status})`)
      }
      const payload = parsePayload(await response.json())
      if (!payload) {
        throw new Error('DSO catalog parse failed')
      }
      return payload.objects
    })
    .catch((error) => {
      cachedPromise = null
      throw error
    })
  return cachedPromise
}
