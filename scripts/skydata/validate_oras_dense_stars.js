const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const timeoutMs = Number(process.env.ORAS_DENSE_STARS_TIMEOUT_MS || 180000)
const artifactRoot = path.resolve(process.env.ORAS_DENSE_STARS_ARTIFACT_DIR || 'output/playwright/dense-stars')
const maxVisualBrightPixelRatio = Number(process.env.ORAS_DENSE_STARS_MAX_BRIGHT_PIXEL_RATIO || 0.055)
const maxVisualAddedBrightPixelRatio = Number(process.env.ORAS_DENSE_STARS_MAX_ADDED_BRIGHT_PIXEL_RATIO || 0.018)
const maxBrightBlobArea = Number(process.env.ORAS_DENSE_STARS_MAX_BRIGHT_BLOB_AREA || 950)
const maxAverageBrightBlobRadius = Number(process.env.ORAS_DENSE_STARS_MAX_AVG_BRIGHT_BLOB_RADIUS || 5.0)
const maxVisualLabelCount = Number(process.env.ORAS_DENSE_STARS_MAX_LABEL_COUNT || 25)
const fixedView = {
  fov: 120,
  date: '2026-06-04T02:16:04Z',
  lat: 41.44,
  lng: -79.69,
  elev: 0
}

async function writeElementTextArtifact (page, selector, filename) {
  const target = page.locator(selector).first()
  await target.waitFor({ state: 'visible', timeout: timeoutMs })
  const text = await target.innerText()
  fs.writeFileSync(path.join(artifactRoot, filename), `${text}\n`)
}

function unfilterPngScanline (filter, row, previous, bytesPerPixel) {
  for (let i = 0; i < row.length; i++) {
    const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0
    const up = previous ? previous[i] : 0
    const upLeft = previous && i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0
    if (filter === 1) row[i] = (row[i] + left) & 255
    else if (filter === 2) row[i] = (row[i] + up) & 255
    else if (filter === 3) row[i] = (row[i] + Math.floor((left + up) / 2)) & 255
    else if (filter === 4) {
      const p = left + up - upLeft
      const pa = Math.abs(p - left)
      const pb = Math.abs(p - up)
      const pc = Math.abs(p - upLeft)
      const predictor = pa <= pb && pa <= pc ? left : (pb <= pc ? up : upLeft)
      row[i] = (row[i] + predictor) & 255
    } else if (filter !== 0) {
      throw new Error(`unsupported PNG filter: ${filter}`)
    }
  }
}

function decodePngRgba (buffer) {
  const signature = '89504e470d0a1a0a'
  if (buffer.subarray(0, 8).toString('hex') !== signature) throw new Error('not a PNG screenshot')
  let offset = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idat = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      const bitDepth = data[8]
      colorType = data[9]
      const interlace = data[12]
      if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
        throw new Error(`unsupported PNG format: bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`)
      }
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }
  }
  const channels = colorType === 6 ? 4 : 3
  const stride = width * channels
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const rgba = Buffer.alloc(width * height * 4)
  let rawOffset = 0
  let outOffset = 0
  let previous = null
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++]
    const row = Buffer.from(raw.subarray(rawOffset, rawOffset + stride))
    rawOffset += stride
    unfilterPngScanline(filter, row, previous, channels)
    for (let x = 0; x < width; x++) {
      const source = x * channels
      rgba[outOffset++] = row[source]
      rgba[outOffset++] = row[source + 1]
      rgba[outOffset++] = row[source + 2]
      rgba[outOffset++] = channels === 4 ? row[source + 3] : 255
    }
    previous = row
  }
  return { width, height, data: rgba }
}

function luminanceAt (image, pixel) {
  const i = pixel * 4
  return 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2]
}

