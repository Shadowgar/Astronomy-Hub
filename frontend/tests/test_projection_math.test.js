import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { describe, expect, it } from 'vitest'

import {
  horizontalToDirection,
  projectDirectionToViewport,
  unprojectViewportPoint,
} from '../src/features/sky-engine/projectionMath.ts'

describe('Sky Engine stereographic projection', () => {
  it('round-trips a projected sky direction through the viewport transform', () => {
    const centerDirection = horizontalToDirection(34, 220)
    const targetDirection = horizontalToDirection(51, 243)
    const view = {
      centerDirection,
      fovRadians: (75 * Math.PI) / 180,
      viewportWidth: 1440,
      viewportHeight: 900,
    }

    const projected = projectDirectionToViewport(targetDirection, view)

    expect(projected).not.toBeNull()

    const restoredDirection = unprojectViewportPoint(projected.screenX, projected.screenY, view)

    expect(Vector3.Dot(restoredDirection, targetDirection)).toBeCloseTo(1, 5)
  })
})