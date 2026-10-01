import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-router-dom', async original => ({
  ...await original<typeof import('react-router-dom')>(),
  BrowserRouter: ({children}: {children: ReactNode}) => children,
}))
vi.mock('../src/App', () => ({default: () => <h1>Legacy homepage</h1>}))
vi.mock('../src/features/tonight/queries', () => ({useTonightQuery: () => ({isPending:true,isError:false})}))
vi.mock('../src/features/observe/queries', () => ({useObserveSkyQuery: () => ({isPending:true,isError:false})}))
vi.mock('../src/features/conditions/queries', () => ({useConditionsDataQuery: () => ({isPending:true,isError:false})}))
vi.mock('../src/features/observe/ObservePage', () => ({default: () => <h1>Observe at ORAS</h1>}))
vi.mock('../src/features/tonight/TonightPage', () => ({default: () => <h1>Tonight at ORAS</h1>}))
vi.mock('../src/features/sky-engine/SkyEnginePage', () => ({default: () => <h1>Interactive sky</h1>}))
import AppRouter from '../src/routes/AppRouter'

function render(path:string) { return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><AppRouter/></MemoryRouter>) }
describe('Public application shell', () => {
  for(const [path,label] of [['/','Home'],['/observe','Observe'],['/tonight','Tonight'],['/sky-engine','Sky']]) {
    it(`shares accessible navigation and active ${label} state`, () => {
      const html=render(path)
      expect(html).toContain('aria-label="Primary navigation"')
      expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>${label}</a>`))
      expect(html).toContain('Skip to content')
      expect(html.match(/<main/g)).toHaveLength(1)
      expect(html.match(/<h1/g)).toHaveLength(1)
    })
  }
  it('renders Home decisions immediately while independent modules load', () => {
    const html=render('/')
    for(const text of ['The sky over the','ORAS observatory','Observe now','Plan tonight','Open interactive sky','Planning tonight at ORAS','Checking the sky above ORAS','Checking current conditions']) expect(html).toContain(text)
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('Scope')
  })
  it('keeps supported Observe context on its nav link but clears it for ORAS Tonight', () => {
    const html=render('/observe?lat=42&lon=-80&at=2026-10-02T03%3A00%3A00Z')
    expect(html).toContain('href="/observe?lat=42&amp;lon=-80&amp;at=2026-10-02T03%3A00%3A00Z"')
    expect(html).toContain('href="/tonight"')
    expect(html).not.toContain('/tonight?lat=')
  })
})
