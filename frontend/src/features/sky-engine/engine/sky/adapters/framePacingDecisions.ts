export const STARS_C_CENTER_REPROJECT_THRESHOLD_RAD = 0.002
export const STARS_C_FOV_REPROJECT_THRESHOLD_DEG = 0.2
export const STARS_C_LIMIT_MAG_REPROJECT_THRESHOLD = 0.02
export const STARS_C_SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS = 250
export const STARS_C_MAX_PROJECTION_REUSE_STREAK = 2

export type StarsCFrameVector3 = {
  readonly x: number
  readonly y: number
  readonly z: number
}

export type StarsCProjectionCacheEntry<TProjected = unknown> = {
  readonly sceneTimestampMs: number
  readonly width: number
  readonly height: number
  readonly objectSignature: string
  readonly centerDirection: StarsCFrameVector3
  readonly fovDegrees: number
  readonly limitingMagnitude: number
  readonly projectedStars: readonly TProjected[]
}

export type StarsCProjectionReuseNext = {
  objectSignature: string
  width: number
  height: number
  centerDirection: StarsCFrameVector3
  fovDegrees: number
  limitingMagnitude: number
  sceneTimestampMs: number
}

export type StarsCProjectionReuseDecision = {
  readonly centerDeltaRad: number
  readonly fovDeltaDeg: number
  readonly limitingMagnitudeDelta: number
  readonly sceneTimestampDeltaMs: number
  readonly isSceneTimestampReusable: boolean
  readonly isProjectionCacheReusable: boolean
  readonly shouldReuseProjection: boolean
  readonly exceededReuseStreak: boolean
}

export type StarsCOverlayCadenceState = {
  lastSyncAtMs: number
  lastPropsVersion: number
  lastSelectedObjectId: string | null
  lastAidSignature: string
  lastGuidedSignature: string
  lastSunPhaseLabel: string
  lastCenterAltTenths: number
  lastCenterAzTenths: number
  lastFovTenths: number
  lastViewportWidth: number
  lastViewportHeight: number
  lastProjectedObjectsRef: unknown
  lastHintsLimitMag: number
}

export type StarsCOverlayCadenceNext = {
  propsVersion: number
  selectedObjectId: string | null
  aidSignature: string
  guidedSignature: string
  sunPhaseLabel: string
  centerAltTenths: number
  centerAzTenths: number
  fovTenths: number
  viewportWidth: number
  viewportHeight: number
  projectedObjectsRef: unknown
  hintsLimitMag: number
}

export type StarsCOverlayCadenceDecision = {
  forceSync: boolean
  significantViewChange: boolean
  shouldSync: boolean
}

export type StarsCRuntimeModelSyncState = {
  readonly lastPropsSignature: string
  readonly lastPropsVersion: number
}

export type StarsCRuntimeModelSyncNext = {
  readonly force: boolean
  readonly propsSignature: string
}

export type StarsCRuntimeModelSyncDecision = {
  readonly shouldSyncProps: boolean
  readonly nextPropsVersion: number
}

export type StarsCFramePacingStepInput<TProjected = unknown> = {
  readonly projection: {
    readonly previousProjectionCache: StarsCProjectionCacheEntry<TProjected> | null
    readonly next: StarsCProjectionReuseNext
    readonly starsProjectionReuseStreak: number
  }
  readonly overlay: {
    readonly previous: StarsCOverlayCadenceState
    readonly next: StarsCOverlayCadenceNext
  }
  readonly modelSync: {
    readonly previous: StarsCRuntimeModelSyncState
    readonly next: StarsCRuntimeModelSyncNext
  }
}

export type StarsCFramePacingStepResult<TProjected = unknown> = {
  readonly projectionDecision: StarsCProjectionReuseDecision
  readonly overlayDecision: StarsCOverlayCadenceDecision
  readonly modelSyncDecision: StarsCRuntimeModelSyncDecision
  readonly nextProjectionCache: StarsCProjectionCacheEntry<TProjected> | null
  readonly nextProjectionReuseStreak: number
  readonly nextOverlayState: StarsCOverlayCadenceState
  readonly nextModelSyncState: StarsCRuntimeModelSyncState
}

