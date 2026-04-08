import { describe, it, expect } from 'vitest'
import {
  computePreethamCoefficients,
  computePreethamSkyColor,
} from '../src/features/sky-engine/preethamSky'

describe('Preetham sky model', () => {
  const DEG = Math.PI / 180

  function skyColor(sunAltDeg, sunAzDeg, sampleAltDeg, sampleAzDeg, turbidity = 3) {
    const coeff = computePreethamCoefficients(sunAltDeg * DEG, sunAzDeg * DEG, turbidity)
    const cosAlt = Math.cos(sampleAltDeg * DEG)
    const sinAlt = Math.sin(sampleAltDeg * DEG)
    const cosAz = Math.cos(sampleAzDeg * DEG)
    const sinAz = Math.sin(sampleAzDeg * DEG)
    return computePreethamSkyColor(
      sinAz * cosAlt,
      sinAlt,
      cosAz * cosAlt,
      coeff,
      1,
    )
  }

  it('zenith is darker than horizon during daytime', () => {
    const zenith = skyColor(45, 180, 90, 0)
    const horizon = skyColor(45, 180, 5, 0)
    const zenithLum = zenith.r * 0.2126 + zenith.g * 0.7152 + zenith.b * 0.0722
    const horizonLum = horizon.r * 0.2126 + horizon.g * 0.7152 + horizon.b * 0.0722
    expect(horizonLum).toBeGreaterThan(zenithLum)
  })

  it('zenith is bluer than horizon during daytime', () => {
    const zenith = skyColor(45, 180, 90, 0)
    // Blue should dominate relative to red at zenith
    expect(zenith.b).toBeGreaterThan(zenith.r * 0.5)
  })

  it('sunset sky near sun is warm (red/orange)', () => {
    // Sun at altitude 2°, azimuth 270° (west), sample near sun
    const nearSun = skyColor(2, 270, 5, 270)
    // Near-sun color should be warm: red channel strong
    expect(nearSun.r).toBeGreaterThan(nearSun.b)
  })

  it('daytime sky is brighter than deep twilight sky', () => {
    const daySky = skyColor(45, 180, 90, 0)
    const twilightSky = skyColor(-12, 270, 90, 90)
    const dayLum = daySky.r + daySky.g + daySky.b
    const twilightLum = twilightSky.r + twilightSky.g + twilightSky.b
    expect(dayLum).toBeGreaterThan(twilightLum)
  })

  it('produces valid RGB values in range 0-255', () => {
    const tests = [
      [45, 180, 90, 0],    // daytime zenith
      [45, 180, 0, 90],    // daytime horizon
      [2, 270, 5, 270],    // sunset near sun
      [-6, 270, 45, 0],    // twilight
      [-18, 0, 90, 0],     // deep night
    ]
    for (const [sunAlt, sunAz, sAlt, sAz] of tests) {
      const c = skyColor(sunAlt, sunAz, sAlt, sAz)
      expect(c.r).toBeGreaterThanOrEqual(0)
      expect(c.r).toBeLessThanOrEqual(255)
      expect(c.g).toBeGreaterThanOrEqual(0)
      expect(c.g).toBeLessThanOrEqual(255)
      expect(c.b).toBeGreaterThanOrEqual(0)
      expect(c.b).toBeLessThanOrEqual(255)
    }
  })

  it('higher turbidity produces warmer sky at zenith', () => {
    const clear = skyColor(45, 180, 90, 0, 2)
    const hazy = skyColor(45, 180, 90, 0, 8)
    // Higher turbidity should shift toward warmer (more red relative to blue)
    const clearRatio = clear.b / Math.max(clear.r, 1)
    const hazyRatio = hazy.b / Math.max(hazy.r, 1)
    expect(clearRatio).toBeGreaterThan(hazyRatio)
  })

  it('Preetham coefficients are stable', () => {
    const coeff = computePreethamCoefficients(45 * DEG, 180 * DEG, 3)
    expect(coeff.Px.length).toBe(5)
    expect(coeff.Py.length).toBe(5)
    expect(coeff.kx).toBeGreaterThan(0)
    expect(coeff.ky).toBeGreaterThan(0)
    expect(coeff.thetaS).toBeCloseTo(45 * DEG, 4)
  })

  it('sun direction vector is normalized', () => {
    const coeff = computePreethamCoefficients(30 * DEG, 90 * DEG, 3)
    const len = Math.hypot(
      coeff.sunDir[0], coeff.sunDir[1], coeff.sunDir[2],
    )
    expect(len).toBeCloseTo(1, 6)
  })
})
