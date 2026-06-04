const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const timeoutMs = Number(process.env.ORAS_DEEP_LINK_TIMEOUT_MS || 90000)

const cases = [
  {
    name: 'M31',
    path: 'skysource/M31AndromedaGalaxy?catalog=Messier%20(local)&source_id=M31&model=dso&ra=10.68&dec=41.269&fov=3.2447&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['M31 Andromeda Galaxy', 'Galaxy', 'Ra/Dec', 'LAT 41.440', 'FOV 3.24'],
    forbiddenText: ['Unknown Type'],
  },
  {
    name: 'Betelgeuse',
    path: 'skysource/Betelgeuse?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-betelgeuse&model=star&ra=88.7929&dec=7.4071&fov=1.9920&date=2026-06-04T02%3A15%3A23Z&lat=41.44&lng=-79.69&elev=0',
    requiredText: ['Betelgeuse', 'Star', 'Alpha Orionis', 'Ra/Dec', 'LAT 41.440', 'FOV 1.99'],
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

async function waitForPageText(page, expectedText) {
  await page.waitForFunction((text) => document.body && document.body.innerText.includes(text), expectedText, { timeout: timeoutMs })
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

  const bodyText = await page.locator('body').innerText({ timeout: timeoutMs })
  for (const text of testCase.forbiddenText) {
    if (bodyText.includes(text)) {
      throw new Error(`${testCase.name} showed forbidden text: ${text}`)
    }
  }

  const forbiddenConsoleMessage = consoleMessages.find((message) => {
    return forbiddenConsolePatterns.some((pattern) => pattern.test(message))
  })
  if (forbiddenConsoleMessage) {
    throw new Error(`${testCase.name} emitted forbidden console message: ${forbiddenConsoleMessage}`)
  }

  await context.close()
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const testCase of cases) {
      await validateCase(browser, testCase)
      console.log(`PASS ${testCase.name}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