export type StarsCFramePacingTraceRow = {
  readonly index: number
  readonly projectionShouldReuse: boolean
  readonly projectionCacheReusable: boolean
  readonly projectionCenterDelta: number
  readonly projectionFovDelta: number
  readonly projectionMagDelta: number
  readonly projectionTimeDelta: number
  readonly projectionStreakBlocked: boolean
  readonly overlayForceSync: boolean
  readonly overlayViewChange: boolean
  readonly overlayShouldSync: boolean
  readonly modelShouldSync: boolean
  readonly modelVersion: number
}

export type StarsCFramePacingTraceDigestInput = {
  readonly rows: readonly StarsCFramePacingTraceRow[]
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function q(value: number) {
  if (!Number.isFinite(value)) {
    return 'nan'
  }
  return value.toFixed(6)
}

function angleDeltaRadians(left: StarsCFrameVector3, right: StarsCFrameVector3) {
  const dot = left.x * right.x + left.y * right.y + left.z * right.z
  return Math.acos(clamp(dot, -1, 1))
}

function circularDeltaTenths(currentValue: number, previousValue: number) {
  const directDelta = Math.abs(currentValue - previousValue)
  return Math.min(directDelta, 3600 - directDelta)
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value)
}

function normalizeFiniteOrInfinity(value: number) {
  return isFiniteNumber(value) ? value : Number.POSITIVE_INFINITY
}

function normalizeProjectionCache<TProjected>(
  previousProjectionCache: StarsCProjectionCacheEntry<TProjected> | null,
): StarsCProjectionCacheEntry<TProjected> | null {
  if (!previousProjectionCache) {
    return null
  }

  return {
    sceneTimestampMs: previousProjectionCache.sceneTimestampMs,
    width: previousProjectionCache.width,
    height: previousProjectionCache.height,
    objectSignature: previousProjectionCache.objectSignature,
    centerDirection: {
      x: previousProjectionCache.centerDirection.x,
      y: previousProjectionCache.centerDirection.y,
      z: previousProjectionCache.centerDirection.z,
    },
    fovDegrees: previousProjectionCache.fovDegrees,
    limitingMagnitude: previousProjectionCache.limitingMagnitude,
    projectedStars: previousProjectionCache.projectedStars,
  }
}

function normalizeOverlayState(previous: StarsCOverlayCadenceState): StarsCOverlayCadenceState {
  return {
    lastSyncAtMs: previous.lastSyncAtMs,
    lastPropsVersion: previous.lastPropsVersion,
    lastSelectedObjectId: previous.lastSelectedObjectId,
    lastAidSignature: previous.lastAidSignature,
    lastGuidedSignature: previous.lastGuidedSignature,
    lastSunPhaseLabel: previous.lastSunPhaseLabel,
    lastCenterAltTenths: previous.lastCenterAltTenths,
    lastCenterAzTenths: previous.lastCenterAzTenths,
    lastFovTenths: previous.lastFovTenths,
    lastViewportWidth: previous.lastViewportWidth,
    lastViewportHeight: previous.lastViewportHeight,
    lastProjectedObjectsRef: previous.lastProjectedObjectsRef,
    lastHintsLimitMag: previous.lastHintsLimitMag,
  }
}

function normalizeModelSyncState(previous: StarsCRuntimeModelSyncState): StarsCRuntimeModelSyncState {
  return {
    lastPropsSignature: previous.lastPropsSignature,
    lastPropsVersion: previous.lastPropsVersion,
  }
}

