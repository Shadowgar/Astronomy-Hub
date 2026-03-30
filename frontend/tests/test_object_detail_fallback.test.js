import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/features/objects/queries.ts', async () => {
  const actual = await vi.importActual('../src/features/objects/queries.ts')
  return {
    ...actual,
    useObjectDetailDataQuery: vi.fn(),
  }
})

import ObjectDetail from '../src/components/ObjectDetail.jsx'
import { useObjectDetailDataQuery } from '../src/features/objects/queries.ts'

describe('ObjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders error fallback when object detail query fails', () => {
    vi.mocked(useObjectDetailDataQuery).mockReturnValue({
      isLoading: false,
      isError: true,
      error: { message: 'network unavailable' },
      data: null,
    })

    const html = renderToStaticMarkup(
      React.createElement(ObjectDetail, { objectId: 'mars' })
    )

    expect(useObjectDetailDataQuery).toHaveBeenCalledWith('mars')
    expect(html).toContain('Error loading detail: network unavailable')
  })
})
