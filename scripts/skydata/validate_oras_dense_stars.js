const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const timeoutMs = Number(process.env.ORAS_DENSE_STARS_TIMEOUT_MS || 180000)
const artifactRoot = path.resolve(process.env.ORAS_DENSE_STARS_ARTIFACT_DIR || 'output/playwright/dense-stars')
const maxVisualWhitePixelRatio = Number(process.env.ORAS_DENSE_STARS_MAX_WHITE_PIXEL_RATIO || 0.15)
const maxVisualLabelCount = Number(process.env.ORAS_DENSE_STARS_MAX_LABEL_COUNT || 25)

async function writeElementTextArtifact (page, selector, filename) {
  const target = page.locator(selector).first()
  await target.waitFor({ state: 'visible', timeout: timeoutMs })
  const text = await target.innerText()
  fs.writeFileSync(path.join(artifactRoot, filename), `${text}\n`)
}

async function canvasDataUrl (page) {
  return page.evaluate(() => {
    try {
      const canvas = document.querySelector('#stel-canvas')
      return canvas && typeof canvas.toDataURL === 'function' ? canvas.toDataURL('image/png') : null
    } catch (error) {
      return null
    }
  })
}

async function writeCanvasArtifact (page, filename) {
  const dataUrl = await canvasDataUrl(page)
  if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
    fs.writeFileSync(path.join(artifactRoot, `${filename}.txt`), 'Canvas PNG export unavailable\n')
    return
  }
  fs.writeFileSync(path.join(artifactRoot, filename), Buffer.from(dataUrl.split(',')[1], 'base64'))
}

async function whitePixelRatio (page) {
  return page.evaluate(async () => {
    const source = document.querySelector('#stel-canvas')
    if (!source || typeof source.toDataURL !== 'function') return null
    const image = new Image()
    try {
      image.src = source.toDataURL('image/png')
    } catch (error) {
      return null
    }
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(320, image.width)
    canvas.height = Math.min(200, image.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let white = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 235 && pixels[i + 1] > 235 && pixels[i + 2] > 235 && pixels[i + 3] > 220) white++
    }
    return white / (pixels.length / 4)
  })
}

async function openRuntimePage (browser, profile) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.addInitScript((denseStarsProfile) => {
    localStorage.setItem('orasDenseStarsProfile', denseStarsProfile)
  }, profile)
  const page = await context.newPage()
  const consoleMessages = []
  const fatalErrors = []
  page.on('console', message => consoleMessages.push(message.text()))
  page.on('pageerror', error => fatalErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
  await page.locator('#stel-canvas').waitFor({ state: 'visible', timeout: timeoutMs })
  await page.locator('.tsearch input').first().waitFor({ state: 'visible', timeout: timeoutMs })
  await page.waitForTimeout(5000)
  return { context, page, consoleMessages, fatalErrors, profile }
}

async function getDenseStarManifest (page) {
  const manifestUrl = new URL(
    'skydata/dense-star-tiles/manifest.json',
    baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  ).toString()
  return page.evaluate(async (url) => {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`dense star manifest returned ${response.status}`)
    return response.json()
  }, manifestUrl)
}

async function profileResourceCount (page, profile) {
  return page.evaluate((profileId) => performance
    .getEntriesByType('resource')
    .filter(entry =>
      entry.name.includes(`/dense-star-tiles/profiles/${profileId}/properties`) ||
      entry.name.includes(`/dense-star-tiles/profiles/${profileId}/Norder`)
    ).length, profile)
}

