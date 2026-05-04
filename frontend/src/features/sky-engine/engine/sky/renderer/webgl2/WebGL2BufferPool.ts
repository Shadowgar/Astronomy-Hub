type Float32BufferEntry = {
  readonly buffer: WebGLBuffer
  capacity: number
}

export class WebGL2BufferPool {
  private readonly buffers = new Map<string, Float32BufferEntry>()

  uploadFloat32(gl: WebGL2RenderingContext, key: string, values: ReadonlyArray<number> | Float32Array): WebGLBuffer | null {
    const payload = values instanceof Float32Array ? values : new Float32Array(values)

    let entry = this.buffers.get(key)
    if (!entry) {
      const created = gl.createBuffer()
      if (!created) {
        return null
      }
      entry = {
        buffer: created,
        capacity: 0,
      }
      this.buffers.set(key, entry)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, entry.buffer)
    if (payload.length > entry.capacity) {
      gl.bufferData(gl.ARRAY_BUFFER, payload, gl.DYNAMIC_DRAW)
      entry.capacity = payload.length
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, payload)
    }

    return entry.buffer
  }

  dispose(gl: WebGL2RenderingContext | null) {
    if (gl) {
      this.buffers.forEach((entry) => {
        gl.deleteBuffer(entry.buffer)
      })
    }
    this.buffers.clear()
  }
}
