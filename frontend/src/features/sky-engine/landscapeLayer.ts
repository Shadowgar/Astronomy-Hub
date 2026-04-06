import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { SKY_ENGINE_CONSTELLATION_SEGMENTS } from './constellations'
import { buildLabelTexture } from './labelManager'
import type { SkyEngineAidVisibility, SkyEngineSceneObject, SkyEngineSunState, SkyEngineVisualCalibration } from './types'

const SKY_ENGINE_GROUND_TEXTURE_URL = '/sky-engine-assets/oras-grass.jpg'
const SKY_RADIUS = 120
const HORIZON_RADIUS = SKY_RADIUS * 0.92
const CARDINAL_MARKERS = [
  { label: 'N', azimuthDeg: 0 },
  { label: 'E', azimuthDeg: 90 },
  { label: 'S', azimuthDeg: 180 },
  { label: 'W', azimuthDeg: 270 },
] as const
const ALTITUDE_RING_DEGREES = [30, 60] as const

export interface LandscapeLayer {
  readonly groundTextureMode: 'oras-grass.jpg_tiled'
  readonly groundTextureAssetPath: string
  update: (animationTime: number) => void
  dispose: () => void
}

function toSkyPosition(altitudeDeg: number, azimuthDeg: number, radius: number) {
  const altitude = (altitudeDeg * Math.PI) / 180
  const azimuth = (azimuthDeg * Math.PI) / 180
  const horizontalRadius = Math.cos(altitude) * radius

  return new Vector3(
    Math.sin(azimuth) * horizontalRadius,
    Math.sin(altitude) * radius,
    Math.cos(azimuth) * horizontalRadius,
  )
}

function buildAssetGroundTexture(scene: Scene, name: string, tileScale: number) {
  const texture = new Texture(SKY_ENGINE_GROUND_TEXTURE_URL, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE)
  texture.hasAlpha = false
  texture.wrapU = Texture.WRAP_ADDRESSMODE
  texture.wrapV = Texture.WRAP_ADDRESSMODE
  texture.name = name
  texture.uScale = tileScale
  texture.vScale = tileScale
  texture.level = 0.94
  return texture
}

