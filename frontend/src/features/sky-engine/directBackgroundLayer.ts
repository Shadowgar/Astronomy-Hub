import { Effect } from '@babylonjs/core/Materials/effect'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { buildProceduralSkyBackdrop } from './syntheticStarField'
import {
  directionToHorizontal,
  getProjectionScale,
  isProjectedPointVisible,
  projectDirectionToViewport,
  projectHorizontalToViewport,
  type SkyProjectionView,
} from './projectionMath'
import type { SkyEngineSunState } from './types'

interface DirectBackgroundPatchEntry {
  readonly id: string
  readonly screenX: number
  readonly screenY: number
  readonly radiusPx: number
  readonly alpha: number
  readonly colorHex: string
}

interface DirectBackgroundRibbonEntry {
  readonly id: string
  readonly topPath: Vector3[]
  readonly bottomPath: Vector3[]
  readonly colorHex: string
  readonly alpha: number
}

interface DirectBackgroundGlareEntry {
  readonly screenX: number
  readonly screenY: number
  readonly outerRadiusPx: number
  readonly discRadiusPx: number
  readonly outerAlpha: number
  readonly discAlpha: number
}

export interface PreparedDirectAtmosphereFrame {
  readonly viewportWidth: number
  readonly viewportHeight: number
  readonly zenithColorHex: string
  readonly horizonColorHex: string
  readonly backgroundColorHex: string
  readonly twilightBandColorHex: string
  readonly backdropAlpha: number
  readonly twilightStrength: number
  readonly sunPosition: Vector2
  readonly patches: readonly DirectBackgroundPatchEntry[]
  readonly glare: DirectBackgroundGlareEntry | null
}

export interface PreparedDirectLandscapeFrame {
  readonly viewportWidth: number
  readonly viewportHeight: number
  readonly ribbons: readonly DirectBackgroundRibbonEntry[]
}

interface GlowEntry {
  readonly mesh: Mesh
  readonly material: StandardMaterial
}

