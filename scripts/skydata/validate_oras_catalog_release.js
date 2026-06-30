const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const apiBaseUrl = process.env.ORAS_API_BASE_URL || 'http://127.0.0.1:8000'
const timeoutMs = Number(process.env.ORAS_CATALOG_RELEASE_TIMEOUT_MS || 240000)
const artifactRoot = path.resolve(process.env.ORAS_CATALOG_RELEASE_ARTIFACT_DIR || 'output/playwright/catalog-release')
const satelliteParsePattern = /Parsed (\d+) satellites/

const apiSearchCases = [
  { query: 'M31', expected: 'Andromeda Galaxy' },
  { query: 'Caldwell 6', expected: "Cat's Eye Nebula" },
  { query: 'NGC6543', expected: 'NGC6543' },
  { query: 'IC5070', expected: 'Pelican Nebula' },
  { query: 'LBN350', expected: 'LBN350' },
  { query: 'Collinder 140', expected: 'Collinder140' },
  { query: 'Gaia DR3', expectedCatalog: 'Gaia DR3' },
  { query: 'TYC 1-1015-1', expectedCatalog: 'Tycho-2' },
  { query: 'Gliese 1', expectedCatalog: 'Gliese CNS3' },
  { query: 'WDS ', expectedCatalog: 'Washington Double Star' },
  { query: 'STF 1', expectedCatalog: 'Washington Double Star' },
  { query: 'PSR J0437-4715', expectedCatalog: 'ATNF Pulsar' },
  { query: 'SDSS J000000.15+353104.2', expectedCatalog: 'Milliquas 7.2' },
  { query: 'IGR J17454-2919', expectedCatalog: 'BlackCAT' },
]

const browserSearchCases = [
  {
    query: 'Gaia DR3',
    expectedCatalog: 'Gaia DR3',
    artifact: 'enriched-star.png',
  },
  {
    query: 'Caldwell 6',
    expectedText: "Cat's Eye Nebula",
    expectedCatalog: 'NGC (OpenNGC)',
    artifact: 'enriched-dso.png',
    requireUnavailableProperties: true,
    requireCatalogPack: false,
  },
  {
    query: 'STF 1',
    expectedText: 'STF 1',
    expectedCatalog: 'Washington Double Star',
    artifact: 'double-star.png',
  },
  {
    query: 'PSR J0437-4715',
    expectedText: 'PSR J0437-4715',
    expectedCatalog: 'ATNF Pulsar',
    artifact: 'unusual-pulsar.png',
  },
  {
    query: 'IGR J17454-2919',
    expectedText: 'IGR J17454-2919',
    expectedCatalog: 'BlackCAT',
    artifact: 'black-hole-candidate.png',
  },
]

function apiUrl (route) {
  return new URL(route, apiBaseUrl).toString()
}

async function fetchJson (url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`${url} returned ${response.status}: ${JSON.stringify(body)}`)
    return body
  } finally {
    clearTimeout(timeout)
  }
}

async function writeElementTextArtifact (page, selector, filename) {
  const target = page.locator(selector).first()
  await target.waitFor({ state: 'visible', timeout: timeoutMs })
  const text = await target.innerText()
  fs.writeFileSync(path.join(artifactRoot, filename), `${text}\n`)
}

async function writeCanvasArtifact (page, filename) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.querySelector('#stel-canvas')
    return canvas && typeof canvas.toDataURL === 'function' ? canvas.toDataURL('image/png') : null
  })
  if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
    fs.writeFileSync(path.join(artifactRoot, `${filename}.txt`), 'Canvas PNG export unavailable\n')
    return
  }
  fs.writeFileSync(path.join(artifactRoot, filename), Buffer.from(dataUrl.split(',')[1], 'base64'))
}

