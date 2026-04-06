import { Vector3 } from '@babylonjs/core/Maths/math.vector'

export const SKY_RADIUS = 120
export const SKY_SELECTION_RADIUS = 92

export function toSkyPosition(altitudeDeg: number, azimuthDeg: number, radius = SKY_RADIUS) {
  const altitude = (altitudeDeg * Math.PI) / 180
  const azimuth = (azimuthDeg * Math.PI) / 180
  const horizontalRadius = Math.cos(altitude) * radius

  return new Vector3(
    Math.sin(azimuth) * horizontalRadius,
    Math.sin(altitude) * radius,
    Math.cos(azimuth) * horizontalRadius,
  )
}

export function toSkyDirection(altitudeDeg: number, azimuthDeg: number) {
  return toSkyPosition(altitudeDeg, azimuthDeg, 1).normalize()
}
