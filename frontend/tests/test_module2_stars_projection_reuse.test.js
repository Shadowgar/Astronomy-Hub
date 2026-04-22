import { describe, expect, it } from 'vitest'

import { horizontalToDirection } from '../src/features/sky-engine/projectionMath'
import { evaluateStarsProjectionReuse } from '../src/features/sky-engine/engine/sky/runtime/modules/StarsModule'

function buildCache() {
  return {
    sceneTimestampMs: 1000,
    width: 1280,
    height: 720,
    objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
    centerDirection: horizontalToDirection(35, 135),
    fovDegrees: 30,
    limitingMagnitude: 6.3,
    projectedStars: [],
  }
}

describe('module2 stars projection cache reuse', () => {
  it('reuses cached projection only inside thresholds and below reuse-streak cap', () => {
    const reusable = evaluateStarsProjectionReuse({
      previousProjectionCache: buildCache(),
      next: {
        objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
        width: 1280,
        height: 720,
        centerDirection: horizontalToDirection(35.04, 135.03),
        fovDegrees: 30.08,
        limitingMagnitude: 6.31,
        sceneTimestampMs: 1180,
      },
      starsProjectionReuseStreak: 1,
    })

    expect(reusable.isProjectionCacheReusable).toBe(true)
    expect(reusable.shouldReuseProjection).toBe(true)
  })

  it('forces reproject when reuse streak reaches cap', () => {
    const blockedByStreak = evaluateStarsProjectionReuse({
      previousProjectionCache: buildCache(),
      next: {
        objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
        width: 1280,
        height: 720,
        centerDirection: horizontalToDirection(35.04, 135.03),
        fovDegrees: 30.08,
        limitingMagnitude: 6.31,
        sceneTimestampMs: 1180,
      },
      starsProjectionReuseStreak: 2,
    })

    expect(blockedByStreak.isProjectionCacheReusable).toBe(true)
    expect(blockedByStreak.shouldReuseProjection).toBe(false)
  })

  it('forces reproject when timestamp delta exceeds threshold', () => {
    const staleTimestamp = evaluateStarsProjectionReuse({
      previousProjectionCache: buildCache(),
      next: {
        objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
        width: 1280,
        height: 720,
        centerDirection: horizontalToDirection(35.04, 135.03),
        fovDegrees: 30.08,
        limitingMagnitude: 6.31,
        sceneTimestampMs: 1301,
      },
      starsProjectionReuseStreak: 0,
    })

    expect(staleTimestamp.isSceneTimestampReusable).toBe(false)
    expect(staleTimestamp.isProjectionCacheReusable).toBe(false)
    expect(staleTimestamp.shouldReuseProjection).toBe(false)
  })

  it('forces reproject when fov or limiting magnitude drifts above threshold', () => {
    const fovExceeded = evaluateStarsProjectionReuse({
      previousProjectionCache: buildCache(),
      next: {
        objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
        width: 1280,
        height: 720,
        centerDirection: horizontalToDirection(35.04, 135.03),
        fovDegrees: 30.2001,
        limitingMagnitude: 6.31,
        sceneTimestampMs: 1180,
      },
      starsProjectionReuseStreak: 0,
    })
    const limitingMagnitudeExceeded = evaluateStarsProjectionReuse({
      previousProjectionCache: buildCache(),
      next: {
        objectSignature: 'obj:3:a:c::packet:3|s0:a:1.000|s1:c:8.000|lim:7.000|visible:3|tiles:2:1',
        width: 1280,
        height: 720,
        centerDirection: horizontalToDirection(35.04, 135.03),
        fovDegrees: 30.08,
        limitingMagnitude: 6.3201,
        sceneTimestampMs: 1180,
      },
      starsProjectionReuseStreak: 0,
    })

    expect(fovExceeded.isProjectionCacheReusable).toBe(false)
    expect(fovExceeded.shouldReuseProjection).toBe(false)
    expect(limitingMagnitudeExceeded.isProjectionCacheReusable).toBe(false)
    expect(limitingMagnitudeExceeded.shouldReuseProjection).toBe(false)
  })
})
