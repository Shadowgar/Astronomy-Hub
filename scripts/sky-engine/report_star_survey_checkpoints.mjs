#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const hipManifestPath = path.join(repoRoot, 'frontend/public/sky-engine-assets/catalog/hipparcos/manifest.json')
const supplementalSurveyPath = path.join(repoRoot, 'frontend/public/sky-engine-assets/catalog/hipparcos/hipparcos_tier2_subset.json')

const SURVEY_RANGES = {
  hipparcos: { minVmag: -2, maxVmag: 6.5 },
  supplemental: { minVmag: 6.0, maxVmag: 8.5 },
}

const CHECKPOINT_FOVS = [120, 60, 30, 10, 2]

const DEGREES_TO_RADIANS = Math.PI / 180
const STELLARIUM_FOV_EYE_RADIANS = 60 * DEGREES_TO_RADIANS
const STELLARIUM_POINT_SPREAD_RADIUS_RAD = (2.5 / 60) * DEGREES_TO_RADIANS
const STELLARIUM_MIN_POINT_AREA_SR = Math.PI * STELLARIUM_POINT_SPREAD_RADIUS_RAD * STELLARIUM_POINT_SPREAD_RADIUS_RAD
const STELLARIUM_STAR_LINEAR_SCALE = 0.8
const STELLARIUM_STAR_RELATIVE_SCALE = 1.1
const STELLARIUM_SKIP_POINT_RADIUS_PX = 0.25
const RADIANS_TO_ARCSECONDS = 206264.80624709636

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function exp10(value) {
  return Math.exp(value * Math.log(10))
}

function getMagnitudeIlluminance(magnitude) {
  return 10.7646e4 / (RADIANS_TO_ARCSECONDS * RADIANS_TO_ARCSECONDS) * exp10(-0.4 * magnitude)
}

function tonemapperMap(luminance, tonemapperP, tonemapperLwmax, tonemapperExposure) {
  const safeLuminance = Math.max(luminance, 0)
  const safeLwmax = Math.max(tonemapperLwmax, 1e-6)
  const denominator = Math.log(1 + tonemapperP * safeLwmax)

  if (denominator <= 0) {
    return 0
  }

  return (Math.log(1 + tonemapperP * safeLuminance) / denominator) * tonemapperExposure
}

function getTelescopeGainMagnitude(fovDeg) {
  const fovRad = clamp(fovDeg, 0.25, 180) * DEGREES_TO_RADIANS
  const magnification = STELLARIUM_FOV_EYE_RADIANS / fovRad
  const exposure = Math.pow(Math.max(1, (5 * DEGREES_TO_RADIANS) / fovRad), 0.07)
  const lightGrasp = Math.max(0.4, magnification * magnification * exposure)

  return 2.5 * Math.log10(lightGrasp)
}

function resolvePointRadiusForMagnitude(magnitude, fovDeg) {
  const apparentLuminance = getMagnitudeIlluminance(magnitude - getTelescopeGainMagnitude(fovDeg)) / STELLARIUM_MIN_POINT_AREA_SR
  const displayLuminance = tonemapperMap(apparentLuminance, 2.2, 0.052, 2)

  return STELLARIUM_STAR_LINEAR_SCALE * Math.pow(Math.max(displayLuminance, 0), STELLARIUM_STAR_RELATIVE_SCALE / 2)
}

function resolveLimitingMagnitudeForFov(fovDeg) {
  let magnitude = 0
  let lowerBound = -192
  let upperBound = 64

  if (resolvePointRadiusForMagnitude(lowerBound, fovDeg) < STELLARIUM_SKIP_POINT_RADIUS_PX) {
    return lowerBound
  }

  for (let iteration = 0; iteration < 32; iteration += 1) {
    magnitude = (lowerBound + upperBound) * 0.5
    const radius = resolvePointRadiusForMagnitude(magnitude, fovDeg)

    if (Math.abs(radius - STELLARIUM_SKIP_POINT_RADIUS_PX) < 0.001) {
      return magnitude
    }

    if (radius > STELLARIUM_SKIP_POINT_RADIUS_PX) {
      lowerBound = magnitude
    } else {
      upperBound = magnitude
    }
  }

  return magnitude
}

function loadHipparcosMagnitudes() {
  const manifest = JSON.parse(fs.readFileSync(hipManifestPath, 'utf8'))
  const magnitudesById = new Map()

  for (const entry of Object.values(manifest.tiles)) {
    const tilePath = path.join(path.dirname(hipManifestPath), entry.path)
    const tile = JSON.parse(fs.readFileSync(tilePath, 'utf8'))

    for (const star of tile.stars ?? []) {
      const magnitude = Number(star.mag)
      if (!Number.isFinite(magnitude)) {
        continue
      }

      const current = magnitudesById.get(star.id)
      if (current === undefined || magnitude < current) {
        magnitudesById.set(star.id, magnitude)
      }
    }
  }

  return magnitudesById
}

function loadSupplementalMagnitudes() {
  const stars = JSON.parse(fs.readFileSync(supplementalSurveyPath, 'utf8'))
  const magnitudesById = new Map()

  for (const star of stars) {
    const magnitude = Number(star.magnitude)
    if (!Number.isFinite(magnitude)) {
      continue
    }

    const current = magnitudesById.get(star.id)
    if (current === undefined || magnitude < current) {
      magnitudesById.set(star.id, magnitude)
    }
  }

  return magnitudesById
}

function computeVisibleCountAtFov(fovDeg, hipparcosMagnitudes, supplementalMagnitudes) {
  const limitingMagnitude = resolveLimitingMagnitudeForFov(fovDeg)
  const visibleIds = new Set()

  for (const [id, magnitude] of hipparcosMagnitudes.entries()) {
    if (magnitude >= SURVEY_RANGES.hipparcos.minVmag && magnitude <= SURVEY_RANGES.hipparcos.maxVmag && magnitude <= limitingMagnitude) {
      visibleIds.add(id)
    }
  }

  if (limitingMagnitude >= SURVEY_RANGES.supplemental.minVmag) {
    for (const [id, magnitude] of supplementalMagnitudes.entries()) {
      if (magnitude >= SURVEY_RANGES.supplemental.minVmag && magnitude <= SURVEY_RANGES.supplemental.maxVmag && magnitude <= limitingMagnitude) {
        visibleIds.add(id)
      }
    }
  }

  return {
    fovDeg,
    limitingMagnitude,
    visibleCount: visibleIds.size,
  }
}

const hipparcosMagnitudes = loadHipparcosMagnitudes()
const supplementalMagnitudes = loadSupplementalMagnitudes()

console.log(`hipparcos_unique=${hipparcosMagnitudes.size}`)
console.log(`supplemental_unique=${supplementalMagnitudes.size}`)
console.log('fov_deg\tlimiting_mag\tvisible_star_count')

for (const fovDeg of CHECKPOINT_FOVS) {
  const row = computeVisibleCountAtFov(fovDeg, hipparcosMagnitudes, supplementalMagnitudes)
  console.log(`${row.fovDeg}\t${row.limitingMagnitude.toFixed(3)}\t${row.visibleCount}`)
}
