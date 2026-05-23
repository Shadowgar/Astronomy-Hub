import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = path.resolve(process.cwd(), 'src/features/sky-engine/MirrorProgressPage.tsx')
const routerPath = path.resolve(process.cwd(), 'src/routes/AppRouter.tsx')

describe('mirror progress page', () => {
  it('registers the mirror progress route', () => {
    const source = fs.readFileSync(routerPath, 'utf8')
    expect(source).toContain('/sky-engine/mirror-progress')
  })

  it('renders dataset rows and progress indicators', () => {
    const source = fs.readFileSync(pagePath, 'utf8')
    expect(source).toContain('ORAS Skydata Mirror Manager')
    expect(source).toContain('percent_complete')
    expect(source).toContain('Start Required')
    expect(source).toContain('failed')
    expect(source).toContain('formatEta')
  })

  it('calls backend mirror endpoints and supports autostart query', () => {
    const source = fs.readFileSync(pagePath, 'utf8')
    expect(source).toContain("/api/sky/mirror")
    expect(source).toContain("post('/start'")
    expect(source).toContain("new EventSource(`${API}/stream`)")
    expect(source).toContain("post('/start-all'")
    expect(source).toContain("post('/cancel-all'")
    expect(source).toContain("search.get('autostart') !== '1'")
  })
})
