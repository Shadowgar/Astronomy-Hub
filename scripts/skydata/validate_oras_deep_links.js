const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const apiBaseUrl = process.env.ORAS_API_BASE_URL || 'http://127.0.0.1:8000'
const timeoutMs = Number(process.env.ORAS_DEEP_LINK_TIMEOUT_MS || 90000)
const cameraToleranceRad = Number(process.env.ORAS_DEEP_LINK_CAMERA_TOLERANCE_RAD || 0.02)

const cases = [
  {
    name: 'M31',
    path: 'skysource/M31AndromedaGalaxy?catalog=Messier%20(local)&source_id=M31&model=dso&ra=10.68&dec=41.269&fov=3.2447&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M31', model: 'dso' },
    requiredText: ['Andromeda Galaxy', 'M 31', 'NGC 224', 'Galaxy', 'Ra/Dec', 'LAT 41.440', 'FOV 3.24'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/00h\s+44m/i, /\+41°/],
    requireIndexed: true,
  },
  {
    name: 'Sirius',
    path: 'skysource/Sirius?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-sirius&model=star&ra=101.2875&dec=-16.7161&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Bright Star Catalog (local)', sourceId: 'star-sirius', model: 'star' },
    requiredText: ['Sirius', 'Star', 'Ra/Dec', 'LAT 41.440', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/06h\s+4[56]m/i, /-16°/],
    requireIndexed: true,
  },
  {
    name: 'Betelgeuse',
    path: 'skysource/Betelgeuse?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-betelgeuse&model=star&ra=88.7925&dec=7.4071&fov=1.9920&date=2026-06-04T02%3A15%3A23Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Bright Star Catalog (local)', sourceId: 'star-betelgeuse', model: 'star' },
    requiredText: ['Betelgeuse', 'Star', 'Alpha Orionis', 'Ra/Dec', 'LAT 41.440', 'FOV 1.99'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/05h\s+5[56]m/i, /\+07°/],
    requireIndexed: true,
  },
  {
    name: 'Achernar',
    path: 'skysource/Achernar?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-achernar&model=star&ra=24.429&dec=-57.2368&fov=1.81&date=2026-06-04T02%3A16%3A04Z&lat=41.41&lng=-80.37&elev=0',
    identity: { catalog: 'Bright Star Catalog (local)', sourceId: 'star-achernar', model: 'star' },
    requiredText: ['Achernar', 'Star', 'Ra/Dec', 'LAT 41.410', 'FOV 1.81'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/01h\s+3[78]m/i, /-57°/],
    requireIndexed: true,
  },
  {
    name: 'Vega',
    path: 'skysource/Vega?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-vega&model=star&ra=279.234&dec=38.7837&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Bright Star Catalog (local)', sourceId: 'star-vega', model: 'star' },
    requiredText: ['Vega', 'Star', 'Ra/Dec', 'LAT 41.440', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/18h\s+3[67]m/i, /\+38°/],
    requireIndexed: true,
  },
  {
    name: 'Antares',
    path: 'skysource/Antares?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-antares&model=star&ra=247.3515&dec=-26.4319&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Bright Star Catalog (local)', sourceId: 'star-antares', model: 'star' },
    requiredText: ['Antares', 'Star', 'Ra/Dec', 'LAT 41.440', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/16h\s+3[01]m/i, /-26°/],
    requireIndexed: true,
  },
  {
    name: 'Gaia proof star',
    path: 'skysource/GaiaDR22252802052894084352?catalog=Gaia%20DR2&source_id=2252802052894084352&model=star&ra=287.3080617529185&dec=63.94083283337751&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Gaia DR2', sourceId: '2252802052894084352', model: 'star' },
    requiredText: ['Gaia DR2 2252802052894084352', 'Star', 'Ra/Dec', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/19h\s+09m/i, /\+63°/],
    requireIndexed: true,
  },
  {
    name: 'Gaia controlled not-indexed star',
    path: 'skysource/GaiaDR2999999999999999999?catalog=Gaia%20DR2&source_id=999999999999999999&model=star&ra=123.45&dec=-54.321&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Gaia DR2', sourceId: '999999999999999999', model: 'star' },
    requiredText: ['Gaia DR2 999999999999999999', 'Star', 'Ra/Dec', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/08h\s+1[34]m/i, /-54°/],
    requireIndexed: false,
    requiredStatus: 'not_indexed',
  },
  {
    name: 'M42',
    path: 'skysource/M42OrionNebula?catalog=Messier%20(local)&source_id=M42&model=dso&ra=83.82&dec=-5.391&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M42', model: 'dso' },
    requiredText: ['Orion Nebula', 'Nebula', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'M13',
    path: 'skysource/M13HerculesCluster?catalog=Messier%20(local)&source_id=M13&model=dso&ra=250.47&dec=36.467&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M13', model: 'dso' },
    requiredText: ['Hercules Cluster', 'Cluster', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'M45',
    path: 'skysource/M45Pleiades?catalog=Messier%20(local)&source_id=M45&model=dso&ra=56.88&dec=24.117&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M45', model: 'dso' },
    requiredText: ['Pleiades', 'Cluster', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'M57',
    path: 'skysource/M57RingNebula?catalog=Messier%20(local)&source_id=M57&model=dso&ra=283.395&dec=33.028&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M57', model: 'dso' },
    requiredText: ['Ring Nebula', 'Nebula', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'M81',
    path: 'skysource/M81BodesGalaxy?catalog=Messier%20(local)&source_id=M81&model=dso&ra=148.89&dec=69.065&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M81', model: 'dso' },
    requiredText: ["Bode's Galaxy", 'Galaxy', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'M82',
    path: 'skysource/M82CigarGalaxy?catalog=Messier%20(local)&source_id=M82&model=dso&ra=149.04&dec=69.679&fov=2.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Messier (local)', sourceId: 'M82', model: 'dso' },
    requiredText: ['Cigar Galaxy', 'Galaxy', 'Ra/Dec', 'FOV 2.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
]

