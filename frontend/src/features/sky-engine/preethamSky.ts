/**
 * Preetham 1999 analytic sky model + Schlick 1994 tone mapping.
 *
 * Based on:
 *   "A Practical Analytic Model for Daylight" — Preetham, Shirley, Smits (1999)
 *   Stellarium Web Engine atmosphere.c implementation
 *   Schlick 1994 logarithmic tone mapping
 *
 * Computes physically-based sky color for any pixel direction given sun position.
 */

// ── helpers ───────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

function dot3(a: readonly number[], b: readonly number[]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

// ── Perez distribution ────────────────────────────────────────────────────

/**
 * Perez all-weather sky luminance distribution function.
 *
 *   F(θ, γ) = (1 + A·e^(B/cosθ)) · (1 + C·e^(D·γ) + E·cos²γ)
 *
 * θ = zenith angle of sample point
 * γ = angle between sample point and sun
 * A–E = Perez coefficients (turbidity-dependent)
 */
function perez(lam: readonly number[], cosTheta: number, gamma: number, cosGamma: number) {
  const safeCosTh = Math.max(cosTheta, 0.001)
  return (1 + lam[0] * Math.exp(lam[1] / safeCosTh)) *
         (1 + lam[2] * Math.exp(lam[3] * gamma) + lam[4] * cosGamma * cosGamma)
}

// ── Preetham coefficients ─────────────────────────────────────────────────

export interface PreethamCoefficients {
  /** Perez coefficients for x chrominance */
  Px: readonly [number, number, number, number, number]
  /** Perez coefficients for y chrominance */
  Py: readonly [number, number, number, number, number]
  /** Zenith x chrominance / F(0, θs) */
  kx: number
  /** Zenith y chrominance / F(0, θs) */
  ky: number
  /** Sun direction in observed frame [east, up, north] */
  sunDir: readonly [number, number, number]
  /** Sun zenith angle (radians) */
  thetaS: number
}

/**
 * Precompute Preetham coefficients from sun position and turbidity.
 *
 * sunAltRad: sun altitude in radians (positive = above horizon)
 * sunAzRad:  sun azimuth in radians
 * T:         turbidity (2 = clear, 6 = hazy, 10 = overcast)
 */
export function computePreethamCoefficients(sunAltRad: number, sunAzRad: number, T: number): PreethamCoefficients {
  // Sun direction in our coordinate system: x=east, y=up, z=north
  const cosSunAlt = Math.cos(sunAltRad)
  const sinSunAlt = Math.sin(sunAltRad)
  const sunDir: [number, number, number] = [
    Math.sin(sunAzRad) * cosSunAlt,
    sinSunAlt,
    Math.cos(sunAzRad) * cosSunAlt,
  ]

  // Sun zenith angle
  const thetaS = Math.max(0, Math.PI / 2 - sunAltRad)

  const t2 = thetaS * thetaS
  const t3 = thetaS * t2
  const T2 = T * T

  // Zenith chrominance (CIE xy) — Preetham Table 3
  const zx =
    (0.00166 * t3 - 0.00375 * t2 + 0.00209 * thetaS) * T2 +
    (-0.02903 * t3 + 0.06377 * t2 - 0.03202 * thetaS + 0.00394) * T +
    (0.11693 * t3 - 0.21196 * t2 + 0.06052 * thetaS + 0.25886)

  const zy =
    (0.00275 * t3 - 0.0061 * t2 + 0.00317 * thetaS) * T2 +
    (-0.04214 * t3 + 0.0897 * t2 - 0.04153 * thetaS + 0.00516) * T +
    (0.15346 * t3 - 0.26756 * t2 + 0.0667 * thetaS + 0.26688)

  // Perez coefficients — Preetham Table 2
  const Px: [number, number, number, number, number] = [
    -0.01925 * T - 0.25922,
    -0.06651 * T + 0.00081,
    -0.00041 * T + 0.21247,
    -0.06409 * T - 0.89887,
    -0.00325 * T + 0.04517,
  ]

  const Py: [number, number, number, number, number] = [
    -0.01669 * T - 0.26078,
    -0.09495 * T + 0.00921,
    -0.00792 * T + 0.21023,
    -0.04405 * T - 1.65369,
    -0.01092 * T + 0.05291,
  ]

  // Normalize by zenith value
  const fZenithSunX = perez(Px, 1, thetaS, Math.cos(thetaS))
  const fZenithSunY = perez(Py, 1, thetaS, Math.cos(thetaS))

  const kx = fZenithSunX > 0 ? zx / fZenithSunX : 0
  const ky = fZenithSunY > 0 ? zy / fZenithSunY : 0

  return { Px, Py, kx, ky, sunDir, thetaS }
}

// ── CIE Yxy → linear RGB ─────────────────────────────────────────────────

function yxyToLinearRgb(Y: number, x: number, y: number): [number, number, number] {
  if (y <= 0.001 || Y <= 0) return [0, 0, 0]

  const X = (x / y) * Y
  const Z = ((1 - x - y) / y) * Y

  // sRGB D65 matrix
  let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
  let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
  let b = 0.0557 * X - 0.204 * Y + 1.057 * Z

  return [Math.max(0, r), Math.max(0, g), Math.max(0, b)]
}

// ── Schlick 1994 tone mapping ─────────────────────────────────────────────

/**
 * Schlick 1994 logarithmic tone mapping operator.
 *
 *   display = ln(1 + p·Lw) / ln(1 + p·Lwmax) × exposure
 *
 * p:        brightness parameter (higher = more contrast)
 * Lw:       world luminance of pixel
 * Lwmax:    maximum world luminance in scene
 * exposure: final exposure multiplier
 */
function schlickToneMap(Lw: number, Lwmax: number, p: number, exposure: number) {
  if (Lwmax <= 0 || Lw <= 0) return 0
  return (Math.log(1 + p * Lw) / Math.log(1 + p * Lwmax)) * exposure
}

// ── linear → sRGB gamma ──────────────────────────────────────────────────

function linearToSrgb(c: number) {
  if (c <= 0.0031308) return 12.92 * c
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

// ── Public: compute sky color for a direction ─────────────────────────────

export interface SkyColorRgb {
  r: number
  g: number
  b: number
}

/**
 * Compute the sky color for a given direction using the Preetham model.
 *
 * directionUp:  y-component of normalized direction (= sin(altitude))
 * directionEast: x-component
 * directionNorth: z-component
 * coeff: precomputed Preetham coefficients
 * exposure: tone-mapping exposure multiplier (default 1.0)
 */
export function computePreethamSkyColor(
  directionEast: number,
  directionUp: number,
  directionNorth: number,
  coeff: PreethamCoefficients,
  exposure: number,
): SkyColorRgb {
  // Treat below-horizon as mirror (Stellarium approach: abs(z-component))
  const safeUp = Math.abs(directionUp)
  const safeDir: [number, number, number] = [directionEast, safeUp, directionNorth]

  // Zenith angle of this direction
  const cosTheta = clamp(safeUp, 0, 1)

  // Angular distance between this direction and sun
  const cosGamma = clamp(dot3(safeDir, coeff.sunDir), -1, 1)
  const gamma = Math.acos(cosGamma)

  // Perez distribution for x and y chrominance
  const fx = perez(coeff.Px, cosTheta, gamma, cosGamma) * coeff.kx
  const fy = perez(coeff.Py, cosTheta, gamma, cosGamma) * coeff.ky

  // Luminance from a simplified brightness model:
  // Base luminance from zenith distance + sun proximity
  const sunProximityBoost = Math.max(0, cosGamma)
  const horizonBrightening = 1 + 2 * Math.pow(1 - cosTheta, 3)
  const sunAlt01 = clamp(coeff.sunDir[1], -0.2, 1)
  const dayFactor = clamp((sunAlt01 + 0.12) * 3.5, 0, 1)

  // Base luminance in cd/m² (approximate, not full Schaefer model)
  let baseLum = dayFactor * 5000 * horizonBrightening
  baseLum += dayFactor * 20000 * Math.pow(sunProximityBoost, 12)
  // Twilight: faint background
  baseLum += clamp(dayFactor * 0.3 + 0.001, 0, 1) * 2

  // Convert Yxy → linear RGB
  const [lr, lg, lb] = yxyToLinearRgb(baseLum, fx, fy)

  // Find max luminance for tone mapping (scene-adaptive)
  const Lwmax = Math.max(dayFactor * 8000, 10)
  const p = 50 // Schlick brightness parameter (Stellarium uses ~50)

  // Apply Schlick tone mapping per channel
  const mappedR = schlickToneMap(lr, Lwmax, p, exposure)
  const mappedG = schlickToneMap(lg, Lwmax, p, exposure)
  const mappedB = schlickToneMap(lb, Lwmax, p, exposure)

  // Apply sRGB gamma correction
  return {
    r: clamp(Math.round(linearToSrgb(clamp(mappedR, 0, 1)) * 255), 0, 255),
    g: clamp(Math.round(linearToSrgb(clamp(mappedG, 0, 1)) * 255), 0, 255),
    b: clamp(Math.round(linearToSrgb(clamp(mappedB, 0, 1)) * 255), 0, 255),
  }
}

// ── Public: sky background renderer ───────────────────────────────────────

export interface PreethamSkyParams {
  sunAltDeg: number
  sunAzDeg: number
  turbidity: number
  exposure: number
}

/**
 * Render the Preetham sky background onto a 2D canvas context.
 *
 * Uses a block-based approach (cellSize × cellSize) for performance,
 * computing the sky color at each block center and filling the block.
 *
 * unprojectFn: (screenX, screenY) → { dirEast, dirUp, dirNorth } (normalized)
 */
export function renderPreethamSkyBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: PreethamSkyParams,
  unprojectFn: (sx: number, sy: number) => { dirEast: number; dirUp: number; dirNorth: number } | null,
) {
  const sunAltRad = (params.sunAltDeg * Math.PI) / 180
  const sunAzRad = (params.sunAzDeg * Math.PI) / 180
  const coeff = computePreethamCoefficients(sunAltRad, sunAzRad, params.turbidity)

  // Adaptive cell size: smaller cells near the horizon for smoother gradients
  let cellSize = 16
  if (width >= 1200) {
    cellSize = 8
  } else if (width >= 600) {
    cellSize = 12
  }

  for (let y = 0; y < height; y += cellSize) {
    const cellH = Math.min(cellSize, height - y)
    for (let x = 0; x < width; x += cellSize) {
      const cellW = Math.min(cellSize, width - x)
      const dir = unprojectFn(x + cellW * 0.5, y + cellH * 0.5)

      if (!dir) continue

      const col = computePreethamSkyColor(
        dir.dirEast,
        dir.dirUp,
        dir.dirNorth,
        coeff,
        params.exposure,
      )

      context.fillStyle = `rgb(${col.r},${col.g},${col.b})`
      context.fillRect(x, y, cellW + 0.5, cellH + 0.5)
    }
  }
}

// ── Night sky overlay ─────────────────────────────────────────────────────

/**
 * Blend a deep night sky color over the Preetham output when the sun is well
 * below the horizon. Preetham diverges at night (designed for daylight only),
 * so we cross-fade to a calibrated night sky.
 */
export function blendNightSky(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  sunAltDeg: number,
  nightZenithHex: string,
  nightHorizonHex: string,
) {
  // Start blending at sun alt -4°, fully night at -14°
  const nightBlend = clamp((-sunAltDeg - 4) / 10, 0, 1)
  if (nightBlend <= 0.01) return

  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, nightZenithHex)
  gradient.addColorStop(0.8, nightHorizonHex)
  gradient.addColorStop(1, nightHorizonHex)

  context.save()
  context.globalAlpha = nightBlend
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  context.restore()
}