async function visibleLabelCount (page) {
  return page.evaluate(() => {
    const text = document.body.innerText || ''
    const matches = text.match(/\b(?:Gaia DR3|HIP|TYC)\b/g)
    return matches ? matches.length : 0
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
  const contexts = []

  try {
    const off = await openRuntimePage(browser, 'off')
    contexts.push(off.context)
    const offResources = await profileResourceCount(off.page, 'visual-default') + await profileResourceCount(off.page, 'deep-catalog')
    if (offResources !== 0) throw new Error(`dense star profile resources loaded while off: ${offResources}`)
    await writeCanvasArtifact(off.page, 'dense-stars-off.png')
    assertConsoleClean(off.consoleMessages, off.fatalErrors)

    const visual = await openRuntimePage(browser, 'visual-default')
    contexts.push(visual.context)
    const manifest = await getDenseStarManifest(visual.page)
    if (manifest.default_profile !== 'visual-default') throw new Error(`wrong default profile: ${manifest.default_profile}`)
    if (!manifest.profiles || !manifest.profiles['visual-default'] || !manifest.profiles['deep-catalog']) {
      throw new Error(`dense star profiles missing: ${JSON.stringify(manifest.profiles || {})}`)
    }
    const visualProfile = manifest.profiles['visual-default']
    const deepProfile = manifest.profiles['deep-catalog']
    if (Number(visualProfile.magnitude_limit) > 5.5) throw new Error(`visual profile too deep: ${visualProfile.magnitude_limit}`)
    if (Number(deepProfile.magnitude_limit) <= Number(visualProfile.magnitude_limit)) throw new Error('deep catalog is not deeper than visual profile')
    if (Number(visualProfile.star_count) >= Number(deepProfile.star_count)) throw new Error('visual profile is not smaller than deep catalog')
    await visual.page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry =>
        entry.name.includes('/dense-star-tiles/profiles/visual-default/properties') ||
        entry.name.includes('/dense-star-tiles/profiles/visual-default/Norder')
      ),
      null,
      { timeout: timeoutMs }
    )
    const visualResources = await profileResourceCount(visual.page, 'visual-default')
    const visualDeepResources = await profileResourceCount(visual.page, 'deep-catalog')
    if (visualResources < 1) throw new Error('visual profile native resources did not load')
    if (visualDeepResources !== 0) throw new Error(`deep catalog resources loaded during visual profile: ${visualDeepResources}`)
    const labelCount = await visibleLabelCount(visual.page)
    if (labelCount > maxVisualLabelCount) throw new Error(`visual profile label count too high: ${labelCount}`)
    const visualWhitePixelRatio = await whitePixelRatio(visual.page)
    if (visualWhitePixelRatio != null && visualWhitePixelRatio > maxVisualWhitePixelRatio) {
      throw new Error(`visual profile white-pixel ratio too high: ${visualWhitePixelRatio}`)
    }
    const dialog = await openDenseStarsStatus(visual.page)
    const text = await dialog.innerText()
    for (const expected of ['Active profile', 'visual-default', 'Magnitude limit', 'Labels', 'suppressed']) {
      if (!text.includes(expected)) throw new Error(`dense status missing ${expected}: ${text}`)
    }
    await writeElementTextArtifact(visual.page, '.oras-dense-stars-status', 'dense-stars-status.txt')
    await writeCanvasArtifact(visual.page, 'dense-stars-visual.png')
    assertConsoleClean(visual.consoleMessages, visual.fatalErrors)

    const deep = await openRuntimePage(browser, 'deep-catalog')
    contexts.push(deep.context)
    await deep.page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry =>
        entry.name.includes('/dense-star-tiles/profiles/deep-catalog/properties') ||
        entry.name.includes('/dense-star-tiles/profiles/deep-catalog/Norder')
      ),
      null,
      { timeout: timeoutMs }
    )
    const deepResources = await profileResourceCount(deep.page, 'deep-catalog')
    if (deepResources < 1) throw new Error('deep catalog native resources did not load')
    await writeCanvasArtifact(deep.page, 'dense-stars-deep-catalog.png')
    assertConsoleClean(deep.consoleMessages, deep.fatalErrors)

    const summary = {
      baseUrl,
      defaultProfile: manifest.default_profile,
      visualStarCount: Number(visualProfile.star_count),
      binocularStarCount: Number(manifest.profiles.binocular.star_count),
      deepCatalogStarCount: Number(deepProfile.star_count),
      visualMagnitudeLimit: Number(visualProfile.magnitude_limit),
      binocularMagnitudeLimit: Number(manifest.profiles.binocular.magnitude_limit),
      deepCatalogMagnitudeLimit: Number(deepProfile.magnitude_limit),
      labelCount,
      whitePixelRatio: visualWhitePixelRatio,
      offResourceCount: offResources,
      visualResourceCount: visualResources,
      deepResourceCount: deepResources,
      artifacts: fs.readdirSync(artifactRoot).sort(),
    }
    fs.writeFileSync(path.join(artifactRoot, 'acceptance-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`DENSE_STARS_PASS defaultProfile=${summary.defaultProfile} visualStars=${summary.visualStarCount} deepStars=${summary.deepCatalogStarCount} labelCount=${labelCount} whitePixelRatio=${visualWhitePixelRatio}`)
  } finally {
    for (const context of contexts.reverse()) {
      await context.close().catch(() => {})
    }
    await browser.close()
  }
}

validateDenseStars().catch(error => {
  console.error(error)
  process.exit(1)
})
