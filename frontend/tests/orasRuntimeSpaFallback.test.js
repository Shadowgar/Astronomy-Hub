import { describe, expect, it, vi } from 'vitest'

import {
  getOrasRuntimeRemoteFallbackPath,
  isMissingOrasRuntimeDataAsset,
  isOrasRuntimeSpaPath,
  serveOrasRuntimeRequest,
} from '../vite.config.mjs'

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

  it('does not treat existing extensionless runtime data assets as SPA routes', () => {
    const req = {
      url: '/oras-sky-engine/skydata/packs/base/stars/properties',
    }
    const res = {
      setHeader: vi.fn(),
      end: vi.fn(),
    }
    const next = vi.fn()

    serveOrasRuntimeRequest(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8')
    expect(res.end).toHaveBeenCalledOnce()
  })

  it('falls back missing known runtime assets to the public Stellarium CDN proxy', () => {
    expect(getOrasRuntimeRemoteFallbackPath('/oras-sky-engine/skydata/surveys/dss/v1/Norder99/Dir0/Npix0.webp'))
      .toBe('/oras-sky-engine/remote-data/surveys/dss/v1/Norder99/Dir0/Npix0.webp')
    expect(getOrasRuntimeRemoteFallbackPath('/oras-sky-engine/skydata/packs/extended/dso/Norder2/Dir0/Npix10.eph'))
      .toBeUndefined()
    expect(getOrasRuntimeRemoteFallbackPath('/oras-sky-engine/skydata/surveys/sso/moon/Norder1/Dir0/Npix0.webp'))
      .toBe('/oras-sky-engine/remote-data/surveys/sso/moon/v1/Norder1/Dir0/Npix0.webp')
  })
})