function buildRadialBandTexture(name: string, colorHex: string, alpha = 0.42) {
  const texture = new DynamicTexture(name, { width: 1024, height: 1024 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const color = Color3.FromHexString(colorHex)
  const [red, green, blue] = [color.r, color.g, color.b].map((channel) => Math.round(channel * 255))
  const gradient = context.createRadialGradient(512, 512, 250, 512, 512, 512)

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.62, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.82, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.24})`)
  gradient.addColorStop(0.94, `rgba(${red}, ${green}, ${blue}, ${alpha})`)
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)
  texture.update()

  return texture
}

function buildGroundDepthTexture(name: string, alphaScale: number) {
  const texture = new DynamicTexture(name, { width: 1024, height: 1024 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createRadialGradient(512, 512, 180, 512, 512, 512)

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.58, `rgba(0, 0, 0, ${0.08 * alphaScale})`)
  gradient.addColorStop(0.86, `rgba(0, 0, 0, ${0.34 * alphaScale})`)
  gradient.addColorStop(1, `rgba(0, 0, 0, ${0.66 * alphaScale})`)

  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)
  texture.update()

  return texture
}

function buildVerticalMistTexture(name: string, topHex: string, bottomHex: string, alpha = 0.32) {
  const texture = new DynamicTexture(name, { width: 256, height: 1024 }, undefined, true)
  texture.hasAlpha = true

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createLinearGradient(0, 0, 0, 1024)
  const top = Color3.FromHexString(topHex)
  const bottom = Color3.FromHexString(bottomHex)
  const topColor = `${Math.round(top.r * 255)}, ${Math.round(top.g * 255)}, ${Math.round(top.b * 255)}`
  const bottomColor = `${Math.round(bottom.r * 255)}, ${Math.round(bottom.g * 255)}, ${Math.round(bottom.b * 255)}`

  gradient.addColorStop(0, `rgba(${topColor}, 0)`)
  gradient.addColorStop(0.28, `rgba(${topColor}, ${alpha * 0.22})`)
  gradient.addColorStop(0.68, `rgba(${bottomColor}, ${alpha})`)
  gradient.addColorStop(1, `rgba(${bottomColor}, 0)`)
  context.clearRect(0, 0, 256, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 1024)
  texture.update()

  return texture
}

function getGroundShading(calibration: SkyEngineVisualCalibration) {
  return {
    diffuse: Color3.FromHexString(calibration.groundTintHex),
    emissive: Color3.FromHexString(calibration.skyHorizonColorHex).scale(0.08),
    localEmissive: Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.14),
    overlayAlpha: calibration.landscapeShadowAlpha,
    horizonAlpha: calibration.horizonGlowAlpha,
  }
}

function buildAidRingPoints(altitudeDeg: number, radius = SKY_RADIUS * 0.994, steps = 96) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const azimuthDeg = (index / steps) * 360
    return toSkyPosition(altitudeDeg, azimuthDeg, radius)
  })
}

export function createLandscapeLayer(
  scene: Scene,
  calibration: SkyEngineVisualCalibration,
  sunState: SkyEngineSunState,
  aidVisibility: SkyEngineAidVisibility,
  objects: readonly SkyEngineSceneObject[],
): LandscapeLayer {
  const groundShading = getGroundShading(calibration)
  const groundTexture = buildAssetGroundTexture(scene, 'sky-engine-ground-texture', 24)
  const localGroundTexture = buildAssetGroundTexture(scene, 'sky-engine-local-ground-texture', 10)
  const horizonBandTexture = buildRadialBandTexture('sky-engine-horizon-band-texture', calibration.horizonGlowColorHex, calibration.horizonGlowAlpha)
  const nearGroundTexture = buildGroundDepthTexture('sky-engine-ground-depth-texture', calibration.landscapeShadowAlpha)
  const verticalMistTexture = buildVerticalMistTexture(
    'sky-engine-vertical-mist-texture',
    calibration.skyHorizonColorHex,
    calibration.landscapeFogColorHex,
    calibration.horizonGlowAlpha,
  )

  const groundDisk = MeshBuilder.CreateDisc(
    'sky-engine-ground-disk',
    { radius: SKY_RADIUS * 1.38, tessellation: 160, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  groundDisk.rotation.x = Math.PI / 2
  groundDisk.position.y = -2.4
  groundDisk.isPickable = false
  const groundMaterial = new StandardMaterial('sky-engine-ground-material', scene)
  groundMaterial.disableLighting = true
  groundMaterial.diffuseTexture = groundTexture
  groundMaterial.emissiveTexture = groundTexture
  groundMaterial.diffuseColor = groundShading.diffuse
  groundMaterial.emissiveColor = groundShading.emissive
  groundMaterial.specularColor = Color3.Black()
  groundDisk.material = groundMaterial

  const localGroundDisk = MeshBuilder.CreateDisc(
    'sky-engine-local-ground-disk',
    { radius: SKY_RADIUS * 0.34, tessellation: 96, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  localGroundDisk.rotation.x = Math.PI / 2
  localGroundDisk.position.y = -1.55
  localGroundDisk.isPickable = false
  const localGroundMaterial = new StandardMaterial('sky-engine-local-ground-material', scene)
  localGroundMaterial.disableLighting = true
  localGroundMaterial.diffuseTexture = localGroundTexture
  localGroundMaterial.emissiveTexture = localGroundTexture
  localGroundMaterial.diffuseColor = groundShading.diffuse.scale(1.04)
  localGroundMaterial.emissiveColor = groundShading.localEmissive
  localGroundMaterial.specularColor = Color3.Black()
  localGroundDisk.material = localGroundMaterial

  const groundDepthDisc = MeshBuilder.CreateDisc(
    'sky-engine-ground-depth-disc',
    { radius: SKY_RADIUS * 0.98, tessellation: 120, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  groundDepthDisc.rotation.x = Math.PI / 2
  groundDepthDisc.position.y = -1.22
  groundDepthDisc.isPickable = false
  const groundDepthMaterial = new StandardMaterial('sky-engine-ground-depth-material', scene)
  groundDepthMaterial.disableLighting = true
  groundDepthMaterial.diffuseTexture = nearGroundTexture
  groundDepthMaterial.opacityTexture = nearGroundTexture
  groundDepthMaterial.useAlphaFromDiffuseTexture = true
  groundDepthMaterial.backFaceCulling = false
  groundDepthMaterial.emissiveColor = Color3.Black()
  groundDepthMaterial.alpha = groundShading.overlayAlpha
  groundDepthDisc.material = groundDepthMaterial

  const horizonBlend = MeshBuilder.CreateDisc(
    'sky-engine-horizon-blend',
    { radius: HORIZON_RADIUS * 1.08, tessellation: 160, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  horizonBlend.rotation.x = Math.PI / 2
  horizonBlend.position.y = -0.18
  horizonBlend.isPickable = false
  const horizonBlendMaterial = new StandardMaterial('sky-engine-horizon-blend-material', scene)
  horizonBlendMaterial.disableLighting = true
  horizonBlendMaterial.diffuseTexture = horizonBandTexture
  horizonBlendMaterial.opacityTexture = horizonBandTexture
  horizonBlendMaterial.useAlphaFromDiffuseTexture = true
  horizonBlendMaterial.backFaceCulling = false
  horizonBlendMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.28)
  horizonBlendMaterial.alpha = groundShading.horizonAlpha
  horizonBlend.material = horizonBlendMaterial

  const horizonNearBand = MeshBuilder.CreateDisc(
    'sky-engine-horizon-near-band',
    { radius: HORIZON_RADIUS * 0.996, tessellation: 160, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  horizonNearBand.rotation.x = Math.PI / 2
  horizonNearBand.position.y = 0.14
  horizonNearBand.isPickable = false
  const horizonNearBandMaterial = new StandardMaterial('sky-engine-horizon-near-band-material', scene)
  horizonNearBandMaterial.disableLighting = true
  horizonNearBandMaterial.diffuseTexture = horizonBandTexture
  horizonNearBandMaterial.opacityTexture = horizonBandTexture
  horizonNearBandMaterial.useAlphaFromDiffuseTexture = true
  horizonNearBandMaterial.backFaceCulling = false
  horizonNearBandMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.36)
  horizonNearBandMaterial.alpha = Math.max(0.14, groundShading.horizonAlpha - 0.04)
  horizonNearBand.material = horizonNearBandMaterial

  const mistCylinder = MeshBuilder.CreateCylinder(
    'sky-engine-horizon-mist',
    { height: 16, diameter: HORIZON_RADIUS * 2.14, tessellation: 128, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  mistCylinder.position.y = 3.5
  mistCylinder.isPickable = false
  const mistMaterial = new StandardMaterial('sky-engine-horizon-mist-material', scene)
  mistMaterial.disableLighting = true
  mistMaterial.diffuseTexture = verticalMistTexture
  mistMaterial.opacityTexture = verticalMistTexture
  mistMaterial.useAlphaFromDiffuseTexture = true
  mistMaterial.backFaceCulling = false
  mistMaterial.emissiveColor = Color3.FromHexString(calibration.landscapeFogColorHex)
  mistMaterial.alpha = 0.68
  mistCylinder.material = mistMaterial

  const horizonRing = MeshBuilder.CreateTorus(
    'sky-engine-horizon',
    { diameter: HORIZON_RADIUS * 2, thickness: 0.24, tessellation: 128 },
    scene,
  )
  horizonRing.rotation.x = Math.PI / 2
  horizonRing.isPickable = false
  horizonRing.isVisible = aidVisibility.azimuthRing
  const horizonMaterial = new StandardMaterial('sky-engine-horizon-material', scene)
  horizonMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex)
  horizonMaterial.alpha = 0.82
  horizonRing.material = horizonMaterial

  const aidMeshes: Mesh[] = [horizonRing]
  CARDINAL_MARKERS.forEach((marker) => {
    const markerPosition = toSkyPosition(0, marker.azimuthDeg, HORIZON_RADIUS)

    const post = MeshBuilder.CreateCylinder(
      `sky-engine-cardinal-post-${marker.label}`,
      { height: 2.8, diameter: 0.14 },
      scene,
    )
    post.position = new Vector3(markerPosition.x, 1.4, markerPosition.z)
    post.isPickable = false
    post.isVisible = aidVisibility.azimuthRing

    const postMaterial = new StandardMaterial(`sky-engine-cardinal-post-material-${marker.label}`, scene)
    postMaterial.disableLighting = true
    postMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.92)
    post.material = postMaterial
    aidMeshes.push(post)

    const label = MeshBuilder.CreatePlane(
      `sky-engine-cardinal-label-${marker.label}`,
      { width: 5.6, height: 2.6 },
      scene,
    )
    label.position = new Vector3(markerPosition.x, 4.4, markerPosition.z)
    label.billboardMode = Mesh.BILLBOARDMODE_ALL
    label.isPickable = false
    label.isVisible = aidVisibility.azimuthRing

    const labelMaterial = new StandardMaterial(`sky-engine-cardinal-label-material-${marker.label}`, scene)
    labelMaterial.disableLighting = true
    labelMaterial.diffuseTexture = buildLabelTexture(marker.label, 'cardinal')
    labelMaterial.opacityTexture = labelMaterial.diffuseTexture
    labelMaterial.useAlphaFromDiffuseTexture = true
    labelMaterial.backFaceCulling = false
    labelMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex)
    labelMaterial.alpha = 0.88
    label.material = labelMaterial
    aidMeshes.push(label)
  })

  ALTITUDE_RING_DEGREES.forEach((altitudeDeg) => {
    const ring = MeshBuilder.CreateLines(
      `sky-engine-altitude-ring-${altitudeDeg}`,
      { points: buildAidRingPoints(altitudeDeg) },
      scene,
    )
    ring.color = Color3.FromHexString('#7aa9d8')
    ring.alpha = 0.16
    ring.isPickable = false
    ring.isVisible = aidVisibility.altitudeRings
    aidMeshes.push(ring)

    const labelPosition = toSkyPosition(altitudeDeg, 315, SKY_RADIUS * 0.994)
    const label = MeshBuilder.CreatePlane(
      `sky-engine-altitude-label-${altitudeDeg}`,
      { width: 6.5, height: 2.4 },
      scene,
    )
    label.position = labelPosition.add(new Vector3(0, 1.8, 0))
    label.billboardMode = Mesh.BILLBOARDMODE_ALL
    label.isPickable = false
    label.isVisible = aidVisibility.altitudeRings

    const labelMaterial = new StandardMaterial(`sky-engine-altitude-label-material-${altitudeDeg}`, scene)
    labelMaterial.disableLighting = true
    labelMaterial.diffuseTexture = buildLabelTexture(`${altitudeDeg}°`, 'cardinal')
    labelMaterial.opacityTexture = labelMaterial.diffuseTexture
    labelMaterial.useAlphaFromDiffuseTexture = true
    labelMaterial.backFaceCulling = false
    labelMaterial.emissiveColor = Color3.FromHexString('#7aa9d8')
    labelMaterial.alpha = 0.4
    label.material = labelMaterial
    aidMeshes.push(label)
  })

  const constellationObjects = new Map(objects.map((object) => [object.id, object]))
  SKY_ENGINE_CONSTELLATION_SEGMENTS.forEach((segment) => {
    segment.pairs.forEach(([startId, endId], pairIndex) => {
      const startObject = constellationObjects.get(startId)
      const endObject = constellationObjects.get(endId)

      if (!startObject || !endObject) {
        return
      }

      const line = MeshBuilder.CreateLines(
        `sky-engine-constellation-${segment.id}-${pairIndex}`,
        {
          points: [
            toSkyPosition(startObject.altitudeDeg, startObject.azimuthDeg, SKY_RADIUS * 0.997),
            toSkyPosition(endObject.altitudeDeg, endObject.azimuthDeg, SKY_RADIUS * 0.997),
          ],
        },
        scene,
      )
      line.color = Color3.FromHexString('#6d96d9')
      line.alpha = 0.14
      line.isPickable = false
      line.isVisible = aidVisibility.constellations
      aidMeshes.push(line)
    })
  })

  return {
    groundTextureMode: 'oras-grass.jpg_tiled',
    groundTextureAssetPath: SKY_ENGINE_GROUND_TEXTURE_URL,
    update: (animationTime: number) => {
      const horizonPulse = sunState.phaseLabel === 'Low Sun' ? 0.026 : 0.012
      horizonBlendMaterial.alpha = groundShading.horizonAlpha + Math.sin(animationTime * 0.42) * horizonPulse
      horizonNearBandMaterial.alpha = Math.max(0.12, groundShading.horizonAlpha - 0.04 + Math.sin(animationTime * 0.58) * 0.014)
      mistMaterial.alpha = 0.54 + Math.sin(animationTime * 0.24) * 0.03
    },
    dispose: () => {
      groundTexture.dispose()
      localGroundTexture.dispose()
      horizonBandTexture.dispose()
      nearGroundTexture.dispose()
      verticalMistTexture.dispose()
      groundMaterial.dispose()
      localGroundMaterial.dispose()
      groundDepthMaterial.dispose()
      horizonBlendMaterial.dispose()
      horizonNearBandMaterial.dispose()
      mistMaterial.dispose()
      horizonMaterial.dispose()
      groundDisk.dispose(false, true)
      localGroundDisk.dispose(false, true)
      groundDepthDisc.dispose(false, true)
      horizonBlend.dispose(false, true)
      horizonNearBand.dispose(false, true)
      mistCylinder.dispose(false, true)
      aidMeshes.forEach((mesh) => {
        if (!mesh.isDisposed()) {
          mesh.dispose(false, true)
        }
      })
    },
  }
}
