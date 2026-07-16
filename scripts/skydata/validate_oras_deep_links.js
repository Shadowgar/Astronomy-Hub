const { chromium } = require('playwright')

const baseUrl = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const apiBaseUrl = process.env.ORAS_API_BASE_URL || 'http://127.0.0.1:8000'
const timeoutMs = Number(process.env.ORAS_DEEP_LINK_TIMEOUT_MS || 90000)
const cameraToleranceRad = Number(process.env.ORAS_DEEP_LINK_CAMERA_TOLERANCE_RAD || 0.02)
const solarSystemTestTime = '2027-01-15T02:00:00Z'
const visibleSatelliteTestTime = process.env.ORAS_SATELLITE_VALIDATION_TIME || new Date().toISOString()
const solarSystemLocation = { lat: '41.44', lng: '-79.69', elev: '0' }

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
    name: 'Polaris',
    path: 'skysource/Polaris?catalog=Hipparcos%20Tier%202%20(local)&source_id=hip-11767&model=star&ra=37.946145&dec=89.264138&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Hipparcos Tier 2 (local)', sourceId: 'hip-11767', model: 'star' },
    requiredText: ['Polaris', 'Star', 'Ra/Dec', 'LAT 41.440', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    // SWE displays precessed equinox-of-date coordinates in the detail panel.
    coordinatePatterns: [/03h\s+0[34]m/i, /\+89°/],
    requireIndexed: true,
  },
  {
    name: 'Gaia DR3 indexed pack star',
    path: 'skysource/GaiaDR31576683529448755328?catalog=Gaia%20DR3&source_id=1576683529448755328&model=star&ra=193.5081784678&dec=55.9597847789&fov=1.50&date=2026-06-04T02%3A16%3A04Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'Gaia DR3', sourceId: '1576683529448755328', model: 'star' },
    requiredText: ['Gaia DR3 1576683529448755328', 'Star', 'Ra/Dec', 'FOV 1.50'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/12h\s+5[45]m/i, /\+55°/],
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
    coordinateToleranceDeg: 0.2,
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
  {
    name: 'NGC 6543',
    path: 'skysource/NGC6543CatsEyeNebula?catalog=NGC%20%28OpenNGC%29&source_id=NGC6543&model=dso&ra=269.639125&dec=66.6331944444&fov=1.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'NGC (OpenNGC)', sourceId: 'NGC6543', model: 'dso' },
    requiredText: ["Cat's Eye Nebula", 'Nebula', 'Ra/Dec', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'NGC 7000',
    path: 'skysource/NGC7000NorthAmericaNebula?catalog=NGC%20%28OpenNGC%29&source_id=NGC7000&model=dso&ra=314.8214166667&dec=44.5287777778&fov=4.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'NGC (OpenNGC)', sourceId: 'NGC7000', model: 'dso' },
    requiredText: ['North America Nebula', 'Nebula', 'Ra/Dec', 'FOV 4.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'NGC 6960',
    path: 'skysource/NGC6960VeilNebula?catalog=NGC%20%28OpenNGC%29&source_id=NGC6960&model=dso&ra=311.4924166667&dec=30.5951388889&fov=4.00&date=2026-06-04T02%3A17%3A13Z&lat=41.44&lng=-79.69&elev=0',
    identity: { catalog: 'NGC (OpenNGC)', sourceId: 'NGC6960', model: 'dso' },
    requiredText: ['Veil Nebula', 'Ra/Dec', 'FOV 4.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
  },
  {
    name: 'Moon',
    path: `skysource/Moon?catalog=Solar%20System%20(JPL)&source_id=moon&model=moon&ra=11.8477916667&dec=9.4291666667&fov=1.20&date=${encodeURIComponent(solarSystemTestTime)}&lat=${solarSystemLocation.lat}&lng=${solarSystemLocation.lng}&elev=${solarSystemLocation.elev}`,
    identity: { catalog: 'Solar System (JPL)', sourceId: 'moon', model: 'moon' },
    requiredText: ['Moon', 'Solar System Object', 'Ra/Dec', 'LAT 41.440', 'FOV 1.20'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/00h\s+47m/i, /\+09°/],
    requireIndexed: true,
    coordinateToleranceDeg: 1.0,
  },
  {
    name: 'Venus',
    path: `skysource/Venus?catalog=Solar%20System%20(JPL)&source_id=venus&model=planet&ra=246.9777916667&dec=-18.5039166667&fov=1.00&date=${encodeURIComponent(solarSystemTestTime)}&lat=${solarSystemLocation.lat}&lng=${solarSystemLocation.lng}&elev=${solarSystemLocation.elev}`,
    identity: { catalog: 'Solar System (JPL)', sourceId: 'venus', model: 'planet' },
    requiredText: ['Venus', 'Solar System Object', 'Ra/Dec', 'LAT 41.440', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/16h\s+2[78]m/i, /-18°/],
    requireIndexed: true,
    coordinateToleranceDeg: 1.0,
  },
  {
    name: 'Mars',
    path: `skysource/Mars?catalog=Solar%20System%20(JPL)&source_id=mars&model=planet&ra=163.2622916667&dec=11.1885277778&fov=1.00&date=${encodeURIComponent(solarSystemTestTime)}&lat=${solarSystemLocation.lat}&lng=${solarSystemLocation.lng}&elev=${solarSystemLocation.elev}`,
    identity: { catalog: 'Solar System (JPL)', sourceId: 'mars', model: 'planet' },
    requiredText: ['Mars', 'Solar System Object', 'Ra/Dec', 'LAT 41.440', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/10h\s+5[23]m/i, /\+11°/],
    requireIndexed: true,
    coordinateToleranceDeg: 1.0,
  },
  {
    name: 'Jupiter',
    path: `skysource/Jupiter?catalog=Solar%20System%20(JPL)&source_id=jupiter&model=planet&ra=147.9171666667&dec=14.0108611111&fov=1.00&date=${encodeURIComponent(solarSystemTestTime)}&lat=${solarSystemLocation.lat}&lng=${solarSystemLocation.lng}&elev=${solarSystemLocation.elev}`,
    identity: { catalog: 'Solar System (JPL)', sourceId: 'jupiter', model: 'planet' },
    requiredText: ['Jupiter', 'Solar System Object', 'Ra/Dec', 'LAT 41.440', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/09h\s+5[12]m/i, /\+14°/],
    requireIndexed: true,
    coordinateToleranceDeg: 1.0,
  },
  {
    name: 'Saturn',
    path: `skysource/Saturn?catalog=Solar%20System%20(JPL)&source_id=saturn&model=planet&ra=9.24125&dec=1.3732222222&fov=1.00&date=${encodeURIComponent(solarSystemTestTime)}&lat=${solarSystemLocation.lat}&lng=${solarSystemLocation.lng}&elev=${solarSystemLocation.elev}`,
    identity: { catalog: 'Solar System (JPL)', sourceId: 'saturn', model: 'planet' },
    requiredText: ['Saturn', 'Solar System Object', 'Ra/Dec', 'LAT 41.440', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    coordinatePatterns: [/00h\s+3[67]m/i, /\+01°/],
    requireIndexed: true,
    coordinateToleranceDeg: 1.0,
  },
]

const solarSystemApiCases = [
  { name: 'Moon', sourceId: 'moon', model: 'moon' },
  { name: 'Venus', sourceId: 'venus', model: 'planet' },
  { name: 'Mars', sourceId: 'mars', model: 'planet' },
  { name: 'Jupiter', sourceId: 'jupiter', model: 'planet' },
  { name: 'Saturn', sourceId: 'saturn', model: 'planet' },
]

const satelliteApiCases = [
  { name: 'ISS', sourceId: '25544', model: 'tle_satellite' },
]

const searchAliasCases = [
  {
    name: 'Polaris',
    query: 'Polaris',
    expected: { catalog: 'Hipparcos Tier 2 (local)', sourceId: 'hip-11767', model: 'star' },
  },
  {
    name: "C6 / Cat's Eye Nebula",
    query: 'C6',
    expected: { catalog: 'NGC (OpenNGC)', sourceId: 'NGC6543', model: 'dso' },
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

function buildSolarSystemApiPath(testCase) {
  const query = new URLSearchParams({
    catalog: 'Solar System (JPL)',
    source_id: testCase.sourceId,
    model: testCase.model,
    lat: solarSystemLocation.lat,
    lng: solarSystemLocation.lng,
    time: solarSystemTestTime,
    elev: solarSystemLocation.elev,
  })
  return `/api/sky/object?${query.toString()}`
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
    let targetRaDeg = null
    let targetDecDeg = null
    let targetCoordinateDiffDeg = null
    try {
      const radec = selection.getInfo('radec')
      const targetSpherical = stel.c2s(radec)
      targetRaDeg = ((targetSpherical[0] * 180 / Math.PI) % 360 + 360) % 360
      targetDecDeg = targetSpherical[1] * 180 / Math.PI
      if (Number.isFinite(expectedIdentity.expectedRaDeg) && Number.isFinite(expectedIdentity.expectedDecDeg)) {
        const radians = Math.PI / 180
        const targetRa = targetRaDeg * radians
        const targetDec = targetDecDeg * radians
        const expectedRa = expectedIdentity.expectedRaDeg * radians
        const expectedDec = expectedIdentity.expectedDecDeg * radians
        const cosSeparation = Math.max(-1, Math.min(1,
          Math.sin(targetDec) * Math.sin(expectedDec) +
          Math.cos(targetDec) * Math.cos(expectedDec) * Math.cos(targetRa - expectedRa)
        ))
        targetCoordinateDiffDeg = Math.acos(cosSeparation) / radians
      }
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
        targetRaDeg,
        targetDecDeg,
        targetCoordinateDiffDeg,
        reason: String(error && error.message ? error.message : error),
      }
    }

    return {
      ready: true,
      identityMatches,
      selectedObject,
      cameraCentered: yawDiff != null && pitchDiff != null && yawDiff <= expectedIdentity.cameraToleranceRad && pitchDiff <= expectedIdentity.cameraToleranceRad,
      targetCoordinatesMatch: targetCoordinateDiffDeg == null || targetCoordinateDiffDeg <= expectedIdentity.coordinateToleranceDeg,
      targetRaDeg,
      targetDecDeg,
      targetCoordinateDiffDeg,
      yawDiff,
      pitchDiff,
    }
  }, Object.assign({}, identity, { cameraToleranceRad }))
}

async function validateRuntimeTargetState(page, testCase) {
  const deadline = Date.now() + timeoutMs
  let lastState = null
  const routeUrl = new URL(testCase.path, baseUrl)
  const expectedRaParam = routeUrl.searchParams.get('ra')
  const expectedDecParam = routeUrl.searchParams.get('dec')
  const expectedRaDeg = expectedRaParam == null ? NaN : Number(expectedRaParam)
  const expectedDecDeg = expectedDecParam == null ? NaN : Number(expectedDecParam)
  const expectedIdentity = Object.assign({}, testCase.identity, {
    expectedRaDeg: !testCase.skipTargetCoordinateValidation && Number.isFinite(expectedRaDeg) ? expectedRaDeg : undefined,
    expectedDecDeg: !testCase.skipTargetCoordinateValidation && Number.isFinite(expectedDecDeg) ? expectedDecDeg : undefined,
    coordinateToleranceDeg: testCase.coordinateToleranceDeg || 0.05,
  })

  while (Date.now() < deadline) {
    lastState = await readRuntimeTargetState(page, expectedIdentity)
    if (lastState.ready && lastState.identityMatches && lastState.targetCoordinatesMatch && (testCase.skipCameraCentering || lastState.cameraCentered)) {
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
  if (!testCase.skipCameraCentering && !lastState.cameraCentered) {
    throw new Error(`${testCase.name} selected panel but camera did not center: ${JSON.stringify(lastState)}`)
  }
  if (!lastState.targetCoordinatesMatch) {
    throw new Error(`${testCase.name} selected object coordinates did not match requested link coordinates: ${JSON.stringify(lastState)}`)
  }
  if (typeof testCase.requireIndexed === 'boolean' && Boolean(lastState.selectedObject.indexed) !== testCase.requireIndexed) {
    throw new Error(`${testCase.name} indexed state mismatch: ${JSON.stringify(lastState.selectedObject)}`)
  }
  if (testCase.requiredStatus && lastState.selectedObject.status !== testCase.requiredStatus) {
    throw new Error(`${testCase.name} status mismatch: ${JSON.stringify(lastState.selectedObject)}`)
  }
  if (testCase.requireTleModelData) {
    const modelData = lastState.selectedObject.model_data
    if (!modelData || !Array.isArray(modelData.tle) || modelData.tle.length !== 2) {
      throw new Error(`${testCase.name} selected object did not preserve TLE model data: ${JSON.stringify(lastState.selectedObject)}`)
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

async function validateSearchAliasCases() {
  for (const searchCase of searchAliasCases) {
    const response = await fetch(buildApiUrl(`/api/sky/search?q=${encodeURIComponent(searchCase.query)}`))
    const body = await response.json().catch(() => ({}))
    const result = body.data && Array.isArray(body.data.results) ? body.data.results[0] : null
    if (!response.ok || body.status !== 'ok' || !result) {
      throw new Error(`${searchCase.name} search alias did not resolve: ${JSON.stringify(body)}`)
    }
    if (
      result.catalog !== searchCase.expected.catalog ||
      result.source_id !== searchCase.expected.sourceId ||
      result.model !== searchCase.expected.model
    ) {
      throw new Error(`${searchCase.name} search alias returned wrong identity: ${JSON.stringify(result)}`)
    }
    console.log(`SEARCH_PASS ${searchCase.name} source_id=${result.source_id}`)
  }
}

function assertFiniteNumber(data, key, testName) {
  if (!Number.isFinite(data[key])) {
    throw new Error(`${testName} exact lookup did not return numeric ${key}: ${JSON.stringify(data)}`)
  }
}

async function validateSolarSystemApiCases() {
  for (const testCase of solarSystemApiCases) {
    const response = await fetch(buildApiUrl(buildSolarSystemApiPath(testCase)))
    const body = await response.json().catch(() => ({}))
    if (!response.ok || body.status !== 'ok' || !body.data) {
      throw new Error(`${testCase.name} exact solar-system lookup failed: ${JSON.stringify(body)}`)
    }

    const data = body.data
    if (data.catalog !== 'Solar System (JPL)' || data.source_id !== testCase.sourceId || data.model !== testCase.model) {
      throw new Error(`${testCase.name} exact lookup returned wrong identity: ${JSON.stringify(data)}`)
    }
    for (const key of ['ra', 'dec', 'alt', 'az']) {
      assertFiniteNumber(data, key, testCase.name)
    }
    if (data.ra < 0 || data.ra >= 360 || data.dec < -90 || data.dec > 90 || data.alt < -90 || data.alt > 90 || data.az < 0 || data.az >= 360) {
      throw new Error(`${testCase.name} exact lookup returned invalid coordinates: ${JSON.stringify(data)}`)
    }
    if (!data.sky_engine_url || !data.sky_engine_url.includes(`source_id=${encodeURIComponent(testCase.sourceId)}`) || !data.sky_engine_url.includes(`model=${encodeURIComponent(testCase.model)}`)) {
      throw new Error(`${testCase.name} exact lookup did not include a stable Sky Engine URL: ${JSON.stringify(data)}`)
    }
    console.log(`API_PASS ${testCase.name} alt=${data.alt} az=${data.az}`)
  }
}

async function validateSatelliteApiCases() {
  const runtimeCases = []
  for (const testCase of satelliteApiCases) {
    const query = new URLSearchParams({
      catalog: 'Satellite TLE (local)',
      source_id: testCase.sourceId,
      model: testCase.model,
      lat: '41.44',
      lng: '-79.69',
      time: '2026-06-04T02:16:04Z',
      elev: '0',
    })
    const response = await fetch(buildApiUrl(`/api/sky/object?${query.toString()}`))
    const body = await response.json().catch(() => ({}))
    if (!response.ok || body.status !== 'ok' || !body.data) {
      throw new Error(`${testCase.name} exact satellite lookup failed: ${JSON.stringify(body)}`)
    }

    const data = body.data
    if (data.catalog !== 'Satellite TLE (local)' || data.source_id !== testCase.sourceId || data.model !== testCase.model) {
      throw new Error(`${testCase.name} exact lookup returned wrong identity: ${JSON.stringify(data)}`)
    }
    if (!data.model_data || !Array.isArray(data.model_data.tle) || data.model_data.tle.length !== 2) {
      throw new Error(`${testCase.name} exact lookup did not preserve TLE model data: ${JSON.stringify(data)}`)
    }
    for (const key of ['ra', 'dec', 'alt', 'az']) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        throw new Error(`${testCase.name} exact lookup fabricated ${key}: ${JSON.stringify(data)}`)
      }
    }
    if (data.link_status !== 'exact_link_ready' || data.visibility_status !== 'propagation_pending') {
      throw new Error(`${testCase.name} exact lookup returned wrong link status: ${JSON.stringify(data)}`)
    }
    runtimeCases.push({
      name: testCase.name,
      path: data.sky_engine_url,
      identity: { catalog: data.catalog, sourceId: data.source_id, model: data.model },
      requiredText: [data.display_name, `NORAD ${data.source_id}`, 'LAT 41.440', 'FOV 1.00'],
      forbiddenText: ['Unknown Type'],
      requireIndexed: true,
      requireTleModelData: true,
      skipCameraCentering: true,
    })
    console.log(`API_PASS ${testCase.name} norad=${data.norad_id}`)
  }
  return runtimeCases
}

function assertAboveMeSatelliteCandidate(candidate) {
  if (candidate.catalog !== 'Satellite TLE (local)' || candidate.model !== 'tle_satellite') {
    throw new Error(`Above-me satellite returned wrong identity: ${JSON.stringify(candidate)}`)
  }
  if (typeof candidate.source_id !== 'string' || candidate.source_id !== candidate.norad_id) {
    throw new Error(`Above-me satellite did not preserve string NORAD identity: ${JSON.stringify(candidate)}`)
  }
  for (const key of ['ra', 'dec', 'alt', 'az', 'range_km']) {
    if (!Number.isFinite(candidate[key])) {
      throw new Error(`Above-me satellite did not return finite ${key}: ${JSON.stringify(candidate)}`)
    }
  }
  if (candidate.alt <= 0 || candidate.is_visible !== true) {
    throw new Error(`Above-me satellite was not above horizon: ${JSON.stringify(candidate)}`)
  }
  if (!candidate.sky_engine_url || !candidate.sky_engine_url.includes(`source_id=${encodeURIComponent(candidate.source_id)}`)) {
    throw new Error(`Above-me satellite did not return stable Sky Engine URL: ${JSON.stringify(candidate)}`)
  }
}

async function buildVisibleSatelliteRuntimeCase() {
  const query = new URLSearchParams({
    lat: solarSystemLocation.lat,
    lng: solarSystemLocation.lng,
    elev: solarSystemLocation.elev,
    time: visibleSatelliteTestTime,
    limit: '100',
  })
  const response = await fetch(buildApiUrl(`/api/above-me?${query.toString()}`))
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.status !== 'ok' || !body.data || !Array.isArray(body.data.objects)) {
    throw new Error(`Above-me visible satellite lookup failed: ${JSON.stringify(body)}`)
  }

  const candidate = body.data.objects.find((item) => item.model === 'tle_satellite')
  if (!candidate) {
    throw new Error(`Above-me did not return a visible satellite for ${visibleSatelliteTestTime}: ${JSON.stringify(body)}`)
  }
  assertAboveMeSatelliteCandidate(candidate)
  console.log(`API_PASS visible satellite ${candidate.name} norad=${candidate.source_id} alt=${candidate.alt} az=${candidate.az}`)

  return {
    name: `Visible satellite ${candidate.name}`,
    path: candidate.sky_engine_url,
    identity: { catalog: candidate.catalog, sourceId: candidate.source_id, model: candidate.model },
    requiredText: [candidate.name, 'LAT 41.440', 'FOV 1.00'],
    forbiddenText: ['Unknown Type'],
    requireIndexed: true,
    requireTleModelData: true,
    skipTargetCoordinateValidation: true,
  }
}

async function main() {
  await validateSolarSystemApiCases()
  const exactSatelliteCases = await validateSatelliteApiCases()
  await validateSearchAliasCases()
  const visibleSatelliteCase = await buildVisibleSatelliteRuntimeCase()

  const browser = await chromium.launch({ headless: true })
  try {
    for (const testCase of [...cases, ...exactSatelliteCases, visibleSatelliteCase]) {
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
