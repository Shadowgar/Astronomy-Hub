import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, BrowserRouter: ({ children }: { children: ReactNode }) => children }
})
vi.mock('../src/features/observe/ObservePage', () => ({
  default: () => <h1>Observe route matched</h1>,
}))
vi.mock('../src/App', () => ({ default: () => null }))

import AppRouter from '../src/routes/AppRouter'

describe('Observe route', () => {
  it('renders the dedicated page at /observe', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/observe']}><AppRouter /></MemoryRouter>)
    expect(html).toContain('Observe route matched')
  })
})
