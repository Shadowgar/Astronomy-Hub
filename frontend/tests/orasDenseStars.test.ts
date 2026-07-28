import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  createOrasDenseStarsManager,
  registerOrasStarCatalogChain,
} from '../../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_dense_stars.js'

const repoRoot = path.resolve(process.cwd(), '..')
const appVuePath = path.resolve(
  repoRoot,
  'vendor/stellarium-web-engine/apps/web-frontend/src/App.vue'
)
const denseStarsAssetPath = path.resolve(
  repoRoot,
  'vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_dense_stars.js'
)
const denseStarsDialogPath = path.resolve(
  repoRoot,
  'vendor/stellarium-web-engine/apps/web-frontend/src/components/oras-dense-stars-status-dialog.vue'
)
const denseStarsValidationScriptPath = path.resolve(
  repoRoot,
  'scripts/skydata/validate_oras_dense_stars.js'
)
const nativeStarsSourcePath = path.resolve(
  repoRoot,
  'vendor/stellarium-web-engine/src/modules/stars.c'
)

describe('ORAS dense native star runtime integration', () => {
  it('registers the selected mounted native dense star profile with SWE after manifest validation', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain("import { orasDenseStars, registerOrasStarCatalogChain } from '@/assets/oras_dense_stars.js'")
    expect(source).toContain('orasDenseStars.load()')
    expect(source).toContain('that.starDataSourcesReady = registerOrasStarCatalogChain(core')
  })

  it('replaces stock bright packs with one canonical profile and keeps Gaia as the faint continuation', async () => {
    const calls: Array<{ url: string, key?: string }> = []
    const manager = {
      setProfile: () => {},
      load: async () => {},
      isReadyForNativeRegistration: () => true,
      getSurveyRoot: () => '/dense/profiles/visual-default',
      getSurveyKey: () => 'oras-dense-stars-visual-default',
    }
    const result = await registerOrasStarCatalogChain(
      { stars: { addDataSource: (source: { url: string, key?: string }) => calls.push(source) } },
      {
        manager,
        profile: 'visual-default',
        fallbackRoots: ['/packs/minimal', '/packs/base', '/packs/extended'],
        gaiaRoot: '/surveys/gaia/v1',
      },
    )

    expect(result.mode).toBe('canonical_replacement')
    expect(calls).toEqual([
      { url: '/dense/profiles/visual-default', key: 'oras-dense-stars-visual-default' },
      { url: '/surveys/gaia/v1', key: 'gaia' },
    ])
  })

  it('uses the stock bright chain only when the mounted canonical profile is unavailable or off', async () => {
    const calls: Array<{ url: string, key?: string }> = []
    const manager = {
      setProfile: () => {},
      load: async () => {},
      isReadyForNativeRegistration: () => false,
    }
    const result = await registerOrasStarCatalogChain(
      { stars: { addDataSource: (source: { url: string, key?: string }) => calls.push(source) } },
      {
        manager,
        profile: 'off',
        fallbackRoots: ['/packs/minimal', '/packs/base'],
        gaiaRoot: '/surveys/gaia/v1',
      },
    )

    expect(result.mode).toBe('stock_fallback')
    expect(calls).toEqual([
      { url: '/packs/minimal/stars' },
      { url: '/packs/base/stars' },
      { url: '/surveys/gaia/v1', key: 'gaia' },
    ])
  })

  it('suppresses survey labels without removing native star identities', () => {
    const source = fs.readFileSync(nativeStarsSourcePath, 'utf8')

    expect(source).toContain('bool    show_labels;')
    expect(source).toContain('properties_get_bool(args, "oras_show_labels", true)')
    expect(source).toContain('survey->show_labels')
  })

  it('exposes visible dense stars profile controls instead of a deep all-sky default toggle', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')
    const dialog = fs.readFileSync(denseStarsDialogPath, 'utf8')

    expect(source).toContain('<oras-dense-stars-status-dialog v-model="showDenseStars"')
    expect(source).toContain("title: this.$t('ORAS Dense Stars')")
    expect(source).toContain("action: 'denseStars'")
    expect(source).toContain("profile: 'off'")
    expect(source).toContain("profile: 'visual-default'")
    expect(source).toContain("profile: 'binocular'")
    expect(source).toContain("profile: 'deep-catalog'")
    expect(source).toContain("Dense Stars: Visual Sky")
    expect(source).toContain("Dense Stars: Binocular Depth")
    expect(source).not.toContain("store_var_name: 'showOrasDenseStars'")
    expect(dialog).toContain('Dense Stars')
    expect(dialog).toContain('native SWE star tiles')
    expect(dialog).toContain('missing generated dense star release')
    expect(dialog).toContain('Visual Sky is the realistic default')
    expect(dialog).toContain('Binocular Depth')
    expect(dialog).toContain('Active profile')
    expect(dialog).toContain('Labels')
  })

  it('dense star manager defaults to visual profile and loads only the selected profile natively', () => {
    const source = fs.readFileSync(denseStarsAssetPath, 'utf8')

    expect(source).toContain("ORAS_DENSE_STARS_ROOT = '/oras-sky-engine/skydata/dense-star-tiles'")
    expect(source).toContain("fetchImpl(root + '/manifest.json'")
    expect(source).not.toContain('Npix')
    expect(source).not.toContain('.eph')
    expect(source).toContain("renderingPath: 'native_swe_star_tiles'")
    expect(source).toContain("DEFAULT_PROFILE = 'visual-default'")
    expect(source).toContain("OFF_PROFILE = 'off'")
    expect(source).toContain('activeProfile')
    expect(source).toContain('getSurveyKey')
    expect(source).toContain('subscribe')
  })

  it('does not mark invalid dense star manifests as native-registration ready', async () => {
    const manager = createOrasDenseStarsManager({
      fetchImpl: async () => ({
        ok: true,
        text: async () => JSON.stringify({
          schema_version: 1,
          rendering_path: 'native_swe_star_tiles',
          source_id_type: 'string',
          default_profile: 'bad-default',
          profiles: {}
        })
      })
    })

    await manager.load()
    const snapshot = manager.getSnapshot()

    expect(snapshot.phase).toBe('failed')
    expect(manager.isReadyForNativeRegistration()).toBe(false)
  })

  it('browser validation checks profiles, label count, brightness, and native tile loading', () => {
    const source = fs.readFileSync(denseStarsValidationScriptPath, 'utf8')

    expect(source).toContain('ORAS Dense Stars')
    expect(source).toContain('visual-default')
    expect(source).toContain('deep-catalog')
    expect(source).toContain('validateDenseStars')
    expect(source).toContain('getDenseStarManifest')
    expect(source).toContain('labelCount')
    expect(source).toContain('capturePageArtifact')
    expect(source).toContain('computeScreenshotMetrics')
    expect(source).toContain('waitForRuntimeHttp')
    expect(source).toContain("const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`")
    expect(source).toContain('async function waitForRuntimeHttp (url = normalizedBaseUrl)')
    expect(source).not.toContain('hardVisualThresholds')
    expect(source).toContain('DENSE_STAR_QA_FIELDS')
    expect(source).toContain('dense-stars-qa-summary.json')
    expect(source).toContain('maxBrightBlobArea')
    expect(source).toContain('brightPixelRatio')
    expect(source).toContain('addedBrightPixelRatio')
    expect(source).toContain('profileResourceCount')
  })
})