export function evaluateStarsProjectionReuseDecision<TProjected>(params: {
  previousProjectionCache: StarsCProjectionCacheEntry<TProjected> | null
  next: StarsCProjectionReuseNext
  starsProjectionReuseStreak: number
}): StarsCProjectionReuseDecision {
  const previousProjectionCache = normalizeProjectionCache(params.previousProjectionCache)
  const centerDeltaRad = previousProjectionCache
    ? angleDeltaRadians(previousProjectionCache.centerDirection, params.next.centerDirection)
    : Number.POSITIVE_INFINITY
  const fovDeltaDeg = previousProjectionCache
    ? Math.abs(previousProjectionCache.fovDegrees - params.next.fovDegrees)
    : Number.POSITIVE_INFINITY
  const limitingMagnitudeDelta = previousProjectionCache
    ? Math.abs(previousProjectionCache.limitingMagnitude - params.next.limitingMagnitude)
    : Number.POSITIVE_INFINITY
  const sceneTimestampDeltaMs = previousProjectionCache
    ? Math.abs(previousProjectionCache.sceneTimestampMs - params.next.sceneTimestampMs)
    : Number.POSITIVE_INFINITY

  const isSceneTimestampReusable =
    !isFiniteNumber(sceneTimestampDeltaMs) || sceneTimestampDeltaMs <= STARS_C_SCENE_TIMESTAMP_REPROJECT_THRESHOLD_MS

  const isProjectionCacheReusable = Boolean(
    previousProjectionCache?.objectSignature === params.next.objectSignature &&
    isSceneTimestampReusable &&
    previousProjectionCache?.width === params.next.width &&
    previousProjectionCache?.height === params.next.height &&
    fovDeltaDeg <= STARS_C_FOV_REPROJECT_THRESHOLD_DEG &&
    limitingMagnitudeDelta <= STARS_C_LIMIT_MAG_REPROJECT_THRESHOLD &&
    centerDeltaRad <= STARS_C_CENTER_REPROJECT_THRESHOLD_RAD,
  )

  const exceededReuseStreak = params.starsProjectionReuseStreak >= STARS_C_MAX_PROJECTION_REUSE_STREAK
  const shouldReuseProjection = isProjectionCacheReusable && !exceededReuseStreak

  return {
    centerDeltaRad,
    fovDeltaDeg,
    limitingMagnitudeDelta,
    sceneTimestampDeltaMs,
    isSceneTimestampReusable,
    isProjectionCacheReusable,
    shouldReuseProjection,
    exceededReuseStreak,
  }
}

export function evaluateOverlayCadenceDecision(
  previous: StarsCOverlayCadenceState,
  next: StarsCOverlayCadenceNext,
): StarsCOverlayCadenceDecision {
  const normalizedPrevious = normalizeOverlayState(previous)

  const forceSync =
    normalizedPrevious.lastSyncAtMs === 0 ||
    next.propsVersion !== normalizedPrevious.lastPropsVersion ||
    next.selectedObjectId !== normalizedPrevious.lastSelectedObjectId ||
    next.aidSignature !== normalizedPrevious.lastAidSignature ||
    next.guidedSignature !== normalizedPrevious.lastGuidedSignature ||
    next.sunPhaseLabel !== normalizedPrevious.lastSunPhaseLabel ||
    next.projectedObjectsRef !== normalizedPrevious.lastProjectedObjectsRef ||
    next.hintsLimitMag !== normalizedPrevious.lastHintsLimitMag ||
    next.viewportWidth !== normalizedPrevious.lastViewportWidth ||
    next.viewportHeight !== normalizedPrevious.lastViewportHeight

  const significantViewChange =
    Number.isNaN(normalizedPrevious.lastCenterAltTenths) ||
    next.centerAltTenths !== normalizedPrevious.lastCenterAltTenths ||
    circularDeltaTenths(next.centerAzTenths, normalizedPrevious.lastCenterAzTenths) > 0 ||
    next.fovTenths !== normalizedPrevious.lastFovTenths

  return {
    forceSync,
    significantViewChange,
    shouldSync: forceSync || significantViewChange,
  }
}

