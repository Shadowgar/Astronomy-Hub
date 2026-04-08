const LIMITING_MAGNITUDE_ANCHORS = [
  { fovDeg: 180, limitingMagnitude: 5 },
  { fovDeg: 120, limitingMagnitude: 5.5 },
  { fovDeg: 90, limitingMagnitude: 6.2 },
  { fovDeg: 60, limitingMagnitude: 7 },
  { fovDeg: 30, limitingMagnitude: 8.5 },
  { fovDeg: 15, limitingMagnitude: 10 },
  { fovDeg: 7, limitingMagnitude: 11.5 },
  { fovDeg: 3, limitingMagnitude: 12.5 },
  { fovDeg: 2.5, limitingMagnitude: 13.5 },
  { fovDeg: 1, limitingMagnitude: 14.1 },
  { fovDeg: 0.5, limitingMagnitude: 14.6 },
] as const

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

export function resolveLimitingMagnitude(fovDeg: number) {
  const widestAnchor = LIMITING_MAGNITUDE_ANCHORS[0]
  const [narrowestAnchor = LIMITING_MAGNITUDE_ANCHORS[0]] = LIMITING_MAGNITUDE_ANCHORS.slice(-1)
  const clampedFovDeg = clamp(fovDeg, narrowestAnchor.fovDeg, widestAnchor.fovDeg)

  if (clampedFovDeg >= widestAnchor.fovDeg) {
    return widestAnchor.limitingMagnitude
  }

  if (clampedFovDeg <= narrowestAnchor.fovDeg) {
    return narrowestAnchor.limitingMagnitude
  }

  for (let index = 0; index < LIMITING_MAGNITUDE_ANCHORS.length - 1; index += 1) {
    const upperAnchor = LIMITING_MAGNITUDE_ANCHORS[index]
    const lowerAnchor = LIMITING_MAGNITUDE_ANCHORS[index + 1]

    if (clampedFovDeg > upperAnchor.fovDeg || clampedFovDeg < lowerAnchor.fovDeg) {
      continue
    }

    const upperLogFov = Math.log(upperAnchor.fovDeg)
    const lowerLogFov = Math.log(lowerAnchor.fovDeg)
    const currentLogFov = Math.log(clampedFovDeg)
    const amount = (upperLogFov - currentLogFov) / (upperLogFov - lowerLogFov)

    return interpolate(upperAnchor.limitingMagnitude, lowerAnchor.limitingMagnitude, amount)
  }

  return narrowestAnchor.limitingMagnitude
}