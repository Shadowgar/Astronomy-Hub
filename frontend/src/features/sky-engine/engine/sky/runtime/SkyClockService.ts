import type { SkyEngineSceneObject } from '../../../types'

export class SkyClockService {
  private animationTimeSeconds = 0
  private lastFrameDeltaSeconds = 0
  private baseTimestampMs = Date.now()
  private sceneOffsetSeconds = 0
  private playbackRate = 1
  private lastNonZeroPlaybackRate = 1
  private lastSyncedBaseTimestampMs = this.baseTimestampMs

  syncBaseTimestamp(sceneTimestampIso: string | undefined) {
    if (!sceneTimestampIso) {
      return
    }

    const nextBaseTimestampMs = Date.parse(sceneTimestampIso)

    if (Number.isNaN(nextBaseTimestampMs) || nextBaseTimestampMs === this.baseTimestampMs) {
      return
    }

    this.baseTimestampMs = nextBaseTimestampMs
    this.lastSyncedBaseTimestampMs = nextBaseTimestampMs
  }

  syncSceneTimestampFromObjects(objects: readonly SkyEngineSceneObject[]) {
    this.syncBaseTimestamp(objects.find((object) => object.timestampIso)?.timestampIso)
  }

  advanceFrame(deltaSeconds: number) {
    const safeDelta = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0
    this.lastFrameDeltaSeconds = safeDelta
    this.animationTimeSeconds += this.lastFrameDeltaSeconds

    if (this.playbackRate !== 0) {
      this.sceneOffsetSeconds += this.lastFrameDeltaSeconds * this.playbackRate
    }
  }

  getAnimationTimeSeconds() {
    return this.animationTimeSeconds
  }

  getLastFrameDeltaSeconds() {
    return this.lastFrameDeltaSeconds
  }

  getSceneTimestampIso() {
    const ms = this.baseTimestampMs + this.sceneOffsetSeconds * 1000
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) {
      return new Date(this.baseTimestampMs).toISOString()
    }
    return date.toISOString()
  }

  getSceneOffsetSeconds() {
    return this.sceneOffsetSeconds
  }

  setSceneOffsetSeconds(sceneOffsetSeconds: number) {
    this.sceneOffsetSeconds = Number.isFinite(sceneOffsetSeconds) ? sceneOffsetSeconds : 0
  }

  nudgeSceneOffset(deltaSeconds: number) {
    if (!Number.isFinite(deltaSeconds)) {
      return
    }
    this.sceneOffsetSeconds += deltaSeconds
  }

  getPlaybackRate() {
    return this.playbackRate
  }

  setPlaybackRate(playbackRate: number) {
    this.playbackRate = playbackRate

    if (playbackRate !== 0) {
      this.lastNonZeroPlaybackRate = playbackRate
    }
  }

  togglePlayback() {
    this.setPlaybackRate(this.playbackRate === 0 ? this.lastNonZeroPlaybackRate : 0)
  }

  resetSceneTime() {
    this.baseTimestampMs = this.lastSyncedBaseTimestampMs
    this.sceneOffsetSeconds = 0
    this.setPlaybackRate(1)
  }
}
