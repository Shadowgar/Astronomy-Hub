/* Nine exact identities, cold/warm latency and independent native camera proof. */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const assert = require('assert/strict')
const base = process.env.ORAS_SKY_ENGINE_BASE_URL || 'http://127.0.0.1:4173/oras-sky-engine/'
const api = process.env.ORAS_API_BASE_URL || 'http://127.0.0.1:8000'
const out = path.resolve(process.env.ORAS_STAR_ARTIFACT_DIR || 'output/playwright/star-contract-repair')
const cases = [
  ...['Sirius', 'Betelgeuse', 'Achernar', 'Vega', 'Antares'].map(name => ({ name, catalog: 'Bright Star Catalog (local)', source_id: 'star-' + name.toLowerCase() })),
  { name: 'Polaris', catalog: 'Hipparcos Tier 2 (local)', source_id: 'hip-11767' },
  { name: 'High proper motion Gaia', catalog: 'Gaia DR3', source_id: '4034171629042489088' },
  { name: 'Tycho', catalog: 'Tycho-2', source_id: '1-1015-1' },
  { name: 'Hipparcos', catalog: 'Hipparcos Tier 2 (local)', source_id: 'hip-25336' }
]

async function state(page, expected) {
  return page.evaluate(expected => {
    const vm = document.querySelector('#app')?.__vue__
    const stel = window.__ORAS_STEL
    const selection = stel?.core.selection
    const source = vm?.$store.state.selectedObject
    if (!selection || !source) return { ready: false, calls: window.__starProbe, body: document.body.innerText }
    const identity = source.catalog === expected.catalog && source.source_id === expected.source_id && source.model === 'star'
    const radec = selection.getInfo('radec')
    const position = stel.c2s(stel.convertFrame(stel.core.observer, 'ICRF', 'OBSERVED', radec))
    const wrap = x => Math.atan2(Math.sin(x), Math.cos(x))
    const yawError = Math.abs(wrap(stel.core.observer.yaw - position[0]))
    const pitchError = Math.abs(stel.core.observer.pitch - position[1])
    return { ready: true, identity, camera: yawError < 0.002 && pitchError < 0.002,
      yawError, pitchError, locked: stel.core.lock?.v === selection.v,
      source, native: selection.jsonData, radec, magnitude: selection.getInfo('vmag'),
      calls: window.__starProbe, heap: stel.HEAPU8.byteLength }
  }, expected)
}

async function instrument(context) {
  await context.addInitScript(() => {
    localStorage.setItem('orasDenseStarsProfile', 'deep-catalog')
    window.__starProbe = { nativeCandidates: [], created: [], directCalls: 0 }
    let engine
    Object.defineProperty(window, '__ORAS_STEL', { configurable: true, get: () => engine, set: value => {
      engine = value
      const getObj = value.getObj.bind(value)
      value.getObj = name => { window.__starProbe.nativeCandidates.push(name); return getObj(name) }
      const create = value.createObj.bind(value)
      value.createObj = (model, data) => { window.__starProbe.created.push({ model, id: data.source_id }); return create(model, data) }
      const wrap = value.cwrap.bind(value)
      value.cwrap = (...args) => {
        const fn = wrap(...args)
        return args[0] === 'stars_get_by_identity' ? (...values) => { window.__starProbe.directCalls++; return fn(...values) } : fn
      }
    } })
  })
}

async function run() {
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const report = { environment: { base, api, browser: browser.version(), viewport: '1280x720', clock: '2026-09-21T04:00:00Z', thresholds_ms: { cold: 5000, warm: 3000 } }, results: [] }
  try {
    for (const target of cases.filter(target => !process.env.ORAS_STAR_TARGET || target.name === process.env.ORAS_STAR_TARGET)) {
      const query = new URLSearchParams({ catalog: target.catalog, source_id: target.source_id, model: 'star' })
      const response = await fetch(api + '/api/sky/object?' + query)
      assert(response.ok, 'API status for ' + target.name)
      const payload = (await response.json()).data
      assert(payload.star_science, 'canonical star science for ' + target.name)
      const science = payload.star_science
      query.set('ra', science.ra); query.set('dec', science.dec)
      query.set('date', report.environment.clock); query.set('lat', '41.44'); query.set('lng', '-79.69')
      query.set('fov', '1.5'); query.set('denseStars', 'deep-catalog')
      const url = new URL('skysource/' + encodeURIComponent(target.name) + '?' + query, base).href
      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
      await instrument(context)
      const page = await context.newPage()
      const errors = []; page.on('pageerror', err => errors.push(err.message))
      for (const mode of ['cold', 'warm']) {
        // Reload within the same context preserves HTTP cache for warm measurement.
        const start = performance.now()
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        let result
        while (performance.now() - start < 15000) {
          result = await state(page, target)
          if (result.identity && result.camera && result.locked) break
          await page.waitForTimeout(25)
        }
        const elapsed_ms = performance.now() - start
        const row = { target, mode, elapsed_ms, ...result, errors: [...errors] }
        report.results.push(row)
        fs.writeFileSync(path.join(out, 'star-navigation.json'), JSON.stringify(report, null, 2))
        console.log(JSON.stringify({ name: target.name, mode, elapsed_ms, identity: result.identity, camera: result.camera, calls: result.calls, errors }))
        assert(result.identity, 'independent identity: ' + target.name)
        assert(result.camera && result.locked, 'independent camera lock: ' + target.name)
        assert.equal(result.source.star_science.coordinate_epoch, science.coordinate_epoch)
        assert.equal(result.native.model_data.epoch, science.coordinate_epoch, 'native decoded epoch')
        if (science.bv != null) assert(Math.abs(result.native.model_data.BVMag - science.bv) < 1e-5, 'native color')
        assert(result.calls.directCalls > 0, 'canonical tile lookup was exercised')
        assert.equal(result.calls.created.filter(x => x.model === 'star').length, 0, 'canonical star must be discovered without duplicate fallback')
        assert(Math.abs(result.magnitude - science.render_magnitude) < 1e-5, 'native photometry: ' + target.name)
        assert(elapsed_ms <= report.environment.thresholds_ms[mode], mode + ' timing: ' + target.name)
        assert.equal(errors.length, 0, 'browser exceptions')
        if (mode === 'cold') await page.screenshot({ path: path.join(out, 'selected-' + target.source_id.replace(/[^\w-]/g, '_') + '.png') })
      }
      await context.close()
    }
  } finally { await browser.close() }
  console.log('PASS ' + report.results.length + ' cold/warm identity, camera, science and latency checks')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