export function evaluateRuntimeModelSyncDecision(
  previous: StarsCRuntimeModelSyncState,
  next: StarsCRuntimeModelSyncNext,
): StarsCRuntimeModelSyncDecision {
  const normalizedPrevious = normalizeModelSyncState(previous)
  const shouldSyncProps = next.force || next.propsSignature !== normalizedPrevious.lastPropsSignature
  const nextPropsVersion = shouldSyncProps
    ? normalizedPrevious.lastPropsVersion + 1
    : normalizedPrevious.lastPropsVersion

  return {
    shouldSyncProps,
    nextPropsVersion,
  }
}

export function runStarsCFramePacingStep<TProjected>(
  input: StarsCFramePacingStepInput<TProjected>,
): StarsCFramePacingStepResult<TProjected> {
  const projectionDecision = evaluateStarsProjectionReuseDecision(input.projection)
  const overlayDecision = evaluateOverlayCadenceDecision(
    input.overlay.previous,
    input.overlay.next,
  )
  const modelSyncDecision = evaluateRuntimeModelSyncDecision(
    input.modelSync.previous,
    input.modelSync.next,
  )

  const nextProjectionCache = projectionDecision.shouldReuseProjection
    ? normalizeProjectionCache(input.projection.previousProjectionCache)
    : {
        sceneTimestampMs: input.projection.next.sceneTimestampMs,
        width: input.projection.next.width,
        height: input.projection.next.height,
        objectSignature: input.projection.next.objectSignature,
        centerDirection: {
          x: input.projection.next.centerDirection.x,
          y: input.projection.next.centerDirection.y,
          z: input.projection.next.centerDirection.z,
        },
        fovDegrees: input.projection.next.fovDegrees,
        limitingMagnitude: input.projection.next.limitingMagnitude,
        projectedStars: input.projection.previousProjectionCache?.projectedStars ?? [],
      }

  const nextProjectionReuseStreak = projectionDecision.shouldReuseProjection
    ? input.projection.starsProjectionReuseStreak + 1
    : 0

  const nextOverlayState: StarsCOverlayCadenceState = overlayDecision.shouldSync
    ? {
        lastSyncAtMs: Math.max(1, input.overlay.previous.lastSyncAtMs + 1),
        lastPropsVersion: input.overlay.next.propsVersion,
        lastSelectedObjectId: input.overlay.next.selectedObjectId,
        lastAidSignature: input.overlay.next.aidSignature,
        lastGuidedSignature: input.overlay.next.guidedSignature,
        lastSunPhaseLabel: input.overlay.next.sunPhaseLabel,
        lastCenterAltTenths: input.overlay.next.centerAltTenths,
        lastCenterAzTenths: input.overlay.next.centerAzTenths,
        lastFovTenths: input.overlay.next.fovTenths,
        lastViewportWidth: input.overlay.next.viewportWidth,
        lastViewportHeight: input.overlay.next.viewportHeight,
        lastProjectedObjectsRef: input.overlay.next.projectedObjectsRef,
        lastHintsLimitMag: input.overlay.next.hintsLimitMag,
      }
    : normalizeOverlayState(input.overlay.previous)

  const nextModelSyncState: StarsCRuntimeModelSyncState = modelSyncDecision.shouldSyncProps
    ? {
        lastPropsSignature: input.modelSync.next.propsSignature,
        lastPropsVersion: modelSyncDecision.nextPropsVersion,
      }
    : normalizeModelSyncState(input.modelSync.previous)

  return {
    projectionDecision,
    overlayDecision,
    modelSyncDecision,
    nextProjectionCache,
    nextProjectionReuseStreak,
    nextOverlayState,
    nextModelSyncState,
  }
}

