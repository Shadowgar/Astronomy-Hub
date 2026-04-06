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
  const sunLight = new DirectionalLight(
    'sky-engine-sun',
    new Vector3(sunState.lightDirection.x, sunState.lightDirection.y, sunState.lightDirection.z),
    scene,
  )
  sunLight.intensity = sunState.isAboveHorizon ? Math.PI : 0.08
  sunLight.diffuse = new Color3(1, 0.92, 0.82)
  sunLight.specular = new Color3(1, 0.88, 0.78)

  const ambientLight = new HemisphericLight('sky-engine-ambient', new Vector3(0, 1, 0), scene)
  ambientLight.intensity = sunState.isAboveHorizon ? 0.22 : 0.08
  ambientLight.groundColor = new Color3(0.03, 0.04, 0.07)

  const pipeline = new DefaultRenderingPipeline('sky-engine-rendering', true, scene, [camera])
  pipeline.imageProcessingEnabled = true
  pipeline.imageProcessing.toneMappingEnabled = true
  pipeline.imageProcessing.ditheringEnabled = true

  scene.clearColor.set(0.015, 0.024, 0.052, 1)

  if (!Atmosphere.IsSupported(scene.getEngine())) {
    return {
      status: {
        mode: 'fallback',
        message: `Atmosphere addon was installed but this renderer does not support it. Babylon fallback sky colors are active while the computed solar light direction still drives the scene light. Sun is ${sunState.phaseLabel.toLowerCase()}.`,
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
    physicalProperties.mieScatteringScale = 1.1
    physicalProperties.peakMieScattering = new Vector3(0.0044, 0.0041, 0.0038)

    const atmosphere = new Atmosphere('sky-engine-atmosphere', scene, [sunLight], {
      physicalProperties,
      isLinearSpaceComposition: true,
      isLinearSpaceLight: true,
      minimumMultiScatteringIntensity: 0.08,
      multiScatteringIntensity: 1.15,
      aerialPerspectiveIntensity: 0.45,
      diffuseSkyIrradianceIntensity: 1,
      additionalDiffuseSkyIrradianceIntensity: 0.16,
      additionalDiffuseSkyIrradianceColor: new Color3(0.08, 0.12, 0.2),
    })

    atmosphere.exposure = 1
    atmosphere.originHeight = 0.43

    return {
      status: {
        mode: 'addon',
        message: `Babylon Atmosphere addon is active and uses the computed solar directional light for ${sunState.phaseLabel.toLowerCase()} conditions.`,
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
        message: `Atmosphere addon initialization failed. Babylon fallback sky colors are active while the computed solar directional light still drives the scene. ${message}`,
      },
      dispose: () => {
        pipeline.dispose()
        ambientLight.dispose()
        sunLight.dispose()
      },
    }
  }
}