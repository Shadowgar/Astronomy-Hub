import { Atmosphere, AtmospherePhysicalProperties } from '@babylonjs/addons/atmosphere'
import type { Camera } from '@babylonjs/core/Cameras/camera'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline'
import type { Scene } from '@babylonjs/core/scene'

import type { SkyEngineAtmosphereStatus, SkyEngineSunState } from './types'

export interface SkyAtmosphereSetup {
  status: SkyEngineAtmosphereStatus
  dispose: () => void
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
  pipeline.imageProcessing.exposure = calibration.phaseLabel === 'Night' ? 1.06 : 1

  scene.clearColor.set(backgroundColor.r, backgroundColor.g, backgroundColor.b, 1)

  if (!Atmosphere.IsSupported(scene.getEngine())) {
    return {
      status: {
        mode: 'fallback',
        message: `Atmosphere addon was installed but this renderer does not support phase-calibrated atmosphere controls. Babylon fallback sky colors are active while the computed solar light direction, light color, and ambient calibration still drive the scene for ${sunState.phaseLabel.toLowerCase()} conditions.`,
      },
      dispose: () => {
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
    atmosphere.originHeight = 0.43

    return {
      status: {
        mode: 'addon',
        message: `Babylon Atmosphere addon is active and follows the computed solar light with phase-calibrated exposure and aerial perspective for ${sunState.phaseLabel.toLowerCase()} conditions.`,
      },
      dispose: () => {
        atmosphere.dispose()
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
        pipeline.dispose()
        ambientLight.dispose()
        sunLight.dispose()
      },
    }
  }
}