function digestProjectionRow(row: StarsCFramePacingTraceRow) {
  return [
    `pr:${row.projectionShouldReuse ? '1' : '0'}`,
    `pc:${row.projectionCacheReusable ? '1' : '0'}`,
    `pd:${q(row.projectionCenterDelta)}`,
    `pf:${q(row.projectionFovDelta)}`,
    `pm:${q(row.projectionMagDelta)}`,
    `pt:${q(row.projectionTimeDelta)}`,
    `ps:${row.projectionStreakBlocked ? '1' : '0'}`,
  ].join(':')
}

function digestOverlayRow(row: StarsCFramePacingTraceRow) {
  return [
    `of:${row.overlayForceSync ? '1' : '0'}`,
    `ov:${row.overlayViewChange ? '1' : '0'}`,
    `os:${row.overlayShouldSync ? '1' : '0'}`,
  ].join(':')
}

function digestModelRow(row: StarsCFramePacingTraceRow) {
  return [
    `ms:${row.modelShouldSync ? '1' : '0'}`,
    `mv:${row.modelVersion}`,
  ].join(':')
}

function digestRow(row: StarsCFramePacingTraceRow) {
  return [
    `i:${row.index}`,
    digestProjectionRow(row),
    digestOverlayRow(row),
    digestModelRow(row),
  ].join('|')
}

export function computeStarsCFramePacingTraceDigest(input: StarsCFramePacingTraceDigestInput) {
  return input.rows.map((row) => digestRow(row)).join('||')
}

export function buildStarsCFramePacingTraceRows<TProjected>(params: {
  readonly initialProjectionCache: StarsCProjectionCacheEntry<TProjected> | null
  readonly initialProjectionReuseStreak: number
  readonly initialOverlayState: StarsCOverlayCadenceState
  readonly initialModelSyncState: StarsCRuntimeModelSyncState
  readonly steps: ReadonlyArray<{
    readonly projectionNext: StarsCProjectionReuseNext
    readonly overlayNext: StarsCOverlayCadenceNext
    readonly modelSyncNext: StarsCRuntimeModelSyncNext
  }>
}): readonly StarsCFramePacingTraceRow[] {
  let projectionCache = normalizeProjectionCache(params.initialProjectionCache)
  let projectionReuseStreak = params.initialProjectionReuseStreak
  let overlayState = normalizeOverlayState(params.initialOverlayState)
  let modelSyncState = normalizeModelSyncState(params.initialModelSyncState)

  const rows: StarsCFramePacingTraceRow[] = []

  params.steps.forEach((step, index) => {
    const result = runStarsCFramePacingStep({
      projection: {
        previousProjectionCache: projectionCache,
        next: step.projectionNext,
        starsProjectionReuseStreak: projectionReuseStreak,
      },
      overlay: {
        previous: overlayState,
        next: step.overlayNext,
      },
      modelSync: {
        previous: modelSyncState,
        next: step.modelSyncNext,
      },
    })

    rows.push({
      index,
      projectionShouldReuse: result.projectionDecision.shouldReuseProjection,
      projectionCacheReusable: result.projectionDecision.isProjectionCacheReusable,
      projectionCenterDelta: normalizeFiniteOrInfinity(result.projectionDecision.centerDeltaRad),
      projectionFovDelta: normalizeFiniteOrInfinity(result.projectionDecision.fovDeltaDeg),
      projectionMagDelta: normalizeFiniteOrInfinity(result.projectionDecision.limitingMagnitudeDelta),
      projectionTimeDelta: normalizeFiniteOrInfinity(result.projectionDecision.sceneTimestampDeltaMs),
      projectionStreakBlocked: result.projectionDecision.exceededReuseStreak,
      overlayForceSync: result.overlayDecision.forceSync,
      overlayViewChange: result.overlayDecision.significantViewChange,
      overlayShouldSync: result.overlayDecision.shouldSync,
      modelShouldSync: result.modelSyncDecision.shouldSyncProps,
      modelVersion: result.modelSyncDecision.nextPropsVersion,
    })

    projectionCache = result.nextProjectionCache
    projectionReuseStreak = result.nextProjectionReuseStreak
    overlayState = result.nextOverlayState
    modelSyncState = result.nextModelSyncState
  })

  return rows
}

