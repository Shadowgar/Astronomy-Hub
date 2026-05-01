import type { SkyModule } from '../SkyModule'
import { prepareDirectAtmosphereFrame } from '../../../../directBackgroundLayer'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

export function createAtmosphereModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-atmosphere-runtime-module',
    renderOrder: 35,
    render({ runtime, getProps }) {
      const latest = getProps()
      const projectedFrame = runtime.projectedSceneFrame
      const brightnessExposureState = runtime.brightnessExposureState

      if (!projectedFrame || !brightnessExposureState) {
        return
      }

      const atmosphereFrame = prepareDirectAtmosphereFrame(
        projectedFrame.view,
        latest.sunState,
        projectedFrame.currentFovDegrees,
        brightnessExposureState,
      )
      if (latest.debugVisualConfig?.darkSkyOverrideEnabled) {
        runtime.directBackgroundLayer.syncAtmosphere({
          ...atmosphereFrame,
          zenithColorHex: '#050812',
          horizonColorHex: '#0a1328',
          backgroundColorHex: '#03060e',
          twilightBandColorHex: '#0a1020',
          nightFloorTintHex: '#050a17',
          backdropAlpha: 1,
          exposureOpacity: 0.06,
          twilightStrength: 0,
          twilightLowerBandIntensity: 0,
          horizonGlowStrength: 0.08,
          zenithDarkening: 1,
          nightFloorStrength: 0.35,
          patches: [],
          glare: null,
        })
        return
      }
      if (!latest.aidVisibility.atmosphere) {
        runtime.directBackgroundLayer.syncAtmosphere({
          ...atmosphereFrame,
          backdropAlpha: 0,
          exposureOpacity: 0,
          twilightStrength: 0,
          twilightLowerBandIntensity: 0,
          horizonGlowStrength: 0,
          zenithDarkening: 0,
          nightFloorStrength: 0,
          patches: [],
          glare: null,
        })
        return
      }

      runtime.directBackgroundLayer.syncAtmosphere(atmosphereFrame)
    },
  }
}
