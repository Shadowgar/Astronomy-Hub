import type { StellariumRenderItem } from '../renderItems'
import type {
  StellariumRendererContract,
  StellariumRendererFrameInput,
  StellariumRendererFrameOutput,
  StellariumRendererFrameSubmission,
  StellariumRendererFrameTiming,
  StellariumRendererInitInput,
  StellariumRendererViewportInput,
} from '../stellariumRendererContract'
import { WebGL2BufferPool } from './WebGL2BufferPool'
import { WebGL2RendererState } from './WebGL2RendererState'
import { WebGL2ShaderProgram } from './WebGL2ShaderProgram'
import {
  createWebGL2ContextFromCanvas,
  detectWebGL2Support,
  isWebGL2ContextLike,
} from './webgl2Capabilities'

const WEBGL2_BACKEND_NAME = 'webgl2-stellarium-shell'

type RendererOptions = {
  canvas?: HTMLCanvasElement | null
  gl?: WebGL2RenderingContext | null
}

function nowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

export class WebGL2StellariumRenderer implements StellariumRendererContract {
  private readonly options: RendererOptions
  private readonly state = new WebGL2RendererState()
  private readonly bufferPool = new WebGL2BufferPool()
  private readonly shaderProgram = new WebGL2ShaderProgram()

  private initialized = false
  private disposed = false
  private gl: WebGL2RenderingContext | null = null
  private prepareFrameMs = 0
  private submitFrameMs = 0
  private renderFrameMs = 0

  constructor(options: RendererOptions = {}) {
    this.options = options
  }

  init(input: StellariumRendererInitInput): void {
    const candidateContext = input.gl
      ?? this.options.gl
      ?? createWebGL2ContextFromCanvas(input.canvas ?? this.options.canvas)

    if (!isWebGL2ContextLike(candidateContext)) {
      const support = detectWebGL2Support({
        canvas: input.canvas ?? this.options.canvas,
      })
      throw new Error(`WebGL2 initialization failed: ${support.reason ?? 'unsupported'}`)
    }

    this.gl = candidateContext
    this.initialized = true
    this.disposed = false
    this.state.reset()
    this.shaderProgram.init(this.gl)

    this.resize(input.viewport)

    this.gl.clearColor(0, 0, 0, 0)
  }

  resize(viewport: StellariumRendererViewportInput): void {
    this.assertUsable()
    this.state.setViewport(viewport)
    if (this.gl) {
      this.gl.viewport(0, 0, viewport.width, viewport.height)
    }
  }

  prepareFrame(input: StellariumRendererFrameInput): void {
    const start = nowMs()
    this.assertUsable()
    this.state.setPendingFrameInput(input)
    this.prepareFrameMs = nowMs() - start
  }

  submitFrame(submission: StellariumRendererFrameSubmission): void {
    const start = nowMs()
    this.assertUsable()
    this.state.setPendingFrameInput(submission.frameInput)
    this.state.setSubmittedItems(submission.renderItems)

    if (this.gl) {
      this.uploadPointItems(this.gl, submission.renderItems)
    }

    this.submitFrameMs = nowMs() - start
  }

  renderFrame(): StellariumRendererFrameOutput {
    const start = nowMs()
    this.assertUsable()

    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }

    this.renderFrameMs = nowMs() - start

    return {
      pickResult: {
        objectId: null,
        hit: false,
        confidence: 0,
      },
      diagnostics: this.state.getDiagnostics(),
      timing: this.buildTiming(),
      activeBackendName: WEBGL2_BACKEND_NAME,
    }
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.initialized = false

    this.shaderProgram.dispose(this.gl)
    this.bufferPool.dispose(this.gl)

    this.gl = null
    this.state.reset()
  }

  snapshot() {
    return this.state.snapshot()
  }

  private buildTiming(): StellariumRendererFrameTiming {
    return {
      prepareFrameMs: this.prepareFrameMs,
      submitFrameMs: this.submitFrameMs,
      renderFrameMs: this.renderFrameMs,
      totalFrameMs: this.prepareFrameMs + this.submitFrameMs + this.renderFrameMs,
    }
  }

  private uploadPointItems(gl: WebGL2RenderingContext, items: ReadonlyArray<StellariumRenderItem>) {
    const vertexPayload: number[] = []
    for (const item of items) {
      if (item.itemType !== 'ITEM_POINTS') {
        continue
      }
      vertexPayload.push(...item.vertexPayload)
    }

    if (vertexPayload.length === 0) {
      return
    }

    this.bufferPool.uploadFloat32(gl, 'point-items', vertexPayload)
  }

  private assertUsable() {
    if (!this.initialized || this.disposed) {
      throw new Error('WebGL2StellariumRenderer is not initialized')
    }
  }
}