const PROCEDURAL_SKY_BACKDROP = buildProceduralSkyBackdrop(180)
const BACKGROUND_SHADER_NAME = 'skyEngineBackgroundLayer'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge0 === edge1) {
    return value >= edge1 ? 1 : 0
  }

  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function mix(left: number, right: number, amount: number) {
  return left + (right - left) * amount
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function hexToColor3(hex: string) {
  return Color3.FromHexString(hex)
}

function toViewportPlanePosition(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number, depth = 0.002) {
  return new Vector3(
    screenX - viewportWidth * 0.5,
    viewportHeight * 0.5 - screenY,
    depth,
  )
}

function buildConstantAltitudeCurve(view: SkyProjectionView, altitudeDeg: number) {
  const points: Array<{ x: number; y: number }> = []

  for (let azimuthDeg = 0; azimuthDeg <= 360; azimuthDeg += 4) {
    const projected = projectHorizontalToViewport(altitudeDeg, azimuthDeg, view)

    if (projected && isProjectedPointVisible(projected, view, 24)) {
      points.push({ x: projected.screenX, y: projected.screenY })
    }
  }

  return points
}

function buildGroundBoundaryCurve(horizonCurve: readonly { x: number; y: number }[], viewportWidth: number) {
  if (horizonCurve.length < 2) {
    return []
  }

  const bucketCount = Math.max(24, Math.min(160, Math.round(viewportWidth / 18)))
  const boundaryByBucket = new Array<number | null>(bucketCount + 1).fill(null)

  horizonCurve.forEach((point) => {
    const clampedX = clamp(point.x, 0, viewportWidth)
    const bucketIndex = Math.round((clampedX / Math.max(viewportWidth, 1)) * bucketCount)
    const currentBoundary = boundaryByBucket[bucketIndex]

    if (currentBoundary === null || point.y > currentBoundary) {
      boundaryByBucket[bucketIndex] = point.y
    }
  })

  let previousKnownIndex = -1
  for (let index = 0; index <= bucketCount; index += 1) {
    if (boundaryByBucket[index] === null) {
      continue
    }

    if (previousKnownIndex >= 0 && index - previousKnownIndex > 1) {
      const startY = boundaryByBucket[previousKnownIndex] ?? 0
      const endY = boundaryByBucket[index] ?? startY
      const gapLength = index - previousKnownIndex

      for (let gapIndex = 1; gapIndex < gapLength; gapIndex += 1) {
        const amount = gapIndex / gapLength
        boundaryByBucket[previousKnownIndex + gapIndex] = startY + (endY - startY) * amount
      }
    }

    previousKnownIndex = index
  }

  const firstKnownIndex = boundaryByBucket.findIndex((value) => value !== null)
  if (firstKnownIndex < 0) {
    return []
  }

  const lastKnownIndex = boundaryByBucket.reduce<number>((lastIndex, value, index) => {
    if (value === null) {
      return lastIndex
    }

    return index
  }, firstKnownIndex)
  const firstKnownY = boundaryByBucket[firstKnownIndex] ?? 0
  const lastKnownY = boundaryByBucket[lastKnownIndex] ?? firstKnownY

  for (let index = 0; index < firstKnownIndex; index += 1) {
    boundaryByBucket[index] = firstKnownY
  }

  for (let index = lastKnownIndex + 1; index <= bucketCount; index += 1) {
    boundaryByBucket[index] = lastKnownY
  }

  return boundaryByBucket.map((y, index) => ({
    x: (index / bucketCount) * viewportWidth,
    y: y ?? firstKnownY,
  }))
}

function boundaryToPath(boundary: readonly { x: number; y: number }[], viewportWidth: number, viewportHeight: number, depth: number) {
  return boundary.map((point) => toViewportPlanePosition(point.x, point.y, viewportWidth, viewportHeight, depth))
}

function createBottomPath(boundary: readonly { x: number; y: number }[], viewportWidth: number, viewportHeight: number, depth: number, screenY: number) {
  return boundary.map((point) => toViewportPlanePosition(point.x, screenY, viewportWidth, viewportHeight, depth))
}

function getLandscapeOpacity(centerAltitudeDeg: number, fovDegrees: number) {
  const baseOpacity = smoothstep(1, 20, fovDegrees)
  const belowHorizonReveal = centerAltitudeDeg < 0 ? 1 : 0

  return clamp(mix(baseOpacity, baseOpacity * 0.28, belowHorizonReveal), 0.12, 1)
}

function buildBackdropAlpha(sunState: SkyEngineSunState) {
  return clamp(0.9 - sunState.visualCalibration.starVisibility * 0.18, 0.68, 0.92)
}

function buildTwilightStrength(sunState: SkyEngineSunState) {
  if (sunState.altitudeDeg >= 6) {
    return 0.42
  }

  if (sunState.altitudeDeg >= -12) {
    return clamp((sunState.altitudeDeg + 12) / 18, 0.08, 0.34)
  }

  return 0.04
}

function createRadialTexture(name: string, tint = '#ffffff') {
  const texture = new DynamicTexture(name, { width: 256, height: 256 }, undefined, true)
  texture.hasAlpha = true
  const context = texture.getContext()
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128)
  gradient.addColorStop(0, tint)
  gradient.addColorStop(0.22, tint)
  gradient.addColorStop(0.64, 'rgba(255, 255, 255, 0.24)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.clearRect(0, 0, 256, 256)
  context.fillStyle = gradient
  context.beginPath()
  context.arc(128, 128, 128, 0, Math.PI * 2)
  context.fill()
  texture.update()
  return texture
}

function ensureBackgroundShader() {
  if (Effect.ShadersStore[`${BACKGROUND_SHADER_NAME}VertexShader`]) {
    return
  }

  Effect.ShadersStore[`${BACKGROUND_SHADER_NAME}VertexShader`] = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 worldViewProjection;
    varying vec2 vUV;

    void main(void) {
      vUV = uv;
      gl_Position = worldViewProjection * vec4(position, 1.0);
    }
  `

  Effect.ShadersStore[`${BACKGROUND_SHADER_NAME}FragmentShader`] = `
    precision highp float;
    varying vec2 vUV;
    uniform vec3 zenithColor;
    uniform vec3 horizonColor;
    uniform vec3 backgroundColor;
    uniform vec3 twilightColor;
    uniform vec2 sunPosition;
    uniform float twilightStrength;
    uniform float opacity;

    void main(void) {
      float horizonMix = smoothstep(0.08, 0.82, vUV.y);
      vec3 base = mix(horizonColor, zenithColor, horizonMix);
      float lowerMix = smoothstep(0.0, 0.24, vUV.y);
      base = mix(backgroundColor, base, lowerMix);

      vec2 glowDelta = vec2((vUV.x - sunPosition.x) * 1.45, (vUV.y - sunPosition.y) * 3.2);
      float twilightGlow = exp(-dot(glowDelta, glowDelta) * 2.4) * twilightStrength;
      float bandGlow = exp(-pow((vUV.y - 0.22) * 7.0, 2.0)) * twilightStrength * 0.42;
      vec3 color = base + twilightColor * (twilightGlow * 0.46 + bandGlow);

      gl_FragColor = vec4(color, opacity);
    }
  `
}

function createGlowPlane(scene: Scene, id: string, texture: DynamicTexture, renderingGroupId: number) {
  const mesh = MeshBuilder.CreatePlane(id, { width: 1, height: 1 }, scene)
  mesh.isPickable = false
  mesh.renderingGroupId = renderingGroupId

  const material = new StandardMaterial(`${id}-material`, scene)
  material.disableLighting = true
  material.backFaceCulling = false
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.useAlphaFromDiffuseTexture = true
  material.emissiveColor = Color3.White()
  material.alpha = 0
  mesh.material = material
  mesh.isVisible = false

  return { mesh, material }
}

function prepareBackdropPatches(view: SkyProjectionView, sunState: SkyEngineSunState, fovDegrees: number) {
  const projectionScale = getProjectionScale(view)
  const wideBlend = smoothstep(80, 185, fovDegrees)
  const backdropOpacity = clamp(sunState.visualCalibration.starVisibility * 0.62 + sunState.visualCalibration.starFieldBrightness * 0.24, 0, 1)

  if (backdropOpacity <= 0.08) {
    return []
  }

  return PROCEDURAL_SKY_BACKDROP.flatMap((patch, index) => {
    const projected = projectDirectionToViewport(patch.direction, view)

    if (!projected || !isProjectedPointVisible(projected, view, 120)) {
      return []
    }

    const radiusPx = clamp(projectionScale * Math.tan(degreesToRadians(patch.radiusDeg) * 0.5), 28, 240)
    const alpha = patch.alpha * backdropOpacity * (0.35 + patch.bandWeight * 0.95) * (0.56 + wideBlend * 0.44)

    if (alpha <= 0.004) {
      return []
    }

    return [{
      id: `backdrop-patch-${index}`,
      screenX: projected.screenX,
      screenY: projected.screenY,
      radiusPx,
      alpha: alpha * 0.34,
      colorHex: patch.colorHex,
    }]
  })
}

function prepareGlare(view: SkyProjectionView, sunState: SkyEngineSunState) {
  if (sunState.altitudeDeg < -6) {
    return null
  }

  const projectedSun = projectHorizontalToViewport(sunState.altitudeDeg, sunState.azimuthDeg, view)

  if (!projectedSun || !isProjectedPointVisible(projectedSun, view, 180)) {
    return null
  }

  const horizonFade = clamp((sunState.altitudeDeg + 6) / 18, 0, 1)
  const discRadius = clamp(getProjectionScale(view) * Math.tan((0.53 * Math.PI) / 360), 8, 22)

  return {
    screenX: projectedSun.screenX,
    screenY: projectedSun.screenY,
    discRadiusPx: discRadius,
    outerRadiusPx: discRadius * (sunState.altitudeDeg > 0 ? 12 : 18),
    outerAlpha: 0.36 * horizonFade,
    discAlpha: 0.94 * horizonFade,
  } satisfies DirectBackgroundGlareEntry
}

function prepareLandscapeRibbons(view: SkyProjectionView, sunState: SkyEngineSunState, fovDegrees: number) {
  const centerAltitudeDeg = directionToHorizontal(view.centerDirection).altitudeDeg
  const landscapeOpacity = getLandscapeOpacity(centerAltitudeDeg, fovDegrees)

  if (landscapeOpacity <= 0.02) {
    return []
  }

  const upperBoundary = buildGroundBoundaryCurve(buildConstantAltitudeCurve(view, 8), view.viewportWidth)
  const horizonBoundary = buildGroundBoundaryCurve(buildConstantAltitudeCurve(view, 0), view.viewportWidth)
  const lowerBoundary = buildGroundBoundaryCurve(buildConstantAltitudeCurve(view, -14), view.viewportWidth)
  const bottomScreenY = view.viewportHeight + 32

  const ribbons: DirectBackgroundRibbonEntry[] = []

  if (upperBoundary.length > 1 && horizonBoundary.length > 1 && upperBoundary.length === horizonBoundary.length) {
    ribbons.push({
      id: 'landscape-fog-band',
      topPath: boundaryToPath(upperBoundary, view.viewportWidth, view.viewportHeight, 0.004),
      bottomPath: boundaryToPath(horizonBoundary, view.viewportWidth, view.viewportHeight, 0.004),
      colorHex: sunState.visualCalibration.landscapeFogColorHex,
      alpha: landscapeOpacity * 0.38,
    })
  }

  if (horizonBoundary.length > 1 && lowerBoundary.length > 1 && horizonBoundary.length === lowerBoundary.length) {
    ribbons.push({
      id: 'landscape-ground-band',
      topPath: boundaryToPath(horizonBoundary, view.viewportWidth, view.viewportHeight, 0.005),
      bottomPath: boundaryToPath(lowerBoundary, view.viewportWidth, view.viewportHeight, 0.005),
      colorHex: sunState.visualCalibration.groundTintHex,
      alpha: landscapeOpacity * 0.56,
    })
  }

  if (lowerBoundary.length > 1) {
    ribbons.push({
      id: 'landscape-bottom-fill',
      topPath: boundaryToPath(lowerBoundary, view.viewportWidth, view.viewportHeight, 0.006),
      bottomPath: createBottomPath(lowerBoundary, view.viewportWidth, view.viewportHeight, 0.006, bottomScreenY),
      colorHex: sunState.visualCalibration.backgroundColorHex,
      alpha: landscapeOpacity * 0.76,
    })
  }

  return ribbons
}

export function prepareDirectAtmosphereFrame(view: SkyProjectionView, sunState: SkyEngineSunState, fovDegrees: number) {
  const projectedSun = projectHorizontalToViewport(sunState.altitudeDeg, sunState.azimuthDeg, view)
  const sunPosition = projectedSun
    ? new Vector2(
        clamp(projectedSun.screenX / Math.max(view.viewportWidth, 1), 0, 1),
        clamp(1 - projectedSun.screenY / Math.max(view.viewportHeight, 1), 0, 1),
      )
    : new Vector2(0.5, clamp(0.18 + (sunState.altitudeDeg + 18) / 72, 0.05, 0.95))

  return {
    viewportWidth: view.viewportWidth,
    viewportHeight: view.viewportHeight,
    zenithColorHex: sunState.visualCalibration.skyZenithColorHex,
    horizonColorHex: sunState.visualCalibration.skyHorizonColorHex,
    backgroundColorHex: sunState.visualCalibration.backgroundColorHex,
    twilightBandColorHex: sunState.visualCalibration.twilightBandColorHex,
    backdropAlpha: buildBackdropAlpha(sunState),
    twilightStrength: buildTwilightStrength(sunState),
    sunPosition,
    patches: prepareBackdropPatches(view, sunState, fovDegrees),
    glare: prepareGlare(view, sunState),
  } satisfies PreparedDirectAtmosphereFrame
}

export function prepareDirectLandscapeFrame(view: SkyProjectionView, sunState: SkyEngineSunState, fovDegrees: number) {
  return {
    viewportWidth: view.viewportWidth,
    viewportHeight: view.viewportHeight,
    ribbons: prepareLandscapeRibbons(view, sunState, fovDegrees),
  } satisfies PreparedDirectLandscapeFrame
}

export function createDirectBackgroundLayer(scene: Scene) {
  ensureBackgroundShader()

  const backdropPlane = MeshBuilder.CreatePlane('sky-engine-background-plane', { width: 1, height: 1 }, scene)
  backdropPlane.isPickable = false
  backdropPlane.renderingGroupId = 0

  const backdropMaterial = new ShaderMaterial(
    'sky-engine-background-material',
    scene,
    {
      vertex: BACKGROUND_SHADER_NAME,
      fragment: BACKGROUND_SHADER_NAME,
    },
    {
      attributes: ['position', 'uv'],
      uniforms: ['worldViewProjection', 'zenithColor', 'horizonColor', 'backgroundColor', 'twilightColor', 'sunPosition', 'twilightStrength', 'opacity'],
      needAlphaBlending: true,
    },
  )
  backdropMaterial.backFaceCulling = false
  backdropPlane.material = backdropMaterial

  const patchTexture = createRadialTexture('sky-engine-background-patch-texture')
  const glareTexture = createRadialTexture('sky-engine-background-glare-texture', 'rgba(255,255,240,1)')
  const discTexture = createRadialTexture('sky-engine-background-disc-texture', 'rgba(255,240,180,1)')
  const patchEntries = new Map<string, GlowEntry>()
  const ribbonMeshes = new Map<string, Mesh>()

  const outerGlare = createGlowPlane(scene, 'sky-engine-background-outer-glare', glareTexture, 0)
  const discGlare = createGlowPlane(scene, 'sky-engine-background-disc-glare', discTexture, 0)

  return {
    syncAtmosphere(frame: PreparedDirectAtmosphereFrame) {
      backdropPlane.scaling.set(frame.viewportWidth, frame.viewportHeight, 1)
      backdropPlane.position.set(0, 0, 0.001)
      backdropMaterial.setColor3('zenithColor', hexToColor3(frame.zenithColorHex))
      backdropMaterial.setColor3('horizonColor', hexToColor3(frame.horizonColorHex))
      backdropMaterial.setColor3('backgroundColor', hexToColor3(frame.backgroundColorHex))
      backdropMaterial.setColor3('twilightColor', hexToColor3(frame.twilightBandColorHex))
      backdropMaterial.setVector2('sunPosition', frame.sunPosition)
      backdropMaterial.setFloat('twilightStrength', frame.twilightStrength)
      backdropMaterial.setFloat('opacity', frame.backdropAlpha)

      const nextPatchIds = new Set(frame.patches.map((entry) => entry.id))
      Array.from(patchEntries.keys()).forEach((patchId) => {
        if (nextPatchIds.has(patchId)) {
          return
        }

        const entry = patchEntries.get(patchId)

        if (!entry) {
          return
        }

        entry.mesh.dispose()
        entry.material.dispose()
        patchEntries.delete(patchId)
      })

      frame.patches.forEach((patch) => {
        let entry = patchEntries.get(patch.id)

        if (!entry) {
          entry = createGlowPlane(scene, `sky-engine-background-${patch.id}`, patchTexture, 0)
          patchEntries.set(patch.id, entry)
        }

        entry.mesh.isVisible = true
        entry.mesh.position.copyFrom(toViewportPlanePosition(patch.screenX, patch.screenY, frame.viewportWidth, frame.viewportHeight, 0.002))
        entry.mesh.scaling.set(patch.radiusPx * 2, patch.radiusPx * 2, 1)
        entry.material.emissiveColor = hexToColor3(patch.colorHex)
        entry.material.alpha = patch.alpha
      })

      if (!frame.glare) {
        outerGlare.mesh.isVisible = false
        discGlare.mesh.isVisible = false
        return
      }

      outerGlare.mesh.isVisible = true
      outerGlare.mesh.position.copyFrom(toViewportPlanePosition(frame.glare.screenX, frame.glare.screenY, frame.viewportWidth, frame.viewportHeight, 0.003))
      outerGlare.mesh.scaling.set(frame.glare.outerRadiusPx * 2, frame.glare.outerRadiusPx * 2, 1)
      outerGlare.material.emissiveColor = Color3.FromHexString('#ffd694')
      outerGlare.material.alpha = frame.glare.outerAlpha

      discGlare.mesh.isVisible = true
      discGlare.mesh.position.copyFrom(toViewportPlanePosition(frame.glare.screenX, frame.glare.screenY, frame.viewportWidth, frame.viewportHeight, 0.0035))
      discGlare.mesh.scaling.set(frame.glare.discRadiusPx * 2, frame.glare.discRadiusPx * 2, 1)
      discGlare.material.emissiveColor = Color3.FromHexString('#ffe7a2')
      discGlare.material.alpha = frame.glare.discAlpha
    },

    syncLandscape(frame: PreparedDirectLandscapeFrame) {
      backdropPlane.scaling.set(frame.viewportWidth, frame.viewportHeight, 1)

      const nextRibbonIds = new Set(frame.ribbons.map((entry) => entry.id))
      Array.from(ribbonMeshes.keys()).forEach((ribbonId) => {
        if (nextRibbonIds.has(ribbonId)) {
          return
        }

        const mesh = ribbonMeshes.get(ribbonId)

        if (!mesh) {
          return
        }

        mesh.dispose()
        ribbonMeshes.delete(ribbonId)
      })

      frame.ribbons.forEach((ribbon) => {
        const existing = ribbonMeshes.get(ribbon.id)
        const nextRibbon = MeshBuilder.CreateRibbon(
          `sky-engine-background-ribbon-${ribbon.id}`,
          {
            pathArray: [ribbon.topPath, ribbon.bottomPath],
            updatable: true,
            sideOrientation: Mesh.DOUBLESIDE,
            ...(existing ? { instance: existing } : {}),
          },
          scene,
        )

        nextRibbon.isPickable = false
        nextRibbon.renderingGroupId = 0

        let material = nextRibbon.material as StandardMaterial | null
        if (!material) {
          material = new StandardMaterial(`sky-engine-background-ribbon-material-${ribbon.id}`, scene)
          material.disableLighting = true
          material.backFaceCulling = false
          nextRibbon.material = material
        }

        material.emissiveColor = hexToColor3(ribbon.colorHex)
        material.alpha = ribbon.alpha
        ribbonMeshes.set(ribbon.id, nextRibbon)
      })
    },

    dispose() {
      backdropPlane.dispose()
      backdropMaterial.dispose()
      patchEntries.forEach((entry) => {
        entry.mesh.dispose()
        entry.material.dispose()
      })
      patchEntries.clear()
      ribbonMeshes.forEach((mesh) => {
        const material = mesh.material as StandardMaterial | null
        mesh.dispose()
        material?.dispose()
      })
      ribbonMeshes.clear()
      outerGlare.mesh.dispose()
      outerGlare.material.dispose()
      discGlare.mesh.dispose()
      discGlare.material.dispose()
      patchTexture.dispose()
      glareTexture.dispose()
      discTexture.dispose()
    },
  }
}
