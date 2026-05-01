export class WebGL2BufferPool {
  private readonly buffers = new Map<string, WebGLBuffer>()

  uploadFloat32(gl: WebGL2RenderingContext, key: string, values: ReadonlyArray<number>): WebGLBuffer | null {
    let buffer = this.buffers.get(key)
    if (!buffer) {
      const created = gl.createBuffer()
      if (!created) {
        return null
      }
      buffer = created
      this.buffers.set(key, buffer)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW)
    return buffer
  }

  dispose(gl: WebGL2RenderingContext | null) {
    if (gl) {
      this.buffers.forEach((buffer) => {
        gl.deleteBuffer(buffer)
      })
    }
    this.buffers.clear()
  }
}
