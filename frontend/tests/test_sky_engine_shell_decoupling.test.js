import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const SKY_ENGINE_PAGE_PATH = path.resolve(process.cwd(), 'src/pages/SkyEnginePage.tsx')
const SKY_ENGINE_SCENE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineScene.tsx')
const SKY_ENGINE_SNAPSHOT_STORE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/SkyEngineSnapshotStore.ts')
const SCENE_REPORTING_MODULE_PATH = path.resolve(process.cwd(), 'src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts')

describe('sky engine shell decoupling', () => {
  it('polls runtime snapshots on a fixed cadence instead of subscribing React to the engine loop', () => {
    const pageSource = fs.readFileSync(SKY_ENGINE_PAGE_PATH, 'utf8')
    const snapshotStoreSource = fs.readFileSync(SKY_ENGINE_SNAPSHOT_STORE_PATH, 'utf8')

    expect(pageSource).toContain('useSkyEngineSnapshotPoll(snapshotStore)')
    expect(pageSource).not.toContain('useSkyEngineSnapshot(snapshotStore)')
    expect(snapshotStoreSource).toContain('SKY_ENGINE_SNAPSHOT_POLL_CADENCE_MS = 200')
    expect(snapshotStoreSource).toContain('setInterval(pollSnapshot, cadenceMs)')
    expect(snapshotStoreSource).not.toContain('useSyncExternalStore')
  })

  it('keeps shell telemetry and runtime sync on fixed timers instead of requestAnimationFrame', () => {
    const pageSource = fs.readFileSync(SKY_ENGINE_PAGE_PATH, 'utf8')
    const sceneSource = fs.readFileSync(SKY_ENGINE_SCENE_PATH, 'utf8')
    const reportingSource = fs.readFileSync(SCENE_REPORTING_MODULE_PATH, 'utf8')

    expect(pageSource).toContain('const UI_PERF_REPORTING_CADENCE_MS = 250')
    expect(pageSource).toContain('const intervalHandle = globalThis.setInterval(sampleMetrics, UI_PERF_REPORTING_CADENCE_MS)')
    expect(pageSource).toContain('const SkyEngineViewport = React.memo(function SkyEngineViewport(')
    expect(pageSource).not.toContain('requestAnimationFrame(onFrame)')
    expect(sceneSource).toContain('const RUNTIME_MODEL_SYNC_CADENCE_MS = 200')
    expect(sceneSource).toContain('const syncIntervalHandle = globalThis.setInterval(() => {')
    expect(sceneSource).not.toContain('requestAnimationFrame(pumpSnapshotSync)')
    expect(reportingSource).toContain('const REPORTING_CADENCE_MS = 250')
  })
})