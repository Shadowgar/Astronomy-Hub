import { describe, expect, it } from 'vitest'

import { resolveSelectedObjectWithDetailRoute } from '../src/features/sky-engine/useSkyEngineSelection.ts'

describe('sky engine selection detail-route continuity', () => {
  it('falls back to detailRoute when selected id is missing', () => {
    const objects = [
      {
        id: 'gaia-1',
        name: 'Polaris',
        type: 'star',
        altitudeDeg: 10,
        azimuthDeg: 20,
        magnitude: 1.9,
        colorHex: '#fff',
        summary: 's',
        description: 'd',
        truthNote: 't',
        source: 'engine_catalog_tile',
        trackingMode: 'fixed_equatorial',
        isAboveHorizon: true,
        detailRoute: 'hip/11767',
      },
    ]

    const selected = resolveSelectedObjectWithDetailRoute(
      objects,
      'hip-11767',
      { objectId: 'hip-11767', objectName: 'Polaris', detailRoute: 'hip/11767' },
    )

    expect(selected?.id).toBe('gaia-1')
  })

  it('returns null when neither id nor detailRoute match', () => {
    const selected = resolveSelectedObjectWithDetailRoute(
      [],
      'hip-11767',
      { objectId: 'hip-11767', objectName: 'Polaris', detailRoute: 'hip/11767' },
    )
    expect(selected).toBe(null)
  })
})
