import type { SkyEngineSceneObject } from '../../../types'

export class SkyClockService {
  private animationTimeSeconds = 0
  private lastFrameDeltaSeconds = 0
  private baseTimestampMs = Date.now()
  private sceneOffsetSeconds = 0
  private playbackRate = 1
  private lastNonZeroPlaybackRate = 1

  syncBaseTimestamp(sceneTimestampIso: string | undefined) {
    if (!sceneTimestampIso) {
      return
    }

    const nextBaseTimestampMs = Date.parse(sceneTimestampIso)

    if (Number.isNaN(nextBaseTimestampMs) || nextBaseTimestampMs === this.baseTimestampMs) {
      return
    }

    this.baseTimestampMs = nextBaseTimestampMs
  }

  syncSceneTimestampFromObjects(objects: readonly SkyEngineSceneObject[]) {
    this.syncBaseTimestamp(objects.find((object) => object.timestampIso)?.timestampIso)
  }

  advanceFrame(deltaSeconds: number) {
    this.lastFrameDeltaSeconds = Math.max(0, deltaSeconds)
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
    return new Date(this.baseTimestampMs + this.sceneOffsetSeconds * 1000).toISOString()
  }

  getSceneOffsetSeconds() {
    return this.sceneOffsetSeconds
  }

  setSceneOffsetSeconds(sceneOffsetSeconds: number) {
    this.sceneOffsetSeconds = sceneOffsetSeconds
  }

  nudgeSceneOffset(deltaSeconds: number) {
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
    this.baseTimestampMs = Date.now()
    this.sceneOffsetSeconds = 0
    this.setPlaybackRate(1)
  }
}