function computeComponents (mask, width, height) {
  const seen = new Uint8Array(mask.length)
  const queue = new Int32Array(mask.length)
  const components = []
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue
    let head = 0
    let tail = 0
    let area = 0
    seen[i] = 1
    queue[tail++] = i
    while (head < tail) {
      const current = queue[head++]
      area++
      const x = current % width
      const neighbors = []
      if (current >= width) neighbors.push(current - width)
      if (current + width < mask.length) neighbors.push(current + width)
      if (x > 0) neighbors.push(current - 1)
      if (x + 1 < width) neighbors.push(current + 1)
      for (const next of neighbors) {
        if (mask[next] && !seen[next]) {
          seen[next] = 1
          queue[tail++] = next
        }
      }
    }
    components.push(area)
  }
  components.sort((a, b) => b - a)
  return components
}

function computeScreenshotMetrics (screenshotBuffer, baselineBuffer = null) {
  const image = decodePngRgba(screenshotBuffer)
  const baseline = baselineBuffer ? decodePngRgba(baselineBuffer) : null
  if (baseline && (baseline.width !== image.width || baseline.height !== image.height)) {
    throw new Error('baseline screenshot dimensions do not match visual screenshot')
  }
  const pixelCount = image.width * image.height
  const brightMask = new Uint8Array(pixelCount)
  let brightPixels = 0
  let addedBrightPixels = 0
  let weightedLuminance = 0
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const luma = luminanceAt(image, pixel)
    weightedLuminance += luma
    if (luma >= 120) {
      brightMask[pixel] = 1
      brightPixels++
    }
    if (baseline) {
      const delta = luma - luminanceAt(baseline, pixel)
      if (luma >= 95 && delta >= 18) addedBrightPixels++
    }
  }
  const components = computeComponents(brightMask, image.width, image.height)
  const averageBrightBlobRadius = components.length
    ? components.slice(0, Math.min(100, components.length)).reduce((sum, area) => sum + Math.sqrt(area / Math.PI), 0) / Math.min(100, components.length)
    : 0
  return {
    width: image.width,
    height: image.height,
    brightPixelRatio: brightPixels / pixelCount,
    addedBrightPixelRatio: baseline ? addedBrightPixels / pixelCount : null,
    maxBrightBlobArea: components[0] || 0,
    averageBrightBlobRadius,
    meanLuminance: weightedLuminance / pixelCount,
    brightBlobCount: components.length,
  }
}

async function capturePageArtifact (page, filename) {
  const screenshot = await page.locator('#stel-canvas').screenshot({
    path: path.join(artifactRoot, filename),
    timeout: timeoutMs
  })
  return screenshot
}

