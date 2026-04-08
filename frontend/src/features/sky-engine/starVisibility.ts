function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

// Stellarium reference:
// core_get_point_for_mag in core.c softens near-threshold stars by reducing
// luminance quadratically while keeping point size at a minimum display radius.
// In this canvas renderer we approximate that same behavior in magnitude space.
export function computeVisibilityAlpha(
  observedMag: number,
  limitingMag: number,
  fadeWidth = 0.8,
) {
  const safeFadeWidth = Math.max(fadeWidth, 1e-6)
  const delta = limitingMag - observedMag

  if (delta <= 0) {
    return 0
  }

  if (delta >= safeFadeWidth) {
    return 1
  }

  const normalizedDelta = clamp(delta / safeFadeWidth, 0, 1)
  return normalizedDelta * normalizedDelta
}

// Stellarium largely preserves minimum point size while softening luminance.
// Apply only a mild size response so threshold stars do not pop.
export function computeVisibilitySizeScale(visibilityAlpha: number) {
  return 0.88 + clamp(visibilityAlpha, 0, 1) * 0.12
}