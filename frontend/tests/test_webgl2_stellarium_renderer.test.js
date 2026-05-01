import { describe, expect, it, vi } from 'vitest'

import { createPointRenderItem } from '../src/features/sky-engine/engine/sky/renderer/renderItems'
import { WebGL2StellariumRenderer } from '../src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2StellariumRenderer'
import { detectWebGL2Support } from '../src/features/sky-engine/engine/sky/renderer/webgl2/webgl2Capabilities'

function createStubWebGL2Context() {
  return {
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,
    COLOR_BUFFER_BIT: 0x4000,
    POINTS: 0x0000,
    FLOAT: 0x1406,
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,

    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),

    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    deleteShader: vi.fn(),

    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn((_program, name) => {
      if (name === 'a_position') {
        return 0
      }
      if (name === 'a_depth') {
        return 1
      }
      if (name === 'a_size') {
        return 2
      }
      if (name === 'a_color') {
        return 3
      }
      return -1
    }),
    getUniformLocation: vi.fn(() => ({ location: 'u_viewport' })),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    drawArrays: vi.fn(),

    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
  }
}

describe('webgl2 stellarium renderer shell', () => {
  it('reports unsupported cleanly when webgl2 is unavailable', () => {
    const support = detectWebGL2Support()
    expect(support.supported).toBe(false)
    expect(typeof support.reason).toBe('string')
  })

  it('can initialize with a stub webgl2 context and accept point items', () => {
    const gl = createStubWebGL2Context()
    const renderer = new WebGL2StellariumRenderer({ gl })

    renderer.init({
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 40,
        longitudeDeg: -74,
        elevationM: 10,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 0,
      },
      projectionMode: 'stereographic',
      fovDegrees: 70,
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
      camera: {
        centerDirection: { x: 0, y: 0, z: 1 },
      },
    })

    const pointItem = createPointRenderItem({
      order: 5,
      pointCount: 1,
      vertexPayload: [100, 100, 0.2, 3, 255, 255, 255, 255],
      sourceModule: 'stars',
      sourceObjectId: 'star-1',
      dimensions: '2d',
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 40,
          longitudeDeg: -74,
          elevationM: 10,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 0,
        },
        projectionMode: 'stereographic',
        fovDegrees: 70,
        viewport: {
          width: 800,
          height: 400,
          pixelRatio: 1,
        },
        camera: {
          centerDirection: { x: 0, y: 0, z: 1 },
        },
      },
      renderItems: [pointItem],
      pointStyleCalibration: {
        pointScale: 2,
        alphaScale: 1.5,
        colorMode: 'grayscale',
      },
    })

    const output = renderer.renderFrame()

    expect(output.activeBackendName).toBe('webgl2-stellarium-shell')
    expect(output.diagnostics.acceptedItemCount).toBe(1)
    expect(output.diagnostics.acceptedPointItemCount).toBe(1)
    expect(output.diagnostics.submittedPointItemCount).toBe(1)
    expect(output.diagnostics.drawnPointItemCount).toBe(1)
    expect(output.diagnostics.submittedPointCount).toBe(1)
    expect(output.diagnostics.drawnPointCount).toBe(1)
    expect(output.diagnostics.skippedUnsupportedItemCount).toBe(0)
    expect(output.diagnostics.notes.some((note) => note.includes('style:grayscale@2.00x1.50'))).toBe(true)
    expect(gl.bufferData).toHaveBeenCalledTimes(2)
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.POINTS, 0, 1)
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 2)
    expect(gl.uniform1f).toHaveBeenCalledWith(expect.any(Object), 1.5)
    expect(gl.uniform1i).toHaveBeenCalledWith(expect.any(Object), 2)
  })

  it('skips unsupported item types and reports diagnostics separation', () => {
    const gl = createStubWebGL2Context()
    const renderer = new WebGL2StellariumRenderer({ gl })

    renderer.init({
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 40,
        longitudeDeg: -74,
        elevationM: 10,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 0,
      },
      projectionMode: 'stereographic',
      fovDegrees: 70,
      viewport: {
        width: 800,
        height: 400,
        pixelRatio: 1,
      },
      camera: {
        centerDirection: { x: 0, y: 0, z: 1 },
      },
    })

    const pointItem = createPointRenderItem({
      order: 5,
      pointCount: 2,
      vertexPayload: [100, 100, 0.2, 3, 255, 255, 255, 255, 120, 120, 0.3, 2, 255, 200, 150, 255],
      sourceModule: 'stars',
      sourceObjectId: null,
      dimensions: '2d',
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 40,
          longitudeDeg: -74,
          elevationM: 10,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 0,
        },
        projectionMode: 'stereographic',
        fovDegrees: 70,
        viewport: {
          width: 800,
          height: 400,
          pixelRatio: 1,
        },
        camera: {
          centerDirection: { x: 0, y: 0, z: 1 },
        },
      },
      renderItems: [
        pointItem,
        {
          itemType: 'ITEM_MESH',
          flags: 0,
          order: 8,
          pointCount: 0,
          vertexPayload: [],
          textureIdentity: null,
          materialIdentity: null,
          sourceModule: 'mesh',
          sourceObjectId: null,
          meshPrimitive: 'triangles',
        },
      ],
    })

    const output = renderer.renderFrame()

    expect(output.diagnostics.acceptedItemCount).toBe(2)
    expect(output.diagnostics.submittedPointItemCount).toBe(1)
    expect(output.diagnostics.drawnPointItemCount).toBe(1)
    expect(output.diagnostics.submittedPointCount).toBe(2)
    expect(output.diagnostics.drawnPointCount).toBe(2)
    expect(output.diagnostics.skippedUnsupportedItemCount).toBe(1)
    expect(gl.drawArrays).toHaveBeenCalledWith(gl.POINTS, 0, 2)
  })

  it('empty frame draws nothing safely', () => {
    const gl = createStubWebGL2Context()
    const renderer = new WebGL2StellariumRenderer({ gl })

    renderer.init({
      viewport: {
        width: 400,
        height: 200,
        pixelRatio: 1,
      },
    })

    renderer.prepareFrame({
      observer: {
        latitudeDeg: 0,
        longitudeDeg: 0,
        elevationM: 0,
      },
      time: {
        timestampIso: '2026-05-01T00:00:00Z',
        animationTimeSeconds: 0,
      },
      projectionMode: 'stereographic',
      fovDegrees: 90,
      viewport: {
        width: 400,
        height: 200,
        pixelRatio: 1,
      },
      camera: {
        centerDirection: { x: 0, y: 0, z: 1 },
      },
    })

    renderer.submitFrame({
      frameInput: {
        observer: {
          latitudeDeg: 0,
          longitudeDeg: 0,
          elevationM: 0,
        },
        time: {
          timestampIso: '2026-05-01T00:00:00Z',
          animationTimeSeconds: 0,
        },
        projectionMode: 'stereographic',
        fovDegrees: 90,
        viewport: {
          width: 400,
          height: 200,
          pixelRatio: 1,
        },
        camera: {
          centerDirection: { x: 0, y: 0, z: 1 },
        },
      },
      renderItems: [],
    })

    const output = renderer.renderFrame()
    expect(output.diagnostics.drawnPointCount).toBe(0)
    expect(output.diagnostics.drawnPointItemCount).toBe(0)
    expect(gl.drawArrays).not.toHaveBeenCalled()
  })

  it('resize updates viewport state and forwards viewport call', () => {
    const gl = createStubWebGL2Context()
    const renderer = new WebGL2StellariumRenderer({ gl })

    renderer.init({
      viewport: {
        width: 400,
        height: 200,
        pixelRatio: 1,
      },
    })

    renderer.resize({
      width: 1024,
      height: 512,
      pixelRatio: 2,
    })

    expect(gl.viewport).toHaveBeenLastCalledWith(0, 0, 1024, 512)
    expect(renderer.snapshot().viewport).toEqual({
      width: 1024,
      height: 512,
      pixelRatio: 2,
    })
  })

  it('dispose is idempotent', () => {
    const gl = createStubWebGL2Context()
    const renderer = new WebGL2StellariumRenderer({ gl })

    renderer.init({
      viewport: {
        width: 400,
        height: 200,
        pixelRatio: 1,
      },
    })

    renderer.dispose()
    expect(() => renderer.dispose()).not.toThrow()
    expect(() => renderer.renderFrame()).toThrow(/not initialized/)
  })
})
