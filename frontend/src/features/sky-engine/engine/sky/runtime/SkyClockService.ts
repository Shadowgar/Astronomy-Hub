import type { SkyEngineSceneObject } from '../../../types'

export class SkyClockService {
  private animationTimeSeconds = 0
  private sceneTimestampIso: string | undefined
  private lastFrameDeltaSeconds = 0

  syncSceneTimestamp(sceneTimestampIso: string | undefined) {
    this.sceneTimestampIso = sceneTimestampIso
  }

  syncSceneTimestampFromObjects(objects: readonly SkyEngineSceneObject[]) {
    this.sceneTimestampIso = objects.find((object) => object.timestampIso)?.timestampIso
  }

  advanceFrame(deltaSeconds: number) {
    this.lastFrameDeltaSeconds = Math.max(0, deltaSeconds)
    this.animationTimeSeconds += this.lastFrameDeltaSeconds
  }

  getAnimationTimeSeconds() {
    return this.animationTimeSeconds
  }

  getLastFrameDeltaSeconds() {
    return this.lastFrameDeltaSeconds
  }

  getSceneTimestampIso() {
    return this.sceneTimestampIso
  }
}
