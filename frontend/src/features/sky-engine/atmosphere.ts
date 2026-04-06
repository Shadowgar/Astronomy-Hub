import { Atmosphere, AtmospherePhysicalProperties } from '@babylonjs/addons/atmosphere'
import type { Camera } from '@babylonjs/core/Cameras/camera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'
import type { Scene } from '@babylonjs/core/scene'

import type { SkyEngineAtmosphereStatus, SkyEngineSunState } from './types'

export interface SkyAtmosphereSetup {
  status: SkyEngineAtmosphereStatus
  dispose: () => void
}

function buildSkyGradientTexture(name: string, sunState: SkyEngineSunState) {
  const texture = new DynamicTexture(name, { width: 1024, height: 1024 }, undefined, true)
  texture.hasAlpha = false

  const context = texture.getContext() as CanvasRenderingContext2D
  const gradient = context.createLinearGradient(0, 0, 0, 1024)
  const calibration = sunState.visualCalibration

  gradient.addColorStop(0, calibration.skyZenithColorHex)
  gradient.addColorStop(0.5, calibration.backgroundColorHex)
  gradient.addColorStop(0.74, calibration.twilightBandColorHex)
  gradient.addColorStop(0.9, calibration.skyHorizonColorHex)
  gradient.addColorStop(0.98, calibration.horizonGlowColorHex)

  context.clearRect(0, 0, 1024, 1024)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)

  if (sunState.phaseLabel !== 'Daylight') {
    const glow = context.createRadialGradient(512, 794, 80, 512, 794, sunState.phaseLabel === 'Low Sun' ? 300 : 240)
    const glowColor = Color3.FromHexString(calibration.horizonGlowColorHex)
    const colorString = `${Math.round(glowColor.r * 255)}, ${Math.round(glowColor.g * 255)}, ${Math.round(glowColor.b * 255)}`
    glow.addColorStop(0, `rgba(${colorString}, ${calibration.horizonGlowAlpha * (sunState.phaseLabel === 'Low Sun' ? 0.72 : 0.18)})`)
    glow.addColorStop(0.56, `rgba(${colorString}, ${calibration.horizonGlowAlpha * 0.08})`)
    glow.addColorStop(1, `rgba(${colorString}, 0)`)
    context.fillStyle = glow
    context.fillRect(0, 0, 1024, 1024)
  }

  texture.update()
  return texture
}