async function fillSearchInput (page, value) {
  const input = page.locator('.tsearch input').first()
  await input.waitFor({ state: 'visible', timeout: timeoutMs })
  await page.evaluate((query) => {
    const field = document.querySelector('.tsearch input')
    if (!field) throw new Error('search input not found')
    field.focus()
    field.value = query
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

async function clickSearchChoice (page, expectedText) {
  return page.evaluate((needle) => {
    const choices = Array.from(document.querySelectorAll('.tsearch .v-list-item'))
    const choice = choices.find(element => element.textContent.includes(needle))
    if (!choice) {
      throw new Error(`search choice not found for ${needle}; choices=${choices.map(element => element.textContent.trim()).join(' | ')}`)
    }
    const text = choice.textContent.trim()
    choice.click()
    return text
  }, expectedText)
}

async function validateApi () {
  const status = await fetchJson(apiUrl('/api/sky/catalog-packs'))
  const data = status.data || {}
  if (!data.mounted || data.object_count !== 158217 || !Array.isArray(data.packs) || data.packs.length !== 4) {
    throw new Error(`catalog pack status mismatch: ${JSON.stringify(data)}`)
  }
  for (const pack of data.packs) {
    if (pack.status !== 'loaded' || pack.loaded_object_count !== pack.declared_object_count) {
      throw new Error(`catalog pack failed to load: ${JSON.stringify(pack)}`)
    }
  }

  for (const testCase of apiSearchCases) {
    const result = await fetchJson(apiUrl(`/api/sky/search?q=${encodeURIComponent(testCase.query)}`))
    const rows = result.data && result.data.results
    if (!Array.isArray(rows) || !rows.length) throw new Error(`no API result for ${testCase.query}`)
    const match = rows.find(row => {
      const searchable = JSON.stringify(row).toLowerCase()
      return (!testCase.expected || searchable.includes(testCase.expected.toLowerCase())) &&
        (!testCase.expectedCatalog || row.catalog === testCase.expectedCatalog)
    })
    if (!match) throw new Error(`wrong API result for ${testCase.query}: ${JSON.stringify(rows.slice(0, 3))}`)
    if (typeof match.source_id !== 'string' || !match.sky_engine_url) {
      throw new Error(`unstable identity for ${testCase.query}: ${JSON.stringify(match)}`)
    }
    console.log(`API_PASS ${testCase.query} catalog=${match.catalog} source_id=${match.source_id}`)
  }
  return data
}

async function openCatalogStatus (page) {
  console.log('CATALOG_STEP status-dialog')
  await page.waitForSelector('button .mdi-menu', { state: 'visible', timeout: timeoutMs })
  await page.evaluate(() => document.querySelector('button .mdi-menu').closest('button').click())
  const packsItem = page.getByText('ORAS Catalog Packs', { exact: true }).last()
  await packsItem.waitFor({ state: 'visible', timeout: timeoutMs })
  await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('.v-list-item'))
      .find(element => element.textContent.trim() === 'ORAS Catalog Packs')
    if (!item) throw new Error('ORAS Catalog Packs menu item not found')
    item.click()
  })
  const dialog = page.locator('.oras-catalog-status')
  await dialog.waitFor({ state: 'visible', timeout: timeoutMs })
  await page.waitForFunction(() => document.body.innerText.includes('Loaded objects 158,217'), null, { timeout: timeoutMs })
  const text = await dialog.innerText()
  for (const expected of ['ORAS Stars Core', 'ORAS Expanded DSOs', 'ORAS Double Stars', 'ORAS Pulsars, Quasars, and Black Holes']) {
    if (!text.includes(expected)) throw new Error(`catalog status missing ${expected}`)
  }
  await writeElementTextArtifact(page, '.oras-catalog-status', 'catalog-pack-status.txt')
  await dialog.getByText('Close', { exact: true }).evaluate(element => element.click())
}

