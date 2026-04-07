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

  it('round-trips an orthographic azimuthal view through the viewport transform', () => {
    const centerDirection = horizontalToDirection(86, 12)
    const targetDirection = horizontalToDirection(72, 38)
    const view = {
      centerDirection,
      fovRadians: (110 * Math.PI) / 180,
      viewportWidth: 1440,
      viewportHeight: 900,
      projectionMode: 'orthographic',
    }

    const projected = projectDirectionToViewport(targetDirection, view)

    expect(projected).not.toBeNull()

    const restoredDirection = unprojectViewportPoint(projected.screenX, projected.screenY, view)

    expect(Vector3.Dot(restoredDirection, targetDirection)).toBeCloseTo(1, 5)
  })

  it('round-trips a wide immersive viewport without breaking projection recovery', () => {
    const centerDirection = horizontalToDirection(18, 132)
    const targetDirection = horizontalToDirection(26, 178)
    const view = {
      centerDirection,
      fovRadians: (100 * Math.PI) / 180,
      viewportWidth: 1920,
      viewportHeight: 900,
    }

    const projected = projectDirectionToViewport(targetDirection, view)

    expect(projected).not.toBeNull()
    expect(projected.screenX).toBeGreaterThan(view.viewportWidth * 0.5)

    const restoredDirection = unprojectViewportPoint(projected.screenX, projected.screenY, view)

    expect(Vector3.Dot(restoredDirection, targetDirection)).toBeCloseTo(1, 5)
  })

  it('keeps equal angular offsets circular at extreme wide FOV on a wide viewport', () => {
    const centerDirection = horizontalToDirection(0, 0)
    const eastTarget = horizontalToDirection(0, 45)
    const northTarget = horizontalToDirection(45, 0)
    const view = {
      centerDirection,
      fovRadians: (185 * Math.PI) / 180,
      viewportWidth: 1600,
      viewportHeight: 900,
    }

    const eastProjected = projectDirectionToViewport(eastTarget, view)
    const northProjected = projectDirectionToViewport(northTarget, view)

    expect(eastProjected).not.toBeNull()
    expect(northProjected).not.toBeNull()

    const eastRadius = Math.hypot(eastProjected.screenX - view.viewportWidth * 0.5, eastProjected.screenY - view.viewportHeight * 0.5)
    const northRadius = Math.hypot(northProjected.screenX - view.viewportWidth * 0.5, northProjected.screenY - view.viewportHeight * 0.5)

    expect(eastRadius).toBeCloseTo(northRadius, 5)
  })
})