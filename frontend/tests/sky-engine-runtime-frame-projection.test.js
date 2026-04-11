import { describe, expect, it, vi } from 'vitest'

const { projectDirectionToViewportMock } = vi.hoisted(() => ({
  projectDirectionToViewportMock: vi.fn(),
}))

vi.mock('../src/features/sky-engine/atmosphericExtinction', () => ({
  buildAtmosphericExtinctionContext: vi.fn(() => ({ token: 'extinction' })),
  computeObservedMagnitude: vi.fn((magnitude) => magnitude),
}))

vi.mock('../src/features/sky-engine/observerNavigation', () => ({
  getSkyEngineFovDegrees: vi.fn(() => 60),
}))

vi.mock('../src/features/sky-engine/projectionMath', () => ({
  directionToHorizontal: vi.fn(() => ({ altitudeDeg: 25 })),
  getProjectionScale: vi.fn(() => 1),
  horizontalToDirection: vi.fn((altitudeDeg, azimuthDeg) => ({ altitudeDeg, azimuthDeg })),
  isProjectedPointVisible: vi.fn(() => true),
  projectDirectionToViewport: projectDirectionToViewportMock,
}))

vi.mock('../src/features/sky-engine/starRenderer', () => ({
  getStarRenderProfile: vi.fn(() => ({ coreRadiusPx: 1, haloRadiusPx: 2, diameter: 0.4 })),
  getStarRenderProfileForMagnitude: vi.fn(() => ({
    psfDiameterPx: 2.4,
    coreRadiusPx: 1.2,
    haloRadiusPx: 2.2,
    diameter: 0.4,
  })),
}))

vi.mock('../src/features/sky-engine/starVisibility', () => ({
  computeVisibilityAlpha: vi.fn((renderedMagnitude, limitingMagnitude) => (renderedMagnitude <= limitingMagnitude ? 1 : 0)),
  computeVisibilitySizeScale: vi.fn(() => 1),
}))

import { collectProjectedStars } from '../src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame'

function createView() {
  return {
    fovRadians: 1.0,
    centerDirection: { x: 0, y: 0, z: 1 },
    viewportWidth: 1280,
    viewportHeight: 720,
  }
}

describe('collectProjectedStars early exit', () => {
  it('breaks before transform when raw magnitude exceeds limiting magnitude', () => {
    projectDirectionToViewportMock.mockReset()
    projectDirectionToViewportMock.mockReturnValue({
      screenX: 200,
      screenY: 150,
      depth: 0.2,
      angularDistanceRad: 0.1,
    })

    const stars = [
      { id: 'star-bright', type: 'star', source: 'catalog', magnitude: 1.4, altitudeDeg: 40, azimuthDeg: 110, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-dim-1', type: 'star', source: 'catalog', magnitude: 7.1, altitudeDeg: 42, azimuthDeg: 112, colorHex: '#ffffff', colorIndexBV: 0.2 },
      { id: 'star-dim-2', type: 'star', source: 'catalog', magnitude: 8.2, altitudeDeg: 44, azimuthDeg: 114, colorHex: '#ffffff', colorIndexBV: 0.2 },
    ]

    const result = collectProjectedStars(
      createView(),
      { latitudeDeg: 0, longitudeDeg: 0, elevationM: 0 },
      stars,
      null,
      { visualCalibration: { starFieldBrightness: 1 } },
      { limitingMagnitude: 6.0, visualCalibration: { starFieldBrightness: 1 } },
      null,
      '2026-04-11T05:00:00Z',
    )

    expect(result.projectedStars).toHaveLength(1)
    expect(result.projectedStars[0].object.id).toBe('star-bright')
    expect(projectDirectionToViewportMock).toHaveBeenCalledTimes(1)
    expect(result.timing.sortingMs).toBe(0)
  })
})
