import type { SkyModule } from '../SkyModule'
import type { ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices } from '../../../../SkyEngineRuntimeBridge'

/**
 * Stellarium `movements` module (`modules/movements.c`): `render_order` -1.
 * Pointer / wheel handling lives in `SkyInputService`; this module reserves the control spine slot.
 */
export function createMovementsRuntimeModule(): SkyModule<ScenePropsSnapshot, SceneRuntimeRefs, SkySceneRuntimeServices> {
  return {
    id: 'movements',
    renderOrder: -1,
  }
}