function runtimeUrlForView (view = {}) {
  const url = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  const params = { ...fixedView, ...view }
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function openRuntimePage (browser, profile, view = {}) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.addInitScript((denseStarsProfile) => {
    localStorage.setItem('orasDenseStarsProfile', denseStarsProfile)
  }, profile)
  const page = await context.newPage()
  const consoleMessages = []
  const fatalErrors = []
  page.on('console', message => consoleMessages.push(message.text()))
  page.on('pageerror', error => fatalErrors.push(error.message))
  await page.goto(runtimeUrlForView(view), { waitUntil: 'domcontentloaded', timeout: timeoutMs })
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
  fs.rmSync(artifactRoot, { recursive: true, force: true })
  fs.mkdirSync(artifactRoot, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const contexts = []

  try {
    const off = await openRuntimePage(browser, 'off', { fov: 120 })
    contexts.push(off.context)
    const offResources = await profileResourceCount(off.page, 'visual-default') + await profileResourceCount(off.page, 'deep-catalog')
    if (offResources !== 0) throw new Error(`dense star profile resources loaded while off: ${offResources}`)
    const offWideScreenshot = await capturePageArtifact(off.page, 'dense-stars-off.png')
    assertConsoleClean(off.consoleMessages, off.fatalErrors)

    const visual = await openRuntimePage(browser, 'visual-default', { fov: 120 })
    contexts.push(visual.context)
    const manifest = await getDenseStarManifest(visual.page)
    if (manifest.default_profile !== 'visual-default') throw new Error(`wrong default profile: ${manifest.default_profile}`)
    if (!manifest.profiles || !manifest.profiles['visual-default'] || !manifest.profiles['deep-catalog']) {
      throw new Error(`dense star profiles missing: ${JSON.stringify(manifest.profiles || {})}`)
    }
    const visualProfile = manifest.profiles['visual-default']
    const deepProfile = manifest.profiles['deep-catalog']
    if (Number(visualProfile.magnitude_limit) > 5.0) throw new Error(`visual profile too deep: ${visualProfile.magnitude_limit}`)
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
    const visualWideScreenshot = await capturePageArtifact(visual.page, 'dense-stars-visual-wide-fov.png')
    const visualWideMetrics = computeScreenshotMetrics(visualWideScreenshot, offWideScreenshot)
    if (visualWideMetrics.brightPixelRatio > maxVisualBrightPixelRatio) {
      throw new Error(`visual profile bright-pixel ratio too high: ${visualWideMetrics.brightPixelRatio}`)
    }
    if (visualWideMetrics.addedBrightPixelRatio > maxVisualAddedBrightPixelRatio) {
      throw new Error(`visual profile added bright-pixel ratio too high: ${visualWideMetrics.addedBrightPixelRatio}`)
    }
    if (visualWideMetrics.maxBrightBlobArea > maxBrightBlobArea) {
      throw new Error(`visual profile bright blob too large: ${visualWideMetrics.maxBrightBlobArea}`)
    }
    if (visualWideMetrics.averageBrightBlobRadius > maxAverageBrightBlobRadius) {
      throw new Error(`visual profile average bright blob radius too high: ${visualWideMetrics.averageBrightBlobRadius}`)
    }
    const dialog = await openDenseStarsStatus(visual.page)
    const text = await dialog.innerText()
    for (const expected of ['Active profile', 'visual-default', 'Magnitude limit', 'Labels', 'suppressed']) {
      if (!text.includes(expected)) throw new Error(`dense status missing ${expected}: ${text}`)
    }
    await writeElementTextArtifact(visual.page, '.oras-dense-stars-status', 'dense-stars-status.txt')
    assertConsoleClean(visual.consoleMessages, visual.fatalErrors)

    const visualMedium = await openRuntimePage(browser, 'visual-default', { fov: 45 })
    contexts.push(visualMedium.context)
    await visualMedium.page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry =>
        entry.name.includes('/dense-star-tiles/profiles/visual-default/properties') ||
        entry.name.includes('/dense-star-tiles/profiles/visual-default/Norder')
      ),
      null,
      { timeout: timeoutMs }
    )
    const visualMediumScreenshot = await capturePageArtifact(visualMedium.page, 'dense-stars-visual-medium-fov.png')
    const visualMediumMetrics = computeScreenshotMetrics(visualMediumScreenshot)
    assertConsoleClean(visualMedium.consoleMessages, visualMedium.fatalErrors)

    const binocular = await openRuntimePage(browser, 'binocular', { fov: 120 })
    contexts.push(binocular.context)
    await binocular.page.waitForFunction(
      () => performance.getEntriesByType('resource').some(entry =>
        entry.name.includes('/dense-star-tiles/profiles/binocular/properties') ||
        entry.name.includes('/dense-star-tiles/profiles/binocular/Norder')
      ),
      null,
      { timeout: timeoutMs }
    )
    await capturePageArtifact(binocular.page, 'dense-stars-binocular.png')
    assertConsoleClean(binocular.consoleMessages, binocular.fatalErrors)

    const deep = await openRuntimePage(browser, 'deep-catalog', { fov: 120 })
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
    await capturePageArtifact(deep.page, 'dense-stars-deep-catalog.png')
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
      visualWideMetrics,
      visualMediumMetrics,
      offResourceCount: offResources,
      visualResourceCount: visualResources,
      deepResourceCount: deepResources,
      artifacts: fs.readdirSync(artifactRoot).sort(),
    }
    fs.writeFileSync(path.join(artifactRoot, 'acceptance-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    console.log(`DENSE_STARS_PASS defaultProfile=${summary.defaultProfile} visualStars=${summary.visualStarCount} deepStars=${summary.deepCatalogStarCount} labelCount=${labelCount} brightPixelRatio=${visualWideMetrics.brightPixelRatio} maxBrightBlobArea=${visualWideMetrics.maxBrightBlobArea}`)
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