function horizontalToDirection(altitudeDeg: number, azimuthDeg: number): StarsCFrameVector3 {
  const altitudeRad = (altitudeDeg * Math.PI) / 180
  const azimuthRad = (azimuthDeg * Math.PI) / 180
  const cosAlt = Math.cos(altitudeRad)
  const x = Math.sin(azimuthRad) * cosAlt
  const y = Math.sin(altitudeRad)
  const z = Math.cos(azimuthRad) * cosAlt
  return { x, y, z }
}

export function createStarsCFramePacingFixtureProjectionCache<TProjected = unknown>(params?: {
  readonly sceneTimestampMs?: number
  readonly width?: number
  readonly height?: number
  readonly objectSignature?: string
  readonly centerAltitudeDeg?: number
  readonly centerAzimuthDeg?: number
  readonly fovDegrees?: number
  readonly limitingMagnitude?: number
  readonly projectedStars?: readonly TProjected[]
}): StarsCProjectionCacheEntry<TProjected> {
  return {
    sceneTimestampMs: params?.sceneTimestampMs ?? 1000,
    width: params?.width ?? 1280,
    height: params?.height ?? 720,
    objectSignature: params?.objectSignature ?? 'obj:fixture:3',
    centerDirection: horizontalToDirection(
      params?.centerAltitudeDeg ?? 35,
      params?.centerAzimuthDeg ?? 135,
    ),
    fovDegrees: params?.fovDegrees ?? 30,
    limitingMagnitude: params?.limitingMagnitude ?? 6.3,
    projectedStars: params?.projectedStars ?? [],
  }
}

export function createStarsCFramePacingFixtureProjectionNext(params?: {
  readonly sceneTimestampMs?: number
  readonly width?: number
  readonly height?: number
  readonly objectSignature?: string
  readonly centerAltitudeDeg?: number
  readonly centerAzimuthDeg?: number
  readonly fovDegrees?: number
  readonly limitingMagnitude?: number
}): StarsCProjectionReuseNext {
  return {
    sceneTimestampMs: params?.sceneTimestampMs ?? 1180,
    width: params?.width ?? 1280,
    height: params?.height ?? 720,
    objectSignature: params?.objectSignature ?? 'obj:fixture:3',
    centerDirection: horizontalToDirection(
      params?.centerAltitudeDeg ?? 35.04,
      params?.centerAzimuthDeg ?? 135.03,
    ),
    fovDegrees: params?.fovDegrees ?? 30.08,
    limitingMagnitude: params?.limitingMagnitude ?? 6.31,
  }
}

export function createStarsCFramePacingFixtureOverlayState(): StarsCOverlayCadenceState {
  return {
    lastSyncAtMs: 1000,
    lastPropsVersion: 4,
    lastSelectedObjectId: 'sel-1',
    lastAidSignature: '1:0:1',
    lastGuidedSignature: 'a|b',
    lastSunPhaseLabel: 'night',
    lastCenterAltTenths: 150,
    lastCenterAzTenths: 3599,
    lastFovTenths: 300,
    lastViewportWidth: 1280,
    lastViewportHeight: 720,
    lastProjectedObjectsRef: { ref: 'same' },
    lastHintsLimitMag: 6.2,
  }
}

