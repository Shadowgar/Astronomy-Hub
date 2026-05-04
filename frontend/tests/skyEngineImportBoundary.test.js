import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(process.cwd(), 'src')
const skyEngineRoot = path.resolve(srcRoot, 'features/sky-engine')
const sourceFilePattern = /\.(js|jsx|ts|tsx)$/
const forbiddenPatterns = [
  /directStarLayer/,
  /WebGL2StarsOwner/,
  /WebGL2StarsHarness/,
  /painterPort/,
  /StarsModule/,
  /runtimeFrame/,
  /@babylonjs/,
  /babylon/i,
  /resetRenderer/,
  /renderer reset/i,
  /pages\/stellariumWebUiAssets/,
]

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

describe('sky-engine import boundary', () => {
  it('does not reference deleted renderer concepts or Babylon', () => {
    const sourceFiles = collectFiles(skyEngineRoot)
    const offenders = sourceFiles.flatMap((filePath) => {
      const source = fs.readFileSync(filePath, 'utf8')
      const matches = forbiddenPatterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${normalizeForReport(filePath)} :: ${pattern}`)

      return matches
    })

    expect(offenders).toEqual([])
  })
})