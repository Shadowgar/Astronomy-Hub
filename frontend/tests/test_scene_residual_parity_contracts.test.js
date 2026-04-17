import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const OVERLAY_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/OverlayRuntimeModule.ts')
const POINTER_RUNTIME_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/PointerRuntimeModule.ts')

describe('residual scene parity contracts', () => {
  it('uses runtime scene timestamp for overlay coordinate conversions', () => {
    const source = fs.readFileSync(OVERLAY_RUNTIME_MODULE_PATH, 'utf8')
    expect(source).toContain('services.clockService.getSceneTimestampIso()')
    expect(source).not.toContain('latest.initialSceneTimestampIso')
  })

  it('skips pointer top stroke when selected label is rendered', () => {
    const source = fs.readFileSync(POINTER_RUNTIME_MODULE_PATH, 'utf8')
    expect(source).toContain('const hasSelectedLabel = runtime.visibleLabelIds.includes(selectedObjectId)')
    expect(source).toContain('hasSelectedLabel')
  })
})
