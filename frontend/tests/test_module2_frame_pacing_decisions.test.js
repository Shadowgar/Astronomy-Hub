import { describe, expect, it } from 'vitest'

import {
  STARS_C_CENTER_REPROJECT_THRESHOLD_RAD,
  STARS_C_FOV_REPROJECT_THRESHOLD_DEG,
  STARS_C_LIMIT_MAG_REPROJECT_THRESHOLD,
  STARS_C_MAX_PROJECTION_REUSE_STREAK,
  STARS_C_SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS,
  buildStarsCFramePacingFixtureTraceRows,
  buildStarsCFramePacingStepSummary,
  computeStarsCFramePacingFixtureDigest,
  computeStarsCFramePacingSingleStepDigest,
  computeStarsCFramePacingTraceDigest,
  createStarsCFramePacingFixtureModelSyncNext,
  createStarsCFramePacingFixtureModelSyncState,
  createStarsCFramePacingFixtureOverlayNext,
  createStarsCFramePacingFixtureOverlayState,
  createStarsCFramePacingFixtureProjectionCache,
  createStarsCFramePacingFixtureProjectionNext,
  evaluateOverlayCadenceDecision,
  evaluateRuntimeModelSyncDecision,
  evaluateStarsProjectionReuseDecision,
  explainOverlayCadenceDecision,
  explainProjectionReuseDecision,
  explainRuntimeModelSyncDecision,
  runStarsCFramePacingStep,
} from '../src/features/sky-engine/engine/sky/adapters/framePacingDecisions'

