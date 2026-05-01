import type { StellariumRenderItem } from './renderItems'

export interface StellariumRendererObserverInput {
  readonly latitudeDeg: number
  readonly longitudeDeg: number
  readonly elevationM: number
}

export interface StellariumRendererTimeInput {
  readonly timestampIso: string
  readonly animationTimeSeconds: number
}

export interface StellariumRendererViewportInput {
  readonly width: number
  readonly height: number
  readonly pixelRatio: number
}

export interface StellariumRendererCameraInput {
  readonly centerDirection: {
    readonly x: number
    readonly y: number
    readonly z: number
  }
}

export interface StellariumRendererClipCullState {
  readonly clipInfoValid: boolean
  readonly horizonClipActive: boolean
  readonly discontinuityClipActive: boolean
  readonly notes?: string | null
}

export interface StellariumRendererFrameInput {
  readonly observer: StellariumRendererObserverInput
  readonly time: StellariumRendererTimeInput
  readonly projectionMode: string
  readonly fovDegrees: number
  readonly viewport: StellariumRendererViewportInput
  readonly camera: StellariumRendererCameraInput
  readonly clipCullState?: StellariumRendererClipCullState | null
}

export interface StellariumRendererInitInput {
  readonly viewport: StellariumRendererViewportInput
  readonly canvasId?: string | null
}

export interface StellariumRendererFrameSubmission {
  readonly frameInput: StellariumRendererFrameInput
  readonly renderItems: ReadonlyArray<StellariumRenderItem>
}

export interface StellariumRendererHitResult {
  readonly objectId: string | null
  readonly hit: boolean
  readonly confidence: number
}

export interface StellariumRendererDiagnostics {
  readonly acceptedItemCount: number
  readonly acceptedPointItemCount: number
  readonly acceptedMeshItemCount: number
  readonly acceptedTextItemCount: number
  readonly acceptedTextureItemCount: number
  readonly lastFrameSequence: number
  readonly lastFrameProjectionMode: string | null
  readonly notes: ReadonlyArray<string>
}

export interface StellariumRendererFrameTiming {
  readonly prepareFrameMs: number
  readonly submitFrameMs: number
  readonly renderFrameMs: number
  readonly totalFrameMs: number
}

export interface StellariumRendererFrameOutput {
  readonly pickResult: StellariumRendererHitResult
  readonly diagnostics: StellariumRendererDiagnostics
  readonly timing: StellariumRendererFrameTiming
  readonly activeBackendName: string
}

export interface StellariumRendererContract {
  init(input: StellariumRendererInitInput): void | Promise<void>
  resize(viewport: StellariumRendererViewportInput): void
  prepareFrame(input: StellariumRendererFrameInput): void
  submitFrame(submission: StellariumRendererFrameSubmission): void
  renderFrame(): StellariumRendererFrameOutput
  dispose(): void
}
