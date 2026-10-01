import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
vi.mock('react-router-dom',async importOriginal=>{
 const actual=await importOriginal<typeof import('react-router-dom')>()
 return {...actual,BrowserRouter:({children}:{children:ReactNode})=>children}
})
vi.mock('../src/features/tonight/TonightPage',()=>({default:()=> <h1>Tonight route matched</h1>}))
vi.mock('../src/App',()=>({default:()=>null}))
import AppRouter from '../src/routes/AppRouter'
import { readFileSync } from 'node:fs'
describe('Tonight route and public navigation',()=>{
 it('matches direct /tonight refresh with date query',()=>{
  const html=renderToStaticMarkup(<MemoryRouter initialEntries={['/tonight?date=2026-10-01']}><AppRouter/></MemoryRouter>)
  expect(html).toContain('Tonight route matched')
 })
 it('links from Hub and Observe and back to both',()=>{
  for (const path of ['src/components/layout/foundation/TopControlBar.jsx','src/components/shell/OrasAppShell.tsx']) expect(readFileSync(new URL('../'+path,import.meta.url),'utf8')).toMatch(/(?:to="\/tonight"|tonightPath)/)
  const page=readFileSync(new URL('../src/components/shell/OrasAppShell.tsx',import.meta.url),'utf8')
  expect(page).toContain('observePath');expect(page).toContain('to="/"')
 })
})
