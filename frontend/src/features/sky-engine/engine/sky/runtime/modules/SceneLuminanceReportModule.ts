import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'
import { evaluateSceneLuminanceReport } from '../luminanceReport'
import type { SkyModule } from '../SkyModule'

export function createSceneLuminanceReportModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'sky-scene-luminance-report-runtime-module',
    renderOrder: 4,
    update({ runtime, services, getProps }) {
      const report = evaluateSceneLuminanceReport(getProps(), services)
      runtime.sceneLuminanceReport = report
      runtime.runtimePerfTelemetry.latest = {
        ...runtime.runtimePerfTelemetry.latest,
        stepMs: {
          ...runtime.runtimePerfTelemetry.latest.stepMs,
          sceneLuminanceSkyContributor: report.sky,
          sceneLuminanceStarContributor: report.stars,
          sceneLuminanceSolarSystemContributor: report.solarSystem,
          sceneLuminanceTarget: report.target,
          sceneLuminanceStarSampleCount: report.starSampleCount,
          sceneLuminanceSolarSystemSampleCount: report.solarSystemSampleCount,
        },
      }
    },
  }
}
