import { describe, expect, it } from 'vitest'

import { isMissingOrasRuntimeDataAsset, isOrasRuntimeSpaPath } from '../vite.config.mjs'

describe('oras runtime SPA fallback', () => {
  it('does not treat same-origin remote-data requests as SPA routes', () => {
    expect(isOrasRuntimeSpaPath('/oras-sky-engine/remote-data/swe-data-packs/minimal/2020-09-01/minimal_2020-09-01_186e7ee2/stars')).toBe(false)
    expect(isOrasRuntimeSpaPath('/oras-sky-engine/remote-data/surveys/dss/v1')).toBe(false)
  })

  it('still treats oras runtime history routes as SPA routes', () => {
    expect(isOrasRuntimeSpaPath('/oras-sky-engine/')).toBe(true)
    expect(isOrasRuntimeSpaPath('/oras-sky-engine/p/calendar')).toBe(true)
  })

  it('does not serve the SPA shell for missing runtime data assets', () => {
    expect(isMissingOrasRuntimeDataAsset('/oras-sky-engine/skydata/packs/extended/stars/Norder99/Dir0/Npix0.eph')).toBe(true)
    expect(isOrasRuntimeSpaPath('/oras-sky-engine/skydata/packs/extended/stars/Norder99/Dir0/Npix0.eph')).toBe(false)
  })
})
