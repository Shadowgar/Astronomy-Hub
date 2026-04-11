import { describe, expect, it } from 'vitest'
import { NullEngine } from '@babylonjs/core/Engines/nullEngine'
import { Scene } from '@babylonjs/core/scene'

import { createDirectStarLayer } from '../src/features/sky-engine/directStarLayer'

if (!globalThis.OffscreenCanvas) {
  class FakeGradient {
    addColorStop() {}
  }

  class FakeRenderingContext2D {
    fillStyle = '#000000'
    strokeStyle = '#000000'
    lineWidth = 1

    createRadialGradient() {
      return new FakeGradient()
    }

    clearRect() {}

    beginPath() {}

    arc() {}

    fill() {}

    stroke() {}
  }

  globalThis.OffscreenCanvas = class {
    constructor(width, height) {
      this.width = width
      this.height = height
      this._context = new FakeRenderingContext2D()
    }

    getContext() {
      return this._context
    }
  }
}

function buildProjectedStars(count) {
  return Array.from({ length: count }, (_, index) => ({
    object: {
      id: `star-${index + 1}`,
      type: 'star',
      colorHex: '#ffffff',
      magnitude: 2,
    },
    screenX: (index * 7) % 1280,
    screenY: (index * 11) % 720,
    depth: 0.1 + (index % 10) * 0.01,
    angularDistanceRad: 0.2,
    markerRadiusPx: 2.2,
    pickRadiusPx: 10,
    renderAlpha: 0.8,
    renderedMagnitude: 2,
    visibilityAlpha: 0.8,
    starProfile: {
      colorHex: '#ffffff',
      alpha: 0.45,
      psfDiameterPx: 4.2,
      twinkleAmplitude: 0.02,
    },
  }))
}

describe('Direct star layer metrics', () => {
  it('uses bounded Babylon resources while scaling star count', () => {
    const engine = new NullEngine()
    const scene = new Scene(engine)
    const layer = createDirectStarLayer(scene)

    const projectedStars = buildProjectedStars(303)
    const t0 = performance.now()
    layer.sync(projectedStars, 1280, 720, null, 1.2)
    const t1 = performance.now()
    const firstSyncMs = t1 - t0

    const largerProjectedStars = buildProjectedStars(1500)
    const t2 = performance.now()
    layer.sync(largerProjectedStars, 1280, 720, null, 2.4)
    const t3 = performance.now()
    const secondSyncMs = t3 - t2

    const starMeshCount = scene.meshes.filter((mesh) => mesh.name.startsWith('sky-engine-star-')).length
    const starMaterialCount = scene.materials.filter((material) => material.name.startsWith('sky-engine-star-')).length
    const starTextureCount = scene.textures.filter((texture) => texture.name.startsWith('sky-engine-star-')).length

    const metrics = {
      scenario: 'direct-star-layer',
      firstSyncStars: 303,
      firstSyncMs: Number(firstSyncMs.toFixed(3)),
      secondSyncStars: 1500,
      secondSyncMs: Number(secondSyncMs.toFixed(3)),
      starMeshCount,
      starMaterialCount,
      starTextureCount,
    }
    console.log(JSON.stringify(metrics))

    expect(starMeshCount).toBe(2)
    expect(starMaterialCount).toBe(2)
    expect(starTextureCount).toBe(2)

    layer.dispose()
    scene.dispose()
    engine.dispose()
  })
})
