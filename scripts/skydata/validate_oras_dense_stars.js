const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const timeoutMs = Number(process.env.ORAS_DENSE_STARS_TIMEOUT_MS || 120000)
const artifactRoot = path.resolve(process.env.ORAS_DENSE_STARS_ARTIFACT_DIR || 'output/playwright/dense-stars')

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

async function openRuntimePage (browser, enabled) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.addInitScript((denseStarsEnabled) => {
    localStorage.setItem('orasDenseStarsEnabled', denseStarsEnabled ? '1' : '0')
  }, enabled)
  const page = await context.newPage()
  const consoleMessages = []
  const fatalErrors = []
  page.on('console', message => consoleMessages.push(message.text()))
  page.on('pageerror', error => fatalErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
  await page.locator('#stel-canvas').waitFor({ state: 'visible', timeout: timeoutMs })
  await page.locator('.tsearch input').first().waitFor({ state: 'visible', timeout: timeoutMs })
  await page.waitForTimeout(5000)
  return { context, page, consoleMessages, fatalErrors }
}

async function getDenseStarResourceCount (page) {
  return page.evaluate(() => performance
    .getEntriesByType('resource')
    .filter(entry =>
      entry.name.includes('/dense-star-tiles/properties') ||
      entry.name.includes('/dense-star-tiles/Norder')
    ).length)
}

async function getDenseStarManifest (page) {
  return page.evaluate(async () => {
    const response = await fetch('/oras-sky-engine/skydata/dense-star-tiles/manifest.json', { cache: 'no-store' })
    if (!response.ok) throw new Error(`dense star manifest returned ${response.status}`)
    return response.json()
  })
}

async function openDenseStarsStatus (page) {
  await page.waitForSelector('button .mdi-menu', { state: 'visible', timeout: timeoutMs })
  await page.evaluate(() => document.querySelector('button .mdi-menu').closest('button').click())
  const denseStarsItem = page.getByText('ORAS Dense Stars', { exact: true }).last()
  await denseStarsItem.waitFor({ state: 'visible', timeout: timeoutMs })
  await page.evaluate(() => {
    const item = Array.from(document.querySelectorAll('.v-list-item'))
      .find(element => element.textContent.trim() === 'ORAS Dense Stars')
    if (!item) throw new Error('ORAS Dense Stars menu item not found')
    item.click()
  })
  const dialog = page.locator('.oras-dense-stars-status')
  await dialog.waitFor({ state: 'visible', timeout: timeoutMs })
  await page.waitForFunction(() => document.body.innerText.includes('Dense Stars'), null, { timeout: timeoutMs })
  return dialog
}

function assertConsoleClean (consoleMessages, fatalErrors) {
  if (fatalErrors.length) throw new Error(`fatal browser errors: ${fatalErrors.join(' | ')}`)
  const forbidden = consoleMessages.find(message => /Cannot uncompress gz file|Parsed -1 satellites|Failed to resolve exact sky source route/i.test(message))
  if (forbidden) throw new Error(`forbidden runtime console message: ${forbidden}`)
}

async function validateDenseStars () {
  fs.mkdirSync(artifactRoot, { recursive: true })
  const browser = await chromium.launch({ headless: true })

  try {
    console.log('DENSE_STEP disabled-page')
    const disabled = await openRuntimePage(browser, false)
    const disabledDenseResourceCount = await getDenseStarResourceCount(disabled.page)
    if (disabledDenseResourceCount !== 0) {
      throw new Error(`dense star tiles loaded while disabled: ${disabledDenseResourceCount}`)
    }
    await writeCanvasArtifact(disabled.page, 'dense-star-disabled.png')
    assertConsoleClean(disabled.consoleMessages, disabled.fatalErrors)
    await disabled.context.close()

    console.log('DENSE_STEP enabled-page')
    const enabled = await openRuntimePage(browser, true)
    console.log('DENSE_STEP manifest')
    const manifest = await getDenseStarManifest(enabled.page)
    const releaseStarCount = Number(manifest.star_count)
    if (!Number.isFinite(releaseStarCount) || releaseStarCount < 1) {
      throw new Error(`invalid dense star release count: ${JSON.stringify(manifest)}`)
    }
    console.log('DENSE_STEP wait-native-resources')
    await enabled.page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry =>
        entry.name.includes('/dense-star-tiles/properties') ||
        entry.name.includes('/dense-star-tiles/Norder')
      ),
      null,
      { timeout: timeoutMs }
    )
    const enabledDenseResourceCount = await getDenseStarResourceCount(enabled.page)
    if (enabledDenseResourceCount <= disabledDenseResourceCount) {
      throw new Error(`dense star tile resources did not increase disabled=${disabledDenseResourceCount} enabled=${enabledDenseResourceCount}`)
    }

    console.log('DENSE_STEP status-dialog')
    const dialog = await openDenseStarsStatus(enabled.page)
    const text = await dialog.innerText()
    if (!text.includes('native SWE star tiles')) throw new Error(`Dense Stars dialog does not show native path: ${text}`)
    if (!text.match(/Stars\s+[0-9,]+/)) throw new Error(`Dense Stars dialog does not show star count: ${text}`)
    await writeElementTextArtifact(enabled.page, '.oras-dense-stars-status', 'dense-star-status.txt')

    console.log('DENSE_STEP enabled-artifact')
    const showOrasDenseStars = await enabled.page.evaluate(() => localStorage.getItem('orasDenseStarsEnabled') !== '0')
    if (!showOrasDenseStars) throw new Error('showOrasDenseStars persisted setting is off')
    await writeCanvasArtifact(enabled.page, 'dense-star-enabled.png')

    assertConsoleClean(enabled.consoleMessages, enabled.fatalErrors)
    await enabled.context.close()

    const summary = {
      baseUrl,
      releaseStarCount,
      tileCount: manifest.tile_count,
      magnitudeLimit: manifest.magnitude_limit,
      disabledDenseResourceCount,
      enabledDenseResourceCount,
      artifacts: fs.readdirSync(artifactRoot).sort(),
    }
    fs.writeFileSync(path.join(artifactRoot, 'acceptance-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`DENSE_STARS_PASS releaseStarCount=${releaseStarCount} denseTileResources=${enabledDenseResourceCount}`)
  } finally {
    await browser.close()
  }
}

validateDenseStars().catch(error => {
  console.error(error)
  process.exit(1)
})
