import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const rendererRoot = path.resolve(
  process.cwd(),
  'src/features/sky-engine/engine/sky/renderer',
)

function collectFilesRecursively(rootDir) {
  const output = []
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const absPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      output.push(...collectFilesRecursively(absPath))
      continue
    }
    output.push(absPath)
  }
  return output
}

describe('stellarium renderer boundary guardrails', () => {
  it('new renderer boundary folder has no Babylon dependency', () => {
    const files = collectFilesRecursively(rendererRoot)
    const textFiles = files.filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.js'))

    const offenders = []
    for (const filePath of textFiles) {
      const source = fs.readFileSync(filePath, 'utf8')
      if (/(@babylonjs|babylonjs)/i.test(source)) {
        offenders.push(path.relative(process.cwd(), filePath))
      }
    }

    expect(offenders).toEqual([])
  })

  it('directStarLayer legacy path remains present and unchanged in role', () => {
    const directStarLayerPath = path.resolve(process.cwd(), 'src/features/sky-engine/directStarLayer.ts')
    const source = fs.readFileSync(directStarLayerPath, 'utf8')

    expect(source).toContain("from '@babylonjs/core/")
    expect(source).toContain('export function createDirectStarLayer')
    expect(source).toContain('thinInstance')
  })
})
