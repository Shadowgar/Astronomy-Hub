import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import NowAboveMePanel from '../src/components/layout/foundation/NowAboveMePanel'

vi.mock('../src/features/scene/queries', () => ({
  useSceneByScopeDataQuery: () => ({ data: { objects: [] } }),
}))
vi.mock('../src/state/globalUiState', () => ({
  default: () => ({ activeFilter: 'visible_now', selectedObjectId: null, setSelectedObjectId: () => {} }),
}))

describe('Hub to Observe navigation', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('links the Now Above Me action to Observe with supported context', () => {
    vi.stubGlobal('window', { location: { search: '?lat=42&lon=-80&elevation_ft=1200&at=2026-09-27T02%3A00%3A00Z' } })
    const html = renderToStaticMarkup(<MemoryRouter><NowAboveMePanel /></MemoryRouter>)
    expect(html).toContain('See all visible objects')
    expect(html).toContain('href="/observe?lat=42&amp;lon=-80&amp;elevation_ft=1200&amp;at=2026-09-27T02%3A00%3A00Z"')
  })
})
