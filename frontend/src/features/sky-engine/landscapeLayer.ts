import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import type { Scene } from '@babylonjs/core/scene'

import { SKY_ENGINE_CONSTELLATION_SEGMENTS } from './constellations'
import { buildLabelTexture } from './labelManager'
import { SKY_RADIUS, toSkyPosition } from './skyDomeMath'
import type { SkyEngineAidVisibility, SkyEngineSceneObject, SkyEngineSunState, SkyEngineVisualCalibration } from './types'

const SKY_ENGINE_GROUND_TEXTURE_URL = '/sky-engine-assets/oras-grass.jpg'
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
  const horizonMeshes: Mesh[] = []
  const aidMeshes: Mesh[] = []

  const groundMask = MeshBuilder.CreateDisc(
    'sky-engine-ground-mask',
    { radius: SKY_RADIUS * 1.55, tessellation: 160, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  groundMask.rotation.x = Math.PI / 2
  groundMask.position.y = -0.75
  groundMask.isPickable = false
  const groundMaskMaterial = new StandardMaterial('sky-engine-ground-mask-material', scene)
  groundMaskMaterial.disableLighting = true
  groundMaskMaterial.diffuseColor = Color3.FromHexString('#04070b')
  groundMaskMaterial.emissiveColor = Color3.FromHexString('#05090f').scale(sunState.phaseLabel === 'Daylight' ? 0.3 : 0.18)
  groundMaskMaterial.alpha = 1
  groundMask.material = groundMaskMaterial
  horizonMeshes.push(groundMask)

  const horizonOccluder = MeshBuilder.CreateCylinder(
    'sky-engine-horizon-occluder',
    { height: 10, diameter: HORIZON_RADIUS * 2.24, tessellation: 128, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  horizonOccluder.position.y = -4.2
  horizonOccluder.isPickable = false
  const horizonOccluderMaterial = new StandardMaterial('sky-engine-horizon-occluder-material', scene)
  horizonOccluderMaterial.disableLighting = true
  horizonOccluderMaterial.diffuseColor = Color3.FromHexString('#06090f')
  horizonOccluderMaterial.emissiveColor = Color3.FromHexString(calibration.horizonColorHex).scale(0.04)
  horizonOccluderMaterial.alpha = 0.96
  horizonOccluder.material = horizonOccluderMaterial
  horizonMeshes.push(horizonOccluder)

  const horizonBand = MeshBuilder.CreateTorus(
    'sky-engine-horizon-band',
    { diameter: HORIZON_RADIUS * 2.02, thickness: 0.28, tessellation: 128 },
    scene,
  )
  horizonBand.rotation.x = Math.PI / 2
  horizonBand.isPickable = false
  const horizonBandMaterial = new StandardMaterial('sky-engine-horizon-band-material', scene)
  horizonBandMaterial.disableLighting = true
  horizonBandMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.28)
  horizonBandMaterial.alpha = calibration.horizonGlowAlpha * 0.92
  horizonBand.material = horizonBandMaterial
  horizonMeshes.push(horizonBand)

  const azimuthRing = MeshBuilder.CreateTorus(
    'sky-engine-horizon-ring',
    { diameter: HORIZON_RADIUS * 2, thickness: 0.12, tessellation: 128 },
    scene,
  )
  azimuthRing.rotation.x = Math.PI / 2
  azimuthRing.isPickable = false
  azimuthRing.isVisible = aidVisibility.azimuthRing
  const azimuthRingMaterial = new StandardMaterial('sky-engine-horizon-ring-material', scene)
  azimuthRingMaterial.disableLighting = true
  azimuthRingMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.7)
  azimuthRingMaterial.alpha = 0.62
  azimuthRing.material = azimuthRingMaterial
  aidMeshes.push(azimuthRing)

  CARDINAL_MARKERS.forEach((marker) => {
    const markerPosition = toSkyPosition(0, marker.azimuthDeg, HORIZON_RADIUS)

    const post = MeshBuilder.CreateCylinder(
      `sky-engine-cardinal-post-${marker.label}`,
      { height: 2.8, diameter: 0.12 },
      scene,
    )
    post.position = new Vector3(markerPosition.x, 1.4, markerPosition.z)
    post.isPickable = false
    post.isVisible = aidVisibility.azimuthRing
    const postMaterial = new StandardMaterial(`sky-engine-cardinal-post-material-${marker.label}`, scene)
    postMaterial.disableLighting = true
    postMaterial.emissiveColor = Color3.FromHexString(calibration.horizonGlowColorHex).scale(0.88)
    postMaterial.alpha = 0.72
    post.material = postMaterial
    aidMeshes.push(post)

    const label = MeshBuilder.CreatePlane(
      `sky-engine-cardinal-label-${marker.label}`,
      { width: 5.6, height: 2.6 },
      scene,
    )
    label.position = new Vector3(markerPosition.x, 4.2, markerPosition.z)
    label.billboardMode = Mesh.BILLBOARDMODE_ALL
    label.isPickable = false
    label.isVisible = aidVisibility.azimuthRing
    const labelMaterial = new StandardMaterial(`sky-engine-cardinal-label-material-${marker.label}`, scene)
    labelMaterial.disableLighting = true
    labelMaterial.backFaceCulling = false
    labelMaterial.diffuseTexture = buildLabelTexture(marker.label, 'cardinal')
    labelMaterial.opacityTexture = labelMaterial.diffuseTexture
    labelMaterial.useAlphaFromDiffuseTexture = true
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
    ring.isPickable = false
    ring.isVisible = aidVisibility.altitudeRings
    ring.color = Color3.FromHexString('#88b7f6')
    ring.alpha = 0.34
    aidMeshes.push(ring)

    const labelPosition = toSkyPosition(altitudeDeg, 315, SKY_RADIUS * 0.994)
    const label = MeshBuilder.CreatePlane(
      `sky-engine-altitude-label-${altitudeDeg}`,
      { width: 5.2, height: 2.2 },
      scene,
    )
    label.position = labelPosition
    label.billboardMode = Mesh.BILLBOARDMODE_ALL
    label.isPickable = false
    label.isVisible = aidVisibility.altitudeRings
    const labelMaterial = new StandardMaterial(`sky-engine-altitude-label-material-${altitudeDeg}`, scene)
    labelMaterial.disableLighting = true
    labelMaterial.backFaceCulling = false
    labelMaterial.diffuseTexture = buildLabelTexture(`${altitudeDeg}°`, 'cardinal')
    labelMaterial.opacityTexture = labelMaterial.diffuseTexture
    labelMaterial.useAlphaFromDiffuseTexture = true
    labelMaterial.emissiveColor = Color3.FromHexString('#b8d5ff')
    labelMaterial.alpha = 0.74
    label.material = labelMaterial
    aidMeshes.push(label)
  })

  SKY_ENGINE_CONSTELLATION_SEGMENTS.forEach((constellation) => {
    constellation.pairs.forEach(([startId, endId], index) => {
      const startObject = objects.find((object) => object.id === startId)
      const endObject = objects.find((object) => object.id === endId)

      if (!startObject || !endObject) {
        return
      }

      const segment = MeshBuilder.CreateLines(
        `sky-engine-constellation-segment-${constellation.id}-${index}`,
        {
          points: [
            toSkyPosition(startObject.altitudeDeg, startObject.azimuthDeg, SKY_RADIUS * 0.997),
            toSkyPosition(endObject.altitudeDeg, endObject.azimuthDeg, SKY_RADIUS * 0.997),
          ],
        },
        scene,
      )
      segment.isPickable = false
      segment.isVisible = aidVisibility.constellations
      segment.color = Color3.FromHexString('#6f90c9')
      segment.alpha = 0.42
      aidMeshes.push(segment)
    })
  })

  return {
    groundTextureMode: 'oras-grass.jpg_tiled',
    groundTextureAssetPath: SKY_ENGINE_GROUND_TEXTURE_URL,
    update(animationTime: number) {
      horizonBandMaterial.alpha = calibration.horizonGlowAlpha * (0.86 + Math.sin(animationTime * 0.3) * 0.04)
      azimuthRingMaterial.alpha = aidVisibility.azimuthRing ? 0.58 + Math.sin(animationTime * 0.45) * 0.03 : 0
    },
    dispose() {
      ;[...horizonMeshes, ...aidMeshes].forEach((mesh) => mesh.dispose())
      groundMaskMaterial.dispose()
      horizonOccluderMaterial.dispose()
      horizonBandMaterial.dispose()
      azimuthRingMaterial.dispose()
    },
  }
}