const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const timeoutMs = Number(process.env.ORAS_DEEP_LINK_TIMEOUT_MS || 90000)

const cases = [
  {
    name: 'M31',
    path: 'skysource/M31AndromedaGalaxy?catalog=Messier%20(local)&source_id=M31&model=dso&ra=10.68&dec=41.269&fov=3.2447&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Andromeda Galaxy', 'M 31', 'NGC 224', 'Galaxy', 'Ra/Dec', 'LAT 41.440', 'FOV 3.24'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/00h\s+44m/i, /\+41°/],
  },
  {
    name: 'Betelgeuse',
    path: 'skysource/Betelgeuse?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-betelgeuse&model=star&ra=88.7925&dec=7.4071&fov=1.9920&date=2026-06-04T02%3A15%3A23Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Betelgeuse', 'Star', 'Alpha Orionis', 'Ra/Dec', 'LAT 41.440', 'FOV 1.99'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/05h\s+5[56]m/i, /\+07°/],
  },
  {
    name: 'Achernar',
    path: 'skysource/Achernar?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-achernar&model=star&ra=24.429&dec=-57.2368&fov=1.81&date=2026-06-04T02%3A16%3A04Z&lat=41.41&lng=-80.37&elev=0',
    requiredText: ['Achernar', 'Star', 'Ra/Dec', 'LAT 41.410', 'FOV 1.81'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/01h\s+3[78]m/i, /-57°/],
  },
  {
    name: 'Gaia proof star',
    path: 'skysource/GaiaDR22252802052894084352?catalog=Gaia%20DR2&source_id=2252802052894084352&model=star&ra=287.3080617529185&dec=63.94083283337751&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Gaia DR2 2252802052894084352', 'Star', 'Ra/Dec', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/19h\s+09m/i, /\+63°/],
    allowControlledNotIndexed: true,
  },
  {
    name: 'M42',
    path: 'skysource/M42OrionNebula?catalog=Messier%20(local)&source_id=M42&model=dso&ra=83.82&dec=-5.391&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Orion Nebula', 'Nebula', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
  },
  {
    name: 'M13',
    path: 'skysource/M13HerculesCluster?catalog=Messier%20(local)&source_id=M13&model=dso&ra=250.47&dec=36.467&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Hercules Cluster', 'Cluster', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
  },
]

const forbiddenConsolePatterns = [
  /Cannot uncompress gz file/i,
  /Parsed -1 satellites/i,
  /Failed to resolve exact sky source route/i,
  /Sky source route identity lookup failed/i,
]

function buildUrl(path) {
  return new URL(path, baseUrl).toString()
}

function normalizeText(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ')
}

async function waitForPageText(page, expectedText) {
  await page.waitForFunction((text) => document.body && document.body.innerText.includes(text), expectedText, { timeout: timeoutMs })
}

async function waitForBodyText(page) {
  return page.locator('body').innerText({ timeout: timeoutMs }).then(normalizeText)
}

function validateTargetCoordinates(testCase, bodyText) {
  if (!testCase.coordinatePatterns) {
    return
  }

  for (const pattern of testCase.coordinatePatterns) {
    if (!pattern.test(bodyText)) {
      if (testCase.allowControlledNotIndexed && bodyText.includes('not present in the local ORAS catalog yet')) {
        return
      }
      throw new Error(`${testCase.name} did not show expected target coordinates matching ${pattern}`)
    }
  }
}

async function waitForSatelliteParse(consoleMessages) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const parsedMessage = consoleMessages.find((message) => /Parsed ([0-9]+) satellites/i.test(message))
    if (parsedMessage) {
      const count = Number(parsedMessage.match(/Parsed ([0-9]+) satellites/i)[1])
      if (count > 0) {
        return count
      }
      throw new Error(`Satellite parser returned invalid count: ${parsedMessage}`)
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('Timed out waiting for positive satellite parse count')
}

async function validateCase(browser, testCase) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const consoleMessages = []

  page.on('console', (message) => {
    consoleMessages.push(message.text())
  })
  page.on('pageerror', (error) => {
    consoleMessages.push(error.message)
  })

  await page.goto(buildUrl(testCase.path), { waitUntil: 'domcontentloaded', timeout: timeoutMs })

  for (const text of testCase.requiredText) {
    await waitForPageText(page, text)
  }

  const bodyText = await waitForBodyText(page)
  for (const text of testCase.forbiddenText) {
    if (bodyText.includes(text)) {
      throw new Error(`${testCase.name} showed forbidden text: ${text}`)
    }
  }
  validateTargetCoordinates(testCase, bodyText)

  const satelliteCount = await waitForSatelliteParse(consoleMessages)
  const forbiddenConsoleMessage = consoleMessages.find((message) => {
    return forbiddenConsolePatterns.some((pattern) => pattern.test(message))
  })
  if (forbiddenConsoleMessage) {
    throw new Error(`${testCase.name} emitted forbidden console message: ${forbiddenConsoleMessage}`)
  }

  await context.close()
  return { satelliteCount }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const testCase of cases) {
      const result = await validateCase(browser, testCase)
      console.log(`PASS ${testCase.name} satellites=${result.satelliteCount}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