export function createStarsCFramePacingFixtureOverlayNext(
  state: StarsCOverlayCadenceState,
  params?: Partial<StarsCOverlayCadenceNext>,
): StarsCOverlayCadenceNext {
  return {
    propsVersion: params?.propsVersion ?? state.lastPropsVersion,
    selectedObjectId: params?.selectedObjectId ?? state.lastSelectedObjectId,
    aidSignature: params?.aidSignature ?? state.lastAidSignature,
    guidedSignature: params?.guidedSignature ?? state.lastGuidedSignature,
    sunPhaseLabel: params?.sunPhaseLabel ?? state.lastSunPhaseLabel,
    centerAltTenths: params?.centerAltTenths ?? state.lastCenterAltTenths,
    centerAzTenths: params?.centerAzTenths ?? state.lastCenterAzTenths,
    fovTenths: params?.fovTenths ?? state.lastFovTenths,
    viewportWidth: params?.viewportWidth ?? state.lastViewportWidth,
    viewportHeight: params?.viewportHeight ?? state.lastViewportHeight,
    projectedObjectsRef: params?.projectedObjectsRef ?? state.lastProjectedObjectsRef,
    hintsLimitMag: params?.hintsLimitMag ?? state.lastHintsLimitMag,
  }
}

export function createStarsCFramePacingFixtureModelSyncState(): StarsCRuntimeModelSyncState {
  return {
    lastPropsSignature: 'sig:base',
    lastPropsVersion: 6,
  }
}

export function createStarsCFramePacingFixtureModelSyncNext(
  state: StarsCRuntimeModelSyncState,
  params?: Partial<StarsCRuntimeModelSyncNext>,
): StarsCRuntimeModelSyncNext {
  return {
    force: params?.force ?? false,
    propsSignature: params?.propsSignature ?? state.lastPropsSignature,
  }
}

export function buildStarsCFramePacingFixtureTraceRows() {
  const projectionCache = createStarsCFramePacingFixtureProjectionCache()
  const overlayState = createStarsCFramePacingFixtureOverlayState()
  const modelSyncState = createStarsCFramePacingFixtureModelSyncState()

  return buildStarsCFramePacingTraceRows({
    initialProjectionCache: projectionCache,
    initialProjectionReuseStreak: 1,
    initialOverlayState: overlayState,
    initialModelSyncState: modelSyncState,
    steps: [
      {
        projectionNext: createStarsCFramePacingFixtureProjectionNext(),
        overlayNext: createStarsCFramePacingFixtureOverlayNext(overlayState),
        modelSyncNext: createStarsCFramePacingFixtureModelSyncNext(modelSyncState),
      },
      {
        projectionNext: createStarsCFramePacingFixtureProjectionNext({
          sceneTimestampMs: 1180,
          fovDegrees: 30.08,
          limitingMagnitude: 6.31,
          centerAltitudeDeg: 35.04,
          centerAzimuthDeg: 135.03,
        }),
        overlayNext: createStarsCFramePacingFixtureOverlayNext(overlayState, {
          centerAzTenths: 0,
        }),
        modelSyncNext: createStarsCFramePacingFixtureModelSyncNext(modelSyncState, {
          propsSignature: 'sig:changed',
        }),
      },
      {
        projectionNext: createStarsCFramePacingFixtureProjectionNext({
          sceneTimestampMs: 1400,
          fovDegrees: 30.3,
          limitingMagnitude: 6.35,
          centerAltitudeDeg: 35.2,
          centerAzimuthDeg: 135.4,
        }),
        overlayNext: createStarsCFramePacingFixtureOverlayNext(overlayState, {
          guidedSignature: 'a|c',
        }),
        modelSyncNext: createStarsCFramePacingFixtureModelSyncNext(modelSyncState, {
          force: true,
          propsSignature: 'sig:forced',
        }),
      },
    ],
  })
}

export function computeStarsCFramePacingFixtureDigest() {
  const rows = buildStarsCFramePacingFixtureTraceRows()
  return computeStarsCFramePacingTraceDigest({ rows })
}

export function asStarsProjectionCacheEntry<TProjected>(
  value: StarsCProjectionCacheEntry<TProjected> | null,
): StarsCProjectionCacheEntry<TProjected> | null {
  return normalizeProjectionCache(value)
}

export function asStarsOverlayCadenceState(value: StarsCOverlayCadenceState): StarsCOverlayCadenceState {
  return normalizeOverlayState(value)
}

