import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(process.cwd(), 'src')
const placeholderRoot = path.resolve(srcRoot, 'features/stellarium-sky')
const sourceFilePattern = /\.(js|jsx|ts|tsx)$/

function collectFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      return collectFiles(fullPath)
    }
    return sourceFilePattern.test(entry.name) ? [fullPath] : []
  })
}

function normalizeForReport(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/')
}

describe('stellarium sky purge guards', () => {
  it('placeholder feature does not reach into the deleted legacy tree', () => {
    const placeholderFiles = collectFiles(placeholderRoot)
    const offenders = placeholderFiles.filter((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8')
      return source.includes('features/sky-engine') || source.includes('@babylonjs')
    })

    expect(offenders.map(normalizeForReport)).toEqual([])
  })

  it('active frontend source does not import deleted sky-engine or Babylon code', () => {
    const sourceFiles = collectFiles(srcRoot)
    const offenders = sourceFiles.filter((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8')
      return (
        source.includes('features/sky-engine') ||
        source.includes('pages/SkyEnginePage') ||
        source.includes('pages/stellariumWebUiAssets') ||
        source.includes('@babylonjs')
      )
    })

    expect(offenders.map(normalizeForReport)).toEqual([])
  })
})