const DEGREES_TO_RADIANS = Math.PI / 180

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

// Stellarium parity notes:
// - skybrightness_get_luminance adds a dark-night term shaped by
//   (0.4 + 0.6 / sqrt(0.04 + 0.96 * cosZenithDist^2)), which brightens the horizon.
// - twilight brightness persists while the sun is below the horizon.
// This slice reproduces that behavioral pattern in a lightweight luminance proxy.
export function computeNightSkyLuminance(
  altitudeRad: number,
  sunAltitudeRad: number,
): number {
  const visibleAltitude = Math.max(0, altitudeRad)
  const cosZenithDistance = clamp(Math.sin(visibleAltitude), 0, 1)

  // Stellarium-inspired night-sky horizon brightening term.
  const stellariumNightFactor = 0.4 + 0.6 / Math.sqrt(0.04 + 0.96 * cosZenithDistance * cosZenithDistance)
  const normalizedHorizonGlow = clamp((stellariumNightFactor - 1) / 2.4, 0, 1)

  // Keep a faint sky floor so the dome is never pure black.
  const baseFloor = 0.012

  // Twilight persists below the horizon and fades out smoothly by deep night.
  const subHorizonTwilight = Math.exp(-Math.max(0, -sunAltitudeRad) * 6)
  const daylightSuppression = Math.exp(-Math.max(0, sunAltitudeRad) * 28)
  const twilightContribution = subHorizonTwilight * daylightSuppression

  const luminance = baseFloor + normalizedHorizonGlow * 0.028 + twilightContribution * 0.05
  return clamp(luminance, 0, 0.12)
}

export function renderNightSkyBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  sunAltitudeDeg: number,
  unprojectFn: (sx: number, sy: number) => { dirEast: number; dirUp: number; dirNorth: number } | null,
) {
  const sunAltitudeRad = sunAltitudeDeg * DEGREES_TO_RADIANS

  let cellSize = 16
  if (width >= 1200) {
    cellSize = 8
  } else if (width >= 600) {
    cellSize = 12
  }

  context.save()
  context.globalCompositeOperation = 'screen'

  for (let y = 0; y < height; y += cellSize) {
    const cellHeight = Math.min(cellSize, height - y)

    for (let x = 0; x < width; x += cellSize) {
      const cellWidth = Math.min(cellSize, width - x)
      const direction = unprojectFn(x + cellWidth * 0.5, y + cellHeight * 0.5)

      if (!direction) {
        continue
      }

      const altitudeRad = Math.asin(clamp(direction.dirUp, -1, 1))
      const luminance = computeNightSkyLuminance(altitudeRad, sunAltitudeRad)

      if (luminance <= 0.001) {
        continue
      }

      // Slight blue bias matches Stellarium's dark-night blueish offset.
      const alpha = clamp(luminance * 0.7, 0, 0.08)
      context.fillStyle = `rgba(96, 116, 168, ${alpha})`
      context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5)
    }
  }

  context.restore()
}