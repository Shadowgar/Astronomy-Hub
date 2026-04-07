export function resolveLimitingMagnitude(fovDeg: number) {
  if (fovDeg >= 120) {
    return 5.5
  }

  if (fovDeg >= 90) {
    return 6.2
  }

  if (fovDeg >= 60) {
    return 7.0
  }

  if (fovDeg >= 30) {
    return 8.5
  }

  if (fovDeg >= 15) {
    return 10.0
  }

  if (fovDeg >= 7) {
    return 11.5
  }

  if (fovDeg >= 3) {
    return 12.5
  }

  return 13.5
}