async function selectSearchResult (page, testCase) {
  console.log(`CATALOG_STEP search ${testCase.query}`)
  const input = page.locator('.tsearch input').first()
  await input.waitFor({ state: 'visible', timeout: timeoutMs })
  await fillSearchInput(page, testCase.query)
  const choices = page.locator('.tsearch .v-list-item')
  await choices.first().waitFor({ state: 'visible', timeout: timeoutMs })
  const choiceText = await clickSearchChoice(page, testCase.expectedText || testCase.expectedCatalog)
  if (!choiceText.includes('ORAS Enhanced') || !choiceText.includes(testCase.expectedCatalog)) {
    throw new Error(`search result lacks ORAS catalog badges for ${testCase.query}: ${choiceText}`)
  }
  const details = page.locator('.oras-enhanced-panel')
  await details.waitFor({ state: 'visible', timeout: timeoutMs })
  const detailText = await details.innerText()
  for (const expected of ['ORAS Enhanced', 'Catalog IDs', 'Source attribution']) {
    if (!detailText.includes(expected)) throw new Error(`detail panel missing ${expected} for ${testCase.query}`)
  }
  if (testCase.requireCatalogPack !== false && !detailText.includes('Catalog pack')) {
    throw new Error(`detail panel missing Catalog pack for ${testCase.query}`)
  }
  if (!detailText.includes(testCase.expectedCatalog)) {
    throw new Error(`detail panel has wrong catalog for ${testCase.query}: ${detailText}`)
  }
  if (testCase.requireUnavailableProperties && !detailText.includes('Physical properties: Unavailable from mounted sources')) {
    throw new Error(`missing-field honesty not visible for ${testCase.query}`)
  }
  await writeElementTextArtifact(page, '.oras-enhanced-panel', testCase.artifact.replace(/\.png$/, '.txt'))
  console.log(`CATALOG_STEP selected ${testCase.query}`)
}

async function validateBrowser () {
  fs.mkdirSync(artifactRoot, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const consoleMessages = []
  const fatalErrors = []
  page.on('console', message => consoleMessages.push(message.text()))
  page.on('pageerror', error => fatalErrors.push(error.message))
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
    await page.locator('#stel-canvas').waitFor({ state: 'visible', timeout: timeoutMs })
    await page.locator('.tsearch input').first().waitFor({ state: 'visible', timeout: timeoutMs })
    await openCatalogStatus(page)
    for (const testCase of browserSearchCases) {
      await selectSearchResult(page, testCase)
    }
    await page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry => entry.name.includes('tle_satellite.jsonl.gz')),
      null,
      { timeout: timeoutMs }
    )
    console.log('CATALOG_STEP satellite-log')
    const satelliteMessage = consoleMessages.find(message => satelliteParsePattern.test(message))
    if (!satelliteMessage) throw new Error('satellite parse count was not logged')
    const satelliteCount = Number((satelliteMessage.match(satelliteParsePattern) || [])[1])
    if (!Number.isFinite(satelliteCount) || satelliteCount < 1) {
      throw new Error(`invalid satellite parse count: ${satelliteMessage}`)
    }
    if (fatalErrors.length) throw new Error(`fatal browser errors: ${fatalErrors.join(' | ')}`)
    const forbidden = consoleMessages.find(message => /Cannot uncompress gz file|Parsed -1 satellites|Failed to resolve exact sky source route/i.test(message))
    if (forbidden) throw new Error(`forbidden runtime console message: ${forbidden}`)
    await writeCanvasArtifact(page, 'satellite-regression.png')
    return { satelliteMessage, consoleMessages: consoleMessages.length }
  } finally {
    await browser.close()
  }
}

async function main () {
  const status = await validateApi()
  const browser = await validateBrowser()
  const summary = {
    base_url: baseUrl,
    api_base_url: apiBaseUrl,
    release_version: status.release_version,
    object_count: status.object_count,
    packs: status.packs.map(pack => ({ pack_id: pack.pack_id, object_count: pack.loaded_object_count })),
    satellite_message: browser.satelliteMessage,
    artifacts: fs.readdirSync(artifactRoot).sort(),
  }
  fs.writeFileSync(path.join(artifactRoot, 'acceptance-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  console.log(`CATALOG_RELEASE_PASS objects=${status.object_count} artifacts=${summary.artifacts.length}`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
