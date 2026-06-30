import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

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

describe('ORAS dense native star runtime integration', () => {
  it('registers mounted native dense star tiles with SWE after manifest validation', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')

    expect(source).toContain("import { orasDenseStars } from '@/assets/oras_dense_stars.js'")
    expect(source).toContain('orasDenseStars.load()')
    expect(source).toContain('that.registerOrasDenseStarSurvey(core)')
    expect(source).toContain("core.stars.addDataSource({ url: orasDenseStars.getSurveyRoot(), key: 'oras-dense-stars' })")
  })

  it('exposes a visible dense stars status dialog and toggle', () => {
    const source = fs.readFileSync(appVuePath, 'utf8')
    const dialog = fs.readFileSync(denseStarsDialogPath, 'utf8')

    expect(source).toContain('<oras-dense-stars-status-dialog v-model="showDenseStars"')
    expect(source).toContain("title: this.$t('ORAS Dense Stars')")
    expect(source).toContain("action: 'denseStars'")
    expect(source).toContain("store_var_name: 'showOrasDenseStars'")
    expect(dialog).toContain('Dense Stars')
    expect(dialog).toContain('native SWE star tiles')
    expect(dialog).toContain('missing generated dense star release')
  })

  it('dense star manager loads manifest only at startup and chunks stay native-loaded by SWE', () => {
    const source = fs.readFileSync(denseStarsAssetPath, 'utf8')

    expect(source).toContain("ORAS_DENSE_STARS_ROOT = '/oras-sky-engine/skydata/dense-star-tiles'")
    expect(source).toContain("fetchImpl(root + '/manifest.json'")
    expect(source).not.toContain('Npix')
    expect(source).not.toContain('.eph')
    expect(source).toContain("renderingPath: 'native_swe_star_tiles'")
    expect(source).toContain('enabled')
    expect(source).toContain('subscribe')
  })

  it('browser validation checks dense status, toggle, and native tile loading', () => {
    const source = fs.readFileSync(denseStarsValidationScriptPath, 'utf8')

    expect(source).toContain('ORAS Dense Stars')
    expect(source).toContain('showOrasDenseStars')
    expect(source).toContain('validateDenseStars')
    expect(source).toContain('getDenseStarManifest')
    expect(source).toContain('releaseStarCount')
    expect(source).toContain('enabledDenseResourceCount')
  })
})