const unavailableCases = [
  {
    name: 'Polaris',
    apiPath: '/api/sky/object?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-polaris&model=star',
  },
  {
    name: "C6 / Cat's Eye Nebula",
    apiPath: '/api/sky/object?catalog=Caldwell%20(local)&source_id=C6&model=dso',
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

function buildApiUrl(path) {
  return new URL(path, apiBaseUrl).toString()
}

function normalizeText(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ')
}

function normalizeIdentity(value) {
  return String(value == null ? '' : value).trim().toLowerCase()
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
      throw new Error(`${testCase.name} did not show expected target coordinates matching ${pattern}`)
    }
  }
}

async function readRuntimeTargetState(page, identity) {
  return page.evaluate((expectedIdentity) => {
    const appElement = document.querySelector('#app')
    const vm = appElement && appElement.__vue__
    const stel = vm && vm.$stel
    const selection = stel && stel.core && stel.core.selection
    const selectedObject = vm && vm.$store && vm.$store.state && vm.$store.state.selectedObject

    if (!vm || !stel || !selection || !selectedObject) {
      return { ready: false, reason: 'runtime selection not ready' }
    }

    const normalize = (value) => String(value == null ? '' : value).trim().toLowerCase()
    const identityMatches =
      normalize(selectedObject.catalog) === normalize(expectedIdentity.catalog) &&
      normalize(selectedObject.source_id) === normalize(expectedIdentity.sourceId) &&
      normalize(selectedObject.model) === normalize(expectedIdentity.model)

    let yawDiff = null
    let pitchDiff = null
    try {
      const radec = selection.getInfo('radec')
      const observed = stel.convertFrame(stel.core.observer, 'ICRF', 'OBSERVED', radec)
      const azalt = stel.c2s(observed)
      const normalizeAngle = (angle) => {
        while (angle <= -Math.PI) angle += Math.PI * 2
        while (angle > Math.PI) angle -= Math.PI * 2
        return angle
      }
      yawDiff = Math.abs(normalizeAngle(stel.core.observer.yaw - azalt[0]))
      pitchDiff = Math.abs(stel.core.observer.pitch - azalt[1])
    } catch (error) {
      return {
        ready: true,
        identityMatches,
        selectedObject,
        cameraCentered: false,
        reason: String(error && error.message ? error.message : error),
      }
    }

    return {
      ready: true,
      identityMatches,
      selectedObject,
      cameraCentered: yawDiff != null && pitchDiff != null && yawDiff <= expectedIdentity.cameraToleranceRad && pitchDiff <= expectedIdentity.cameraToleranceRad,
      yawDiff,
      pitchDiff,
    }
  }, Object.assign({}, identity, { cameraToleranceRad }))
}

async function validateRuntimeTargetState(page, testCase) {
  const deadline = Date.now() + timeoutMs
  let lastState = null

  while (Date.now() < deadline) {
    lastState = await readRuntimeTargetState(page, testCase.identity)
    if (lastState.ready && lastState.identityMatches && lastState.cameraCentered) {
      break
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  if (!lastState || !lastState.ready) {
    throw new Error(`${testCase.name} runtime target did not become ready: ${JSON.stringify(lastState)}`)
  }
  if (!lastState.identityMatches) {
    throw new Error(`${testCase.name} selected wrong identity: ${JSON.stringify(lastState.selectedObject)}`)
  }
  if (!lastState.cameraCentered) {
    throw new Error(`${testCase.name} selected panel but camera did not center: ${JSON.stringify(lastState)}`)
  }
  if (typeof testCase.requireIndexed === 'boolean' && Boolean(lastState.selectedObject.indexed) !== testCase.requireIndexed) {
    throw new Error(`${testCase.name} indexed state mismatch: ${JSON.stringify(lastState.selectedObject)}`)
  }
  if (testCase.requiredStatus && lastState.selectedObject.status !== testCase.requiredStatus) {
    throw new Error(`${testCase.name} status mismatch: ${JSON.stringify(lastState.selectedObject)}`)
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
  await validateRuntimeTargetState(page, testCase)

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

async function validateUnavailableCases() {
  for (const unavailableCase of unavailableCases) {
    const response = await fetch(buildApiUrl(unavailableCase.apiPath))
    const body = await response.json().catch(() => ({}))
    if (response.ok) {
      throw new Error(`${unavailableCase.name} is now available; add it as a positive exact-link validation case`)
    }
    if (!body.error || body.error.code !== 'not_found') {
      throw new Error(`${unavailableCase.name} did not return controlled not_found: ${JSON.stringify(body)}`)
    }
    console.log(`SKIP_UNAVAILABLE ${unavailableCase.name} reason=${body.error.message}`)
  }
}

async function main() {
  await validateUnavailableCases()

  const browser = await chromium.launch({ headless: true })
  try {
    for (const testCase of cases) {
      if (!testCase.identity || !testCase.identity.catalog || !testCase.identity.sourceId || !testCase.identity.model) {
        throw new Error(`${testCase.name} is missing exact identity metadata`)
      }
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
