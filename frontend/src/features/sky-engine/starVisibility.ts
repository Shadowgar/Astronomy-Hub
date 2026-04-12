// Star visibility follows the same point-radius threshold model used to
// compute limiting magnitude: stars below the threshold are fully culled.
export function computeVisibilityAlpha(
  observedMag: number,
  limitingMag: number,
  _fadeWidth = 0.8,
) {
  return observedMag <= limitingMag ? 1 : 0
}

export function computeVisibilitySizeScale(_visibilityAlpha: number) {
  return 1
}
