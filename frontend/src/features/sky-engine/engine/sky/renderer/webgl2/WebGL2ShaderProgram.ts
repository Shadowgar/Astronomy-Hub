const VERTEX_SOURCE = `#version 300 es
// Initial WebGL2 backend shell shader (not Stellarium parity shader).
in vec2 a_position;
in float a_depth;
in float a_size;
in vec4 a_color;
uniform vec2 u_viewport;
out vec4 v_color;
void main() {
  float x = (a_position.x / u_viewport.x) * 2.0 - 1.0;
  float y = 1.0 - (a_position.y / u_viewport.y) * 2.0;
  float z = clamp(a_depth, 0.0, 1.0) * 2.0 - 1.0;
  gl_Position = vec4(x, y, z, 1.0);
  gl_PointSize = max(1.0, a_size);
  v_color = a_color / 255.0;
}`

const FRAGMENT_SOURCE = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}`

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) {
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }

  return shader
}

export class WebGL2ShaderProgram {
  private program: WebGLProgram | null = null
  private attribLocationCache = new Map<string, number>()
  private uniformLocationCache = new Map<string, WebGLUniformLocation | null>()

  init(gl: WebGL2RenderingContext) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE)
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) {
        gl.deleteShader(vertexShader)
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader)
      }
      return
    }

    const program = gl.createProgram()
    if (!program) {
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    this.program = program
    this.attribLocationCache.clear()
    this.uniformLocationCache.clear()
  }

  getProgram() {
    return this.program
  }

  getAttribLocation(gl: WebGL2RenderingContext, name: string) {
    if (!this.program) {
      return -1
    }
    if (!this.attribLocationCache.has(name)) {
      this.attribLocationCache.set(name, gl.getAttribLocation(this.program, name))
    }
    return this.attribLocationCache.get(name) ?? -1
  }

  getUniformLocation(gl: WebGL2RenderingContext, name: string) {
    if (!this.program) {
      return null
    }
    if (!this.uniformLocationCache.has(name)) {
      this.uniformLocationCache.set(name, gl.getUniformLocation(this.program, name))
    }
    return this.uniformLocationCache.get(name) ?? null
  }

  use(gl: WebGL2RenderingContext) {
    if (!this.program) {
      return false
    }
    gl.useProgram(this.program)
    return true
  }

  dispose(gl: WebGL2RenderingContext | null) {
    if (gl && this.program) {
      gl.deleteProgram(this.program)
    }
    this.program = null
    this.attribLocationCache.clear()
    this.uniformLocationCache.clear()
  }
}
