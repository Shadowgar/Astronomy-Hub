const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
const timeoutMs = Number(process.env.ORAS_DENSE_STARS_TIMEOUT_MS || 180000)
const artifactRoot = path.resolve(process.env.ORAS_DENSE_STARS_ARTIFACT_DIR || 'output/playwright/dense-stars')
const maxVisualBrightPixelRatio = Number(process.env.ORAS_DENSE_STARS_MAX_BRIGHT_PIXEL_RATIO || 0.055)
const maxVisualAddedBrightPixelRatio = Number(process.env.ORAS_DENSE_STARS_MAX_ADDED_BRIGHT_PIXEL_RATIO || 0.018)
const maxBrightBlobArea = Number(process.env.ORAS_DENSE_STARS_MAX_BRIGHT_BLOB_AREA || 950)
const maxAverageBrightBlobRadius = Number(process.env.ORAS_DENSE_STARS_MAX_AVG_BRIGHT_BLOB_RADIUS || 5.0)
const maxVisualLabelCount = Number(process.env.ORAS_DENSE_STARS_MAX_LABEL_COUNT || 25)
const minimumVisualBrightPixelRetention = Number(process.env.ORAS_DENSE_STARS_MIN_BRIGHT_PIXEL_RETENTION || 0.9)
const settleMs = Number(process.env.ORAS_DENSE_STARS_SETTLE_MS || 4000)
const tileSettleMs = Number(process.env.ORAS_DENSE_STARS_TILE_SETTLE_MS || 1000)
const runtimeHealthRetries = Number(process.env.ORAS_DENSE_STARS_HEALTH_RETRIES || 40)
const runtimeHealthDelayMs = Number(process.env.ORAS_DENSE_STARS_HEALTH_DELAY_MS || 1500)

function assertValidationConfiguration () {
  if (!Number.isFinite(minimumVisualBrightPixelRetention) || minimumVisualBrightPixelRetention <= 0 || minimumVisualBrightPixelRetention > 1) {
    throw new Error('invalid ORAS_DENSE_STARS_MIN_BRIGHT_PIXEL_RETENTION: expected a finite value greater than 0 and at most 1')
  }
  for (const [name, value] of [
    ['ORAS_DENSE_STARS_SETTLE_MS', settleMs],
    ['ORAS_DENSE_STARS_TILE_SETTLE_MS', tileSettleMs]
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`invalid ${name}: expected a finite non-negative value`)
    }
  }
}

assertValidationConfiguration()

const fixedView = {
  fov: 120,
  date: '2026-06-04T02:16:04Z',
  lat: 41.44,
  lng: -79.69,
  elev: 0
}
const DENSE_STAR_PROFILES = [
  { id: 'off', label: 'Off' },
  { id: 'visual-default', label: 'Visual Sky' },
  { id: 'binocular', label: 'Binocular Depth' },
  { id: 'deep-catalog', label: 'Deep Catalog' }
]
const DENSE_STAR_QA_FIELDS = [
  { id: 'horizon-north', label: 'Wide FOV north horizon', view: { az: 0, alt: 8, fov: 120 } },
  { id: 'horizon-east', label: 'Wide FOV east horizon', view: { az: 90, alt: 8, fov: 120 } },
  { id: 'horizon-south', label: 'Wide FOV south horizon', view: { az: 180, alt: 8, fov: 120 } },
  { id: 'horizon-west', label: 'Wide FOV west horizon', view: { az: 270, alt: 8, fov: 120 } },
  { id: 'zenith-high-sky', label: 'Zenith high sky field', view: { az: 180, alt: 82, fov: 90 } },
  { id: 'milky-way-cygnus', label: 'Milky Way Cygnus / North America Nebula region', view: { date: '2026-07-15T03:00:00Z', az: 65.94, alt: 49.37, fov: 70 } },
  { id: 'orion-m42', label: 'Orion / M42 region', view: { date: '2026-01-15T03:00:00Z', az: 174.65, alt: 43.03, fov: 70 } },
  { id: 'm31', label: 'M31 / Andromeda region', view: { date: '2026-01-15T03:00:00Z', az: 294.34, alt: 39.53, fov: 70 } },
  { id: 'sparse-high-latitude', label: 'Sparse high-galactic-latitude comparison field', view: { date: '2026-04-15T03:00:00Z', az: 30, alt: 72, fov: 90 } }
]

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
  let baselineBrightPixels = 0
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
      const baselineLuma = luminanceAt(baseline, pixel)
      if (baselineLuma >= 120) baselineBrightPixels++
      const delta = luma - baselineLuma
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
    baselineBrightPixelCount: baseline ? baselineBrightPixels : null,
    brightPixelRetentionRatio: baseline && baselineBrightPixels > 0 ? brightPixels / baselineBrightPixels : null,
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
  const url = view.path ? new URL(view.path, normalizedBaseUrl) : new URL(normalizedBaseUrl)
  const params = { ...fixedView, ...view }
  delete params.path
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForRuntimeHttp (url = normalizedBaseUrl) {
  let lastError
  for (let attempt = 1; attempt <= runtimeHealthRetries; attempt++) {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (response && response.ok) return
      lastError = new Error(`runtime returned HTTP ${response && response.status}`)
    } catch (error) {
      lastError = error
    }
    await sleep(runtimeHealthDelayMs)
  }
  throw new Error(`runtime did not become reachable at ${url}: ${lastError ? lastError.message : 'unknown error'}`)
}