export function setupSkyAtmosphere(scene: Scene, camera: Camera, sunState: SkyEngineSunState): SkyAtmosphereSetup {
  const calibration = sunState.visualCalibration
  const directionalColor = Color3.FromHexString(calibration.directionalLightColorHex)
  const ambientColor = Color3.FromHexString(calibration.ambientLightColorHex)
  const backgroundColor = Color3.FromHexString(calibration.backgroundColorHex)
  const sunLight = new DirectionalLight(
    'sky-engine-sun',
    new Vector3(sunState.lightDirection.x, sunState.lightDirection.y, sunState.lightDirection.z),
    scene,
  )
  sunLight.intensity = calibration.directionalLightIntensity
  sunLight.diffuse = directionalColor
  sunLight.specular = Color3.Lerp(directionalColor, Color3.White(), 0.35)

  const ambientLight = new HemisphericLight('sky-engine-ambient', new Vector3(0, 1, 0), scene)
  ambientLight.intensity = calibration.ambientLightIntensity
  ambientLight.diffuse = ambientColor
  ambientLight.groundColor = backgroundColor.scale(0.45)

  const pipeline = new DefaultRenderingPipeline('sky-engine-rendering', true, scene, [camera])
  pipeline.imageProcessingEnabled = true
  pipeline.imageProcessing.toneMappingEnabled = true
  pipeline.imageProcessing.ditheringEnabled = true
  pipeline.imageProcessing.exposure = calibration.atmosphereExposure
  let imageContrast = 1

  if (calibration.phaseLabel === 'Night') {
    imageContrast = 1.08
  } else if (calibration.phaseLabel === 'Low Sun') {
    imageContrast = 1.02
  }

  pipeline.imageProcessing.contrast = imageContrast

  scene.clearColor.set(backgroundColor.r, backgroundColor.g, backgroundColor.b, 1)

  const skyDome = MeshBuilder.CreateSphere(
    'sky-engine-sky-dome',
    { diameter: 1500, segments: 48, sideOrientation: Mesh.BACKSIDE },
    scene,
  )
  skyDome.isPickable = false
  skyDome.infiniteDistance = true

  const skyDomeTexture = buildSkyGradientTexture('sky-engine-sky-gradient', sunState)
  const skyDomeMaterial = new StandardMaterial('sky-engine-sky-dome-material', scene)
  skyDomeMaterial.disableLighting = true
  skyDomeMaterial.backFaceCulling = false
  skyDomeMaterial.emissiveTexture = skyDomeTexture
  skyDomeMaterial.emissiveColor = Color3.White()
  skyDomeMaterial.diffuseColor = Color3.Black()
  skyDomeMaterial.specularColor = Color3.Black()
  skyDome.material = skyDomeMaterial

  if (!Atmosphere.IsSupported(scene.getEngine())) {
    return {
      status: {
        mode: 'fallback',
        message: `Atmosphere addon was installed but this renderer does not support phase-calibrated atmosphere controls. Babylon fallback sky colors are active while the computed solar light direction, light color, and ambient calibration still drive the scene for ${sunState.phaseLabel.toLowerCase()} conditions.`,
      },
      dispose: () => {
        skyDomeTexture.dispose()
        skyDomeMaterial.dispose()
        skyDome.dispose(false, true)
        pipeline.dispose()
        ambientLight.dispose()
        sunLight.dispose()
      },
    }
  }

  try {
    const physicalProperties = new AtmospherePhysicalProperties()
    physicalProperties.mieScatteringScale = calibration.atmosphereMieScatteringScale
    physicalProperties.peakMieScattering = new Vector3(0.0044, 0.0041, 0.0038)

    const atmosphere = new Atmosphere('sky-engine-atmosphere', scene, [sunLight], {
      physicalProperties,
      isLinearSpaceComposition: true,
      isLinearSpaceLight: true,
      minimumMultiScatteringIntensity: 0.08,
      multiScatteringIntensity: calibration.atmosphereMultiScatteringIntensity,
      aerialPerspectiveIntensity: calibration.atmosphereAerialPerspectiveIntensity,
      diffuseSkyIrradianceIntensity: 1,
      additionalDiffuseSkyIrradianceIntensity: 0.16,
      additionalDiffuseSkyIrradianceColor: new Color3(0.08, 0.12, 0.2),
    })

    atmosphere.exposure = calibration.atmosphereExposure
    atmosphere.originHeight = 0.4

    return {
      status: {
        mode: 'addon',
        message: `Babylon Atmosphere addon is active and follows the computed solar light with phase-calibrated exposure and aerial perspective for ${sunState.phaseLabel.toLowerCase()} conditions.`,
      },
      dispose: () => {
        atmosphere.dispose()
        skyDomeTexture.dispose()
        skyDomeMaterial.dispose()
        skyDome.dispose(false, true)
        pipeline.dispose()
        ambientLight.dispose()
        sunLight.dispose()
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown atmosphere initialization failure.'
    return {
      status: {
        mode: 'fallback',
        message: `Atmosphere addon initialization failed, so only the computed solar light and background calibration are active. Phase-specific atmosphere response could not be applied. ${message}`,
      },
      dispose: () => {
        skyDomeTexture.dispose()
        skyDomeMaterial.dispose()
        skyDome.dispose(false, true)
        pipeline.dispose()
        ambientLight.dispose()
        sunLight.dispose()
      },
    }
  }
}