export function asStarsRuntimeModelSyncState(value: StarsCRuntimeModelSyncState): StarsCRuntimeModelSyncState {
  return normalizeModelSyncState(value)
}

export function explainProjectionReuseDecision(decision: StarsCProjectionReuseDecision): readonly string[] {
  return [
    decision.shouldReuseProjection ? 'cache-reuse:pass' : 'cache-reuse:fail',
    decision.isProjectionCacheReusable ? 'cache-compatible:1' : 'cache-compatible:0',
    decision.isSceneTimestampReusable ? 'time-window:1' : 'time-window:0',
    decision.exceededReuseStreak ? 'reuse-streak:blocked' : 'reuse-streak:ok',
    `center-delta:${q(decision.centerDeltaRad)}`,
    `fov-delta:${q(decision.fovDeltaDeg)}`,
    `lim-mag-delta:${q(decision.limitingMagnitudeDelta)}`,
    `time-delta:${q(decision.sceneTimestampDeltaMs)}`,
  ]
}

export function explainOverlayCadenceDecision(decision: StarsCOverlayCadenceDecision): readonly string[] {
  return [
    decision.forceSync ? 'force-sync:1' : 'force-sync:0',
    decision.significantViewChange ? 'view-change:1' : 'view-change:0',
    decision.shouldSync ? 'overlay-sync:1' : 'overlay-sync:0',
  ]
}

export function explainRuntimeModelSyncDecision(decision: StarsCRuntimeModelSyncDecision): readonly string[] {
  return [
    decision.shouldSyncProps ? 'props-sync:1' : 'props-sync:0',
    `props-version:${decision.nextPropsVersion}`,
  ]
}

export function buildStarsCFramePacingStepSummary<TProjected>(
  result: StarsCFramePacingStepResult<TProjected>,
): string {
  const projection = explainProjectionReuseDecision(result.projectionDecision).join(',')
  const overlay = explainOverlayCadenceDecision(result.overlayDecision).join(',')
  const model = explainRuntimeModelSyncDecision(result.modelSyncDecision).join(',')
  return `projection[${projection}]|overlay[${overlay}]|model[${model}]`
}

export function createStarsCFramePacingDefaultStepInput<TProjected = unknown>(): StarsCFramePacingStepInput<TProjected> {
  const projectionCache = createStarsCFramePacingFixtureProjectionCache<TProjected>()
  const overlayState = createStarsCFramePacingFixtureOverlayState()
  const modelSyncState = createStarsCFramePacingFixtureModelSyncState()

  return {
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
  }
}

export function computeStarsCFramePacingSingleStepDigest<TProjected = unknown>(
  input?: StarsCFramePacingStepInput<TProjected>,
): string {
  const source = input ?? createStarsCFramePacingDefaultStepInput<TProjected>()
  const result = runStarsCFramePacingStep(source)
  const row: StarsCFramePacingTraceRow = {
    index: 0,
    projectionShouldReuse: result.projectionDecision.shouldReuseProjection,
    projectionCacheReusable: result.projectionDecision.isProjectionCacheReusable,
    projectionCenterDelta: result.projectionDecision.centerDeltaRad,
    projectionFovDelta: result.projectionDecision.fovDeltaDeg,
    projectionMagDelta: result.projectionDecision.limitingMagnitudeDelta,
    projectionTimeDelta: result.projectionDecision.sceneTimestampDeltaMs,
    projectionStreakBlocked: result.projectionDecision.exceededReuseStreak,
    overlayForceSync: result.overlayDecision.forceSync,
    overlayViewChange: result.overlayDecision.significantViewChange,
    overlayShouldSync: result.overlayDecision.shouldSync,
    modelShouldSync: result.modelSyncDecision.shouldSyncProps,
    modelVersion: result.modelSyncDecision.nextPropsVersion,
  }
  return computeStarsCFramePacingTraceDigest({ rows: [row] })
}