async function openRuntimePage (browser, profile, view = {}) {
  const url = runtimeUrlForView(view)
  await waitForRuntimeHttp(url)
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  await context.addInitScript((denseStarsProfile) => {
    localStorage.setItem('orasDenseStarsProfile', denseStarsProfile)
  }, profile)
  const page = await context.newPage()
  const consoleMessages = []
  const fatalErrors = []
  page.on('console', message => consoleMessages.push(message.text()))
  page.on('pageerror', error => fatalErrors.push(error.message))
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs })
      lastError = null
      break
    } catch (error) {
      lastError = error
      if (!/ERR_CONNECTION_RESET|ECONNRESET|Navigation timeout/i.test(String(error && error.message))) {
        throw error
      }
      await sleep(runtimeHealthDelayMs * attempt)
      await waitForRuntimeHttp(url)
    }
  }
  if (lastError) throw lastError
  await page.locator('#stel-canvas').waitFor({ state: 'visible', timeout: timeoutMs })
  await page.locator('.tsearch input').first().waitFor({ state: 'visible', timeout: timeoutMs })
  await page.waitForTimeout(settleMs)
  return { context, page, consoleMessages, fatalErrors, profile }
}

async function getDenseStarManifest (page) {
  const manifestUrl = new URL(
    'skydata/dense-star-tiles/manifest.json',
    normalizedBaseUrl
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
    .filter(entry => entry.name.includes(`/dense-star-tiles/profiles/${profileId}/Norder`))
    .length, profile)
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

function assertVisualMetrics (field, metrics) {
  if (!Number.isFinite(metrics.brightPixelRetentionRatio) || metrics.brightPixelRetentionRatio < minimumVisualBrightPixelRetention) {
    throw new Error(`${field.id} visual profile retained too few baseline bright pixels: ${metrics.brightPixelRetentionRatio}`)
  }
  if (metrics.brightPixelRatio > maxVisualBrightPixelRatio) {
    throw new Error(`${field.id} visual profile bright-pixel ratio too high: ${metrics.brightPixelRatio}`)
  }
  if (metrics.addedBrightPixelRatio > maxVisualAddedBrightPixelRatio) {
    throw new Error(`${field.id} visual profile added bright-pixel ratio too high: ${metrics.addedBrightPixelRatio}`)
  }
  if (metrics.maxBrightBlobArea > maxBrightBlobArea) {
    throw new Error(`${field.id} visual profile bright blob too large: ${metrics.maxBrightBlobArea}`)
  }
  if (metrics.averageBrightBlobRadius > maxAverageBrightBlobRadius) {
    throw new Error(`${field.id} visual profile average bright blob radius too high: ${metrics.averageBrightBlobRadius}`)
  }
}

function profileWarnings (field, profileId, metrics) {
  const warnings = []
  if (profileId === 'binocular') {
    if (metrics.brightPixelRatio > 0.09) warnings.push(`${field.id} binocular bright-pixel ratio borderline: ${metrics.brightPixelRatio}`)
    if (metrics.maxBrightBlobArea > 1300) warnings.push(`${field.id} binocular bright blob borderline: ${metrics.maxBrightBlobArea}`)
  }
  if (profileId === 'deep-catalog') {
    if (metrics.brightPixelRatio > 0.14) warnings.push(`${field.id} deep-catalog bright-pixel ratio high: ${metrics.brightPixelRatio}`)
    if (metrics.maxBrightBlobArea > 1800) warnings.push(`${field.id} deep-catalog bright blob high: ${metrics.maxBrightBlobArea}`)
  }
  return warnings
}

function writeContactSheet (summary) {
  const rows = summary.fields.map(field => {
    const cells = DENSE_STAR_PROFILES.map(profile => {
      const artifact = field.profiles[profile.id] && field.profiles[profile.id].artifact
      return `<td><strong>${profile.label}</strong><br>${artifact ? `<img src="${artifact}" alt="${field.id} ${profile.id}">` : 'missing'}</td>`
    }).join('\n')
    return `<tr><th>${field.label}<br><code>${field.id}</code></th>${cells}</tr>`
  }).join('\n')
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>ORAS Dense Stars QA Contact Sheet</title>
  <style>
    body { background: #101622; color: #f3f6ff; font-family: sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #2b3446; padding: 8px; vertical-align: top; }
    img { width: 280px; max-width: 100%; border: 1px solid #46516a; }
    code { color: #a9d0ff; }
  </style>
</head>
<body>
  <h1>ORAS Dense Stars QA Contact Sheet</h1>
  <p>Default profile: ${summary.defaultProfile}; Visual stars: ${summary.visualStarCount}; label count: ${summary.maxVisualLabelCount}</p>
  <table>
    <thead><tr><th>Field</th>${DENSE_STAR_PROFILES.map(profile => `<th>${profile.label}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>
`
  fs.writeFileSync(path.join(artifactRoot, 'dense-stars-contact-sheet.html'), html)
}

async function validateDenseStars () {
  fs.rmSync(artifactRoot, { recursive: true, force: true })
  fs.mkdirSync(artifactRoot, { recursive: true })
  await waitForRuntimeHttp()
  const browser = await chromium.launch({ headless: true })
  const contexts = []

  try {
    const bootstrap = await openRuntimePage(browser, 'visual-default', DENSE_STAR_QA_FIELDS[0].view)
    contexts.push(bootstrap.context)
    const manifest = await getDenseStarManifest(bootstrap.page)
    if (manifest.default_profile !== 'visual-default') throw new Error(`wrong default profile: ${manifest.default_profile}`)
    if (!manifest.profiles || !manifest.profiles['visual-default'] || !manifest.profiles['deep-catalog']) {
      throw new Error(`dense star profiles missing: ${JSON.stringify(manifest.profiles || {})}`)
    }
    const visualProfile = manifest.profiles['visual-default']
    const binocularProfile = manifest.profiles.binocular
    const deepProfile = manifest.profiles['deep-catalog']
    if (Number(visualProfile.magnitude_limit) > 5.0) throw new Error(`visual profile too deep: ${visualProfile.magnitude_limit}`)
    if (Number(deepProfile.magnitude_limit) <= Number(visualProfile.magnitude_limit)) throw new Error('deep catalog is not deeper than visual profile')
    if (Number(visualProfile.star_count) >= Number(deepProfile.star_count)) throw new Error('visual profile is not smaller than deep catalog')
    if (!binocularProfile || Number(binocularProfile.magnitude_limit) <= Number(visualProfile.magnitude_limit)) {
      throw new Error('binocular profile is missing or not deeper than visual profile')
    }

    const dialog = await openDenseStarsStatus(bootstrap.page)
    const text = await dialog.innerText()
    for (const expected of ['Active profile', 'visual-default', 'Magnitude limit', 'Labels', 'suppressed', 'Visual Sky is the realistic default', 'Binocular Depth']) {
      if (!text.includes(expected)) throw new Error(`dense status missing ${expected}: ${text}`)
    }
    await writeElementTextArtifact(bootstrap.page, '.oras-dense-stars-status', 'dense-stars-status.txt')
    assertConsoleClean(bootstrap.consoleMessages, bootstrap.fatalErrors)

    const fields = []
    const warnings = []
    let maxVisualLabelCountSeen = 0
    let maxVisualBrightPixelRatioSeen = 0
    let maxVisualAddedBrightPixelRatioSeen = 0
    let maxVisualBlobAreaSeen = 0
    let minimumVisualBrightPixelRetentionSeen = Number.POSITIVE_INFINITY

    for (const field of DENSE_STAR_QA_FIELDS) {
      const fieldResult = {
        id: field.id,
        label: field.label,
        view: Object.assign({}, fixedView, field.view),
        profiles: {}
      }
      let offScreenshot = null

      for (const profile of DENSE_STAR_PROFILES) {
        const pageRun = await openRuntimePage(browser, profile.id, field.view)
        try {
          if (profile.id !== 'off') {
            await pageRun.page.waitForFunction(
              (profileId) => performance.getEntriesByType('resource').some(entry =>
                entry.name.includes(`/dense-star-tiles/profiles/${profileId}/Norder`)
              ),
              profile.id,
              { timeout: timeoutMs }
            )
            await pageRun.page.waitForTimeout(tileSettleMs)
          }

          const profileResources = profile.id === 'off'
            ? await profileResourceCount(pageRun.page, 'visual-default') + await profileResourceCount(pageRun.page, 'binocular') + await profileResourceCount(pageRun.page, 'deep-catalog')
            : await profileResourceCount(pageRun.page, profile.id)
          if (profile.id === 'off' && profileResources !== 0) {
            throw new Error(`${field.id} loaded dense star resources while off: ${profileResources}`)
          }
          if (profile.id !== 'off' && profileResources < 1) {
            throw new Error(`${field.id} ${profile.id} native resources did not load`)
          }

          const artifact = `dense-stars-${field.id}-${profile.id}.png`
          const screenshot = await capturePageArtifact(pageRun.page, artifact)
          const labelCount = profile.id === 'visual-default' ? await visibleLabelCount(pageRun.page) : 0
          const metrics = computeScreenshotMetrics(screenshot, offScreenshot)
          fieldResult.profiles[profile.id] = {
            label: profile.label,
            artifact,
            labelCount,
            resourceCount: profileResources,
            metrics
          }

          if (profile.id === 'off') {
            offScreenshot = screenshot
          } else {
            warnings.push(...profileWarnings(field, profile.id, metrics))
          }
          if (profile.id === 'visual-default') {
            if (labelCount > maxVisualLabelCount) throw new Error(`${field.id} visual profile label count too high: ${labelCount}`)
            assertVisualMetrics(field, metrics)
            maxVisualLabelCountSeen = Math.max(maxVisualLabelCountSeen, labelCount)
            maxVisualBrightPixelRatioSeen = Math.max(maxVisualBrightPixelRatioSeen, metrics.brightPixelRatio)
            maxVisualAddedBrightPixelRatioSeen = Math.max(maxVisualAddedBrightPixelRatioSeen, metrics.addedBrightPixelRatio || 0)
            maxVisualBlobAreaSeen = Math.max(maxVisualBlobAreaSeen, metrics.maxBrightBlobArea)
            minimumVisualBrightPixelRetentionSeen = Math.min(minimumVisualBrightPixelRetentionSeen, metrics.brightPixelRetentionRatio)
          }

          assertConsoleClean(pageRun.consoleMessages, pageRun.fatalErrors)
        } finally {
          await pageRun.context.close().catch(() => {})
        }
      }

      fields.push(fieldResult)
    }

    const summary = {
      baseUrl,
      defaultProfile: manifest.default_profile,
      visualStarCount: Number(visualProfile.star_count),
      binocularStarCount: Number(manifest.profiles.binocular.star_count),
      deepCatalogStarCount: Number(deepProfile.star_count),
      visualMagnitudeLimit: Number(visualProfile.magnitude_limit),
      binocularMagnitudeLimit: Number(manifest.profiles.binocular.magnitude_limit),
      deepCatalogMagnitudeLimit: Number(deepProfile.magnitude_limit),
      maxVisualLabelCount: maxVisualLabelCountSeen,
      maxVisualBrightPixelRatio: maxVisualBrightPixelRatioSeen,
      maxVisualAddedBrightPixelRatio: maxVisualAddedBrightPixelRatioSeen,
      maxVisualBrightBlobArea: maxVisualBlobAreaSeen,
      minimumVisualBrightPixelRetention: minimumVisualBrightPixelRetentionSeen,
      visualWideMetrics: fields.find(field => field.id === 'horizon-north').profiles['visual-default'].metrics,
      visualMediumMetrics: fields.find(field => field.id === 'm31').profiles['visual-default'].metrics,
      fields,
      warnings,
      artifacts: fs.readdirSync(artifactRoot).sort()
    }
    writeContactSheet(summary)
    summary.artifacts = fs.readdirSync(artifactRoot).sort()
    fs.writeFileSync(path.join(artifactRoot, 'acceptance-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    fs.writeFileSync(path.join(artifactRoot, 'dense-stars-qa-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    if (warnings.length) fs.writeFileSync(path.join(artifactRoot, 'dense-stars-qa-warnings.txt'), `${warnings.join('\n')}\n`)
    console.log(`DENSE_STARS_PASS fields=${fields.length} defaultProfile=${summary.defaultProfile} visualStars=${summary.visualStarCount} deepStars=${summary.deepCatalogStarCount} labelCount=${summary.maxVisualLabelCount} brightPixelRatio=${summary.maxVisualBrightPixelRatio} brightPixelRetention=${summary.minimumVisualBrightPixelRetention} maxBrightBlobArea=${summary.maxVisualBrightBlobArea}`)
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