describe('module2 stars.c frame pacing port', () => {
  it('keeps exported thresholds aligned with runtime expectations', () => {
    expect(STARS_C_CENTER_REPROJECT_THRESHOLD_RAD).toBe(0.0035)
    expect(STARS_C_FOV_REPROJECT_THRESHOLD_DEG).toBe(0.35)
    expect(STARS_C_LIMIT_MAG_REPROJECT_THRESHOLD).toBe(0.02)
    expect(STARS_C_SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS).toBe(250)
    expect(STARS_C_MAX_PROJECTION_REUSE_STREAK).toBe(6)
  })

  it('reuses projection cache when deltas are under threshold and streak allows', () => {
    const cache = createStarsCFramePacingFixtureProjectionCache()
    const next = createStarsCFramePacingFixtureProjectionNext()

    const decision = evaluateStarsProjectionReuseDecision({
      previousProjectionCache: cache,
      next,
      starsProjectionReuseStreak: 1,
    })

    expect(decision.isProjectionCacheReusable).toBe(true)
    expect(decision.shouldReuseProjection).toBe(true)
    expect(decision.exceededReuseStreak).toBe(false)
    expect(decision.centerDeltaRad).toBeLessThanOrEqual(STARS_C_CENTER_REPROJECT_THRESHOLD_RAD)
    expect(decision.fovDeltaDeg).toBeLessThanOrEqual(STARS_C_FOV_REPROJECT_THRESHOLD_DEG)
    expect(decision.limitingMagnitudeDelta).toBeLessThanOrEqual(STARS_C_LIMIT_MAG_REPROJECT_THRESHOLD)
    expect(decision.sceneTimestampDeltaMs).toBeLessThanOrEqual(STARS_C_SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS)
  })

  it('blocks projection reuse when streak is exhausted even if cache is reusable', () => {
    const cache = createStarsCFramePacingFixtureProjectionCache()
    const next = createStarsCFramePacingFixtureProjectionNext()

    const decision = evaluateStarsProjectionReuseDecision({
      previousProjectionCache: cache,
      next,
      starsProjectionReuseStreak: STARS_C_MAX_PROJECTION_REUSE_STREAK,
    })

    expect(decision.isProjectionCacheReusable).toBe(true)
    expect(decision.exceededReuseStreak).toBe(true)
    expect(decision.shouldReuseProjection).toBe(false)
  })

  it('invalidates projection reuse when timestamp drift exceeds window', () => {
    const cache = createStarsCFramePacingFixtureProjectionCache({ sceneTimestampMs: 1000 })
    const next = createStarsCFramePacingFixtureProjectionNext({
      sceneTimestampMs: 1300,
    })

    const decision = evaluateStarsProjectionReuseDecision({
      previousProjectionCache: cache,
      next,
      starsProjectionReuseStreak: 0,
    })

    expect(decision.isSceneTimestampReusable).toBe(false)
    expect(decision.isProjectionCacheReusable).toBe(false)
    expect(decision.shouldReuseProjection).toBe(false)
  })

  it('forces overlay sync on signature changes and detects azimuth wrap view change', () => {
    const state = createStarsCFramePacingFixtureOverlayState()

    const forceSync = evaluateOverlayCadenceDecision(
      state,
      createStarsCFramePacingFixtureOverlayNext(state, {
        guidedSignature: 'a|c',
      }),
    )
    expect(forceSync.forceSync).toBe(true)
    expect(forceSync.shouldSync).toBe(true)

    const viewSync = evaluateOverlayCadenceDecision(
      state,
      createStarsCFramePacingFixtureOverlayNext(state, {
        centerAzTenths: 0,
      }),
    )
    expect(viewSync.forceSync).toBe(false)
    expect(viewSync.significantViewChange).toBe(true)
    expect(viewSync.shouldSync).toBe(true)
  })

  it('runtime model sync only increments version on force or signature drift', () => {
    const state = createStarsCFramePacingFixtureModelSyncState()

    const same = evaluateRuntimeModelSyncDecision(
      state,
      createStarsCFramePacingFixtureModelSyncNext(state),
    )
    expect(same.shouldSyncProps).toBe(false)
    expect(same.nextPropsVersion).toBe(state.lastPropsVersion)

    const changed = evaluateRuntimeModelSyncDecision(
      state,
      createStarsCFramePacingFixtureModelSyncNext(state, {
        propsSignature: 'sig:changed',
      }),
    )
    expect(changed.shouldSyncProps).toBe(true)
    expect(changed.nextPropsVersion).toBe(state.lastPropsVersion + 1)

    const forced = evaluateRuntimeModelSyncDecision(
      state,
      createStarsCFramePacingFixtureModelSyncNext(state, {
        force: true,
      }),
    )
    expect(forced.shouldSyncProps).toBe(true)
    expect(forced.nextPropsVersion).toBe(state.lastPropsVersion + 1)
  })

  it('runs an integrated frame pacing step and exposes deterministic summaries', () => {
    const projectionCache = createStarsCFramePacingFixtureProjectionCache()
    const overlayState = createStarsCFramePacingFixtureOverlayState()
    const modelSyncState = createStarsCFramePacingFixtureModelSyncState()

    const result = runStarsCFramePacingStep({
      projection: {
        previousProjectionCache: projectionCache,
        next: createStarsCFramePacingFixtureProjectionNext(),
        starsProjectionReuseStreak: 1,
      },
      overlay: {
        previous: overlayState,
        next: createStarsCFramePacingFixtureOverlayNext(overlayState),
      },
      modelSync: {
        previous: modelSyncState,
        next: createStarsCFramePacingFixtureModelSyncNext(modelSyncState),
      },
    })

    expect(result.projectionDecision.shouldReuseProjection).toBe(true)
    expect(result.overlayDecision.shouldSync).toBe(false)
    expect(result.modelSyncDecision.shouldSyncProps).toBe(false)
    expect(result.nextProjectionReuseStreak).toBe(2)

    const summary = buildStarsCFramePacingStepSummary(result)
    expect(summary).toContain('projection[')
    expect(summary).toContain('overlay[')
    expect(summary).toContain('model[')
  })

  it('produces stable fixture trace rows and deterministic digest outputs', () => {
    const rows = buildStarsCFramePacingFixtureTraceRows()
    expect(rows).toHaveLength(3)

    const traceDigest = computeStarsCFramePacingTraceDigest({ rows })
    expect(traceDigest).toContain('i:0')
    expect(traceDigest).toContain('i:1')
    expect(traceDigest).toContain('i:2')

    const fixtureDigest = computeStarsCFramePacingFixtureDigest()
    expect(fixtureDigest).toBe(traceDigest)

    const singleDigestA = computeStarsCFramePacingSingleStepDigest()
    const singleDigestB = computeStarsCFramePacingSingleStepDigest()
    expect(singleDigestA).toBe(singleDigestB)
    expect(singleDigestA.length).toBeGreaterThan(40)
  })

  it('returns human-readable explanations for projection, overlay, and model decisions', () => {
    const projectionDecision = evaluateStarsProjectionReuseDecision({
      previousProjectionCache: createStarsCFramePacingFixtureProjectionCache(),
      next: createStarsCFramePacingFixtureProjectionNext(),
      starsProjectionReuseStreak: 1,
    })
    const projectionReasons = explainProjectionReuseDecision(projectionDecision)
    expect(projectionReasons.some((entry) => entry.startsWith('cache-reuse:'))).toBe(true)
    expect(projectionReasons.some((entry) => entry.startsWith('center-delta:'))).toBe(true)

    const overlayState = createStarsCFramePacingFixtureOverlayState()
    const overlayDecision = evaluateOverlayCadenceDecision(
      overlayState,
      createStarsCFramePacingFixtureOverlayNext(overlayState, {
        centerAzTenths: 0,
      }),
    )
    const overlayReasons = explainOverlayCadenceDecision(overlayDecision)
    expect(overlayReasons).toContain('force-sync:0')
    expect(overlayReasons).toContain('view-change:1')

    const modelDecision = evaluateRuntimeModelSyncDecision(
      createStarsCFramePacingFixtureModelSyncState(),
      createStarsCFramePacingFixtureModelSyncNext(createStarsCFramePacingFixtureModelSyncState(), {
        force: true,
      }),
    )
    const modelReasons = explainRuntimeModelSyncDecision(modelDecision)
    expect(modelReasons).toContain('props-sync:1')
    expect(modelReasons.some((entry) => entry.startsWith('props-version:'))).toBe(true)
  })
})
