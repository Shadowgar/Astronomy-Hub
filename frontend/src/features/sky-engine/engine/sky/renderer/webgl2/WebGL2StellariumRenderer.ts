import type { StellariumRenderItem } from '../renderItems'
import type {
  StellariumRendererContract,
  StellariumRendererFrameInput,
  StellariumRendererFrameOutput,
  StellariumRendererPointStyleCalibration,
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

const DEFAULT_POINT_STYLE_CALIBRATION: StellariumRendererPointStyleCalibration = {
  pointScale: 1,
  alphaScale: 1,
  colorMode: 'payload',
}

type RendererOptions = {
  canvas?: HTMLCanvasElement | null
  gl?: WebGL2RenderingContext | null
  drawEnabled?: boolean
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
  private readonly drawEnabled: boolean
  private prepareFrameMs = 0
  private submitFrameMs = 0
  private renderFrameMs = 0
  private pointStyleCalibration: StellariumRendererPointStyleCalibration = DEFAULT_POINT_STYLE_CALIBRATION

  constructor(options: RendererOptions = {}) {
    this.options = options
    this.drawEnabled = options.drawEnabled !== false
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
    this.pointStyleCalibration = this.resolvePointStyleCalibration(submission.pointStyleCalibration)

    this.submitFrameMs = nowMs() - start
  }

  renderFrame(): StellariumRendererFrameOutput {
    const start = nowMs()
    this.assertUsable()

    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
      if (this.drawEnabled) {
        this.drawPointItems(this.gl, this.state.getSubmittedItems(), this.pointStyleCalibration)
      } else {
        this.state.setPointDrawResults({
          drawnPointItemCount: 0,
          drawnPointCount: 0,
          skippedUnsupportedItemCount: this.state.getDiagnostics().skippedUnsupportedItemCount,
          note: 'point_draw:skipped;draw:disabled',
        })
      }
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

  private drawPointItems(
    gl: WebGL2RenderingContext,
    items: ReadonlyArray<StellariumRenderItem>,
    pointStyleCalibration: StellariumRendererPointStyleCalibration,
  ) {
    const viewport = this.state.getViewport()
    const submittedPointItemCount = items.filter((item) => item.itemType === 'ITEM_POINTS').length
    let drawnPointItemCount = 0
    let drawnPointCount = 0
    let skippedUnsupportedItemCount = 0

    for (const item of items) {
      if (item.itemType !== 'ITEM_POINTS') {
        skippedUnsupportedItemCount += 1
        continue
      }

      const expectedPointPayloadSize = item.pointCount * 8
      if (item.pointCount <= 0 || item.vertexPayload.length < expectedPointPayloadSize) {
        continue
      }

      const buffer = this.bufferPool.uploadFloat32(
        gl,
        `point-item-${drawnPointItemCount}`,
        item.vertexPayload,
      )
      if (!buffer) {
        continue
      }

      if (!this.shaderProgram.use(gl)) {
        continue
      }

      const positionLocation = this.shaderProgram.getAttribLocation(gl, 'a_position')
      const depthLocation = this.shaderProgram.getAttribLocation(gl, 'a_depth')
      const sizeLocation = this.shaderProgram.getAttribLocation(gl, 'a_size')
      const colorLocation = this.shaderProgram.getAttribLocation(gl, 'a_color')
      const viewportUniform = this.shaderProgram.getUniformLocation(gl, 'u_viewport')
      const pointScaleUniform = this.shaderProgram.getUniformLocation(gl, 'u_pointScale')
      const alphaScaleUniform = this.shaderProgram.getUniformLocation(gl, 'u_alphaScale')
      const colorModeUniform = this.shaderProgram.getUniformLocation(gl, 'u_colorMode')

      const strideBytes = 8 * 4

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      if (positionLocation >= 0) {
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, strideBytes, 0)
      }
      if (depthLocation >= 0) {
        gl.enableVertexAttribArray(depthLocation)
        gl.vertexAttribPointer(depthLocation, 1, gl.FLOAT, false, strideBytes, 2 * 4)
      }
      if (sizeLocation >= 0) {
        gl.enableVertexAttribArray(sizeLocation)
        gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, strideBytes, 3 * 4)
      }
      if (colorLocation >= 0) {
        gl.enableVertexAttribArray(colorLocation)
        gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, strideBytes, 4 * 4)
      }

      if (viewportUniform !== null && viewport) {
        gl.uniform2f(viewportUniform, viewport.width, viewport.height)
      }
      if (pointScaleUniform !== null) {
        gl.uniform1f(pointScaleUniform, pointStyleCalibration.pointScale)
      }
      if (alphaScaleUniform !== null) {
        gl.uniform1f(alphaScaleUniform, pointStyleCalibration.alphaScale)
      }
      if (colorModeUniform !== null) {
        gl.uniform1i(colorModeUniform, this.resolveColorModeValue(pointStyleCalibration.colorMode))
      }

      gl.drawArrays(gl.POINTS, 0, item.pointCount)

      if (positionLocation >= 0) {
        gl.disableVertexAttribArray(positionLocation)
      }
      if (depthLocation >= 0) {
        gl.disableVertexAttribArray(depthLocation)
      }
      if (sizeLocation >= 0) {
        gl.disableVertexAttribArray(sizeLocation)
      }
      if (colorLocation >= 0) {
        gl.disableVertexAttribArray(colorLocation)
      }

      drawnPointItemCount += 1
      drawnPointCount += item.pointCount
    }

    this.state.setPointDrawResults({
      drawnPointItemCount,
      drawnPointCount,
      skippedUnsupportedItemCount,
      note: `point_draw:${drawnPointCount}/${submittedPointItemCount};style:${pointStyleCalibration.colorMode}@${pointStyleCalibration.pointScale.toFixed(2)}x${pointStyleCalibration.alphaScale.toFixed(2)}`,
    })
  }

  private resolvePointStyleCalibration(
    input: StellariumRendererFrameSubmission['pointStyleCalibration'],
  ): StellariumRendererPointStyleCalibration {
    if (!input) {
      return DEFAULT_POINT_STYLE_CALIBRATION
    }

    return {
      pointScale: Math.min(6, Math.max(0.25, Number.isFinite(input.pointScale) ? input.pointScale : 1)),
      alphaScale: Math.min(4, Math.max(0.1, Number.isFinite(input.alphaScale) ? input.alphaScale : 1)),
      colorMode: input.colorMode === 'white-hot' || input.colorMode === 'grayscale'
        ? input.colorMode
        : 'payload',
    }
  }

  private resolveColorModeValue(colorMode: StellariumRendererPointStyleCalibration['colorMode']) {
    if (colorMode === 'white-hot') {
      return 1
    }
    if (colorMode === 'grayscale') {
      return 2
    }
    return 0
  }

  private assertUsable() {
    if (!this.initialized || this.disposed) {
      throw new Error('WebGL2StellariumRenderer is not initialized')
    }
  }
}
