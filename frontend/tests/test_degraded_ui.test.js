import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/features/conditions/queries.ts', async () => {
  const actual = await vi.importActual('../src/features/conditions/queries.ts')
  return {
    ...actual,
    useConditionsDataQuery: vi.fn(),
  }
})

import MoonSummary from '../src/components/MoonSummary.jsx'
import { normalizeConditionsPayload, useConditionsDataQuery } from '../src/features/conditions/queries.ts'

describe('MoonSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders expected output when given normalized payload from query boundary', () => {
    const normalized = normalizeConditionsPayload({
      data: {
        moon_phase: 'Waxing Gibbous',
        darkness_window: {
          start: '2026-03-30T02:00:00Z',
          end: '2026-03-30T04:00:00Z',
        },
        summary: 'Clear skies expected',
      },
    })

    vi.mocked(useConditionsDataQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: normalized,
    })

    const html = renderToStaticMarkup(
      React.createElement(MoonSummary, { locationQuery: '?lat=41.3&lon=-79.5' })
    )

    expect(useConditionsDataQuery).toHaveBeenCalledWith({
      lat: '41.3',
      lon: '-79.5',
      elevation_ft: undefined,
    })
    expect(html).toContain('Moon Summary')
    expect(html).toContain('Waxing Gibbous')
    expect(html).toContain('Notes: Clear skies expected')
  })
})
