#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUT_DIR = path.join(ROOT, 'captured_assets');
const DEFAULT_DOC_PATH = path.join(ROOT, 'docs', 'audits', 'STELLARIUM_WEB_RUNTIME_TRAFFIC_AUDIT.md');
const DEFAULT_PROFILE_DIR = path.join(ROOT, '.playwright-profiles', 'stellarium-web');
const REQUIRED_FIELDS = ['url', 'status', 'method', 'mime_type', 'size', 'content_encoding', 'initiator', 'timestamp', 'scenario'];
const ALLOWED_PROFILES = new Set(['baseline', 'max_zoom_izar', 'matrix', 'focused_unobserved']);
const REQUIRED_COVERAGE_FAMILIES = [
  'boot',
  'pan_zoom',
  'faint_stars',
  'star_search',
  'dso_search',
  'dss',
  'hidef',
  'milky_way',
  'planet_views',
  'moon_views',
  'sun_views',
  'skycultures',
  'landscapes',
  'time_date',
  'observer_location',
  'object_search',
];

const ALLOWED_EXT = new Set([
  '.json', '.bin', '.dat', '.wasm', '.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.ktx', '.ktx2', '.fits', '.gz', '.br',
]);

function nowIso() { return new Date().toISOString(); }
function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    profiles: ['baseline'],
    runId: `run-${Date.now()}`,
    targetUrl: 'https://stellarium-web.org',
    notes: '',
    outputRoot: DEFAULT_OUT_DIR,
    profileRoot: DEFAULT_PROFILE_DIR,
    auditPath: DEFAULT_DOC_PATH,
    headless: true,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--profiles' && args[i + 1]) out.profiles = args[++i].split(',').map((x) => x.trim()).filter(Boolean);
    else if (a === '--run-id' && args[i + 1]) out.runId = args[++i];
    else if (a === '--target-url' && args[i + 1]) out.targetUrl = args[++i];
    else if (a === '--notes' && args[i + 1]) out.notes = args[++i];
    else if (a === '--output-root' && args[i + 1]) out.outputRoot = path.resolve(args[++i]);
    else if (a === '--profile-root' && args[i + 1]) out.profileRoot = path.resolve(args[++i]);
    else if (a === '--audit-path' && args[i + 1]) out.auditPath = path.resolve(args[++i]);
    else if (a === '--headed') out.headless = false;
  }
  for (const p of out.profiles) {
    if (!ALLOWED_PROFILES.has(p)) throw new Error(`unsupported profile: ${p}`);
  }
  return out;
}

function extFor(url) {
  const clean = url.split('?')[0].toLowerCase();
  const exts = Array.from(ALLOWED_EXT).sort((a, b) => b.length - a.length);
  return exts.find((e) => clean.endsWith(e)) || '';
}
function hashName(key) { return crypto.createHash('sha256').update(key).digest('hex').slice(0, 24); }

function classify(url, ct) {
  const u = url.toLowerCase();
  const c = (ct || '').toLowerCase();
  if (u.includes('gaia') || u.includes('hip') || u.includes('hipparcos') || u.includes('bsc') || u.includes('/stars/')) return 'stars';
  if (u.includes('openngc') || u.includes('hyperleda') || u.includes('simbad') || u.includes('dso')) return 'DSO';
  if (u.includes('hips') || u.includes('dss') || u.includes('cds') || u.includes('alasky') || u.includes('survey') || u.includes('tiles')) return 'DSS / HiPS / survey imagery';
  if (u.includes('planet') || u.includes('nasa') || u.includes('jpl') || u.includes('mars') || u.includes('jupiter') || u.includes('saturn') || u.includes('moon')) return 'planet textures';
  if (u.includes('minor') || u.includes('comet') || u.includes('mpc') || u.includes('asteroid')) return 'minor planets/comets';
  if (u.includes('constellation')) return 'constellations';
  if (u.includes('landscape')) return 'landscapes';
  if (u.includes('locale') || u.includes('i18n') || u.includes('lang') || (c.includes('application/json') && u.includes('locale'))) return 'localization';
  if (u.includes('.wasm') || u.includes('.js') || u.includes('.css') || u.includes('runtime') || u.includes('bundle') || u.includes('chunk')) return 'runtime/WASM/app code';
  return 'unknown';
}

async function captureStorage(page) {
  return page.evaluate(async () => {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      ls[k] = localStorage.getItem(k);
    }
    const ss = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      ss[k] = sessionStorage.getItem(k);
    }
    const idb = (await indexedDB.databases?.()) || [];
    const dbNames = idb.map((x) => ({ name: x.name || null, version: x.version || null }));

    const cacheStorage = [];
    if ('caches' in window) {
      const names = await caches.keys();
      for (const name of names) {
        const c = await caches.open(name);
        const reqs = await c.keys();
        cacheStorage.push({ name, urls: reqs.map((r) => r.url) });
      }
    }

    const serviceWorkers = [];
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        serviceWorkers.push({
          scope: reg.scope,
          activeScriptURL: reg.active ? reg.active.scriptURL : null,
          installingScriptURL: reg.installing ? reg.installing.scriptURL : null,
          waitingScriptURL: reg.waiting ? reg.waiting.scriptURL : null,
        });
      }
    }

    return { localStorage: ls, sessionStorage: ss, indexedDB: dbNames, cacheStorage, serviceWorkers };
  });
}

async function runBaselineProfile(page) {
  const actions = [];
  const add = (x) => actions.push(x);
  await page.waitForTimeout(5000);

  await page.mouse.move(900, 500);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -900); await page.waitForTimeout(400); }
  add('zoomed in');
  for (let i = 0; i < 2; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(400); }
  add('zoomed out');

  await page.mouse.down();
  await page.mouse.move(1200, 500, { steps: 20 });
  await page.mouse.move(600, 350, { steps: 20 });
  await page.mouse.up();
  add('panned across sky');

  for (const target of ['Sirius', 'Betelgeuse', 'M31', 'M42', 'Andromeda Galaxy', 'Mars', 'Jupiter']) {
    try {
      await page.keyboard.press('Control+f');
      await page.waitForTimeout(200);
      await page.keyboard.type(target);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await page.keyboard.press('Escape');
      add(`searched/selected ${target}`);
    } catch {
      add(`search interaction failed for ${target}`);
    }
  }

  for (const label of ['Constellations', 'Deep sky objects', 'DSO', 'Surveys', 'Background', 'Landscape']) {
    try {
      const loc = page.getByText(label, { exact: false }).first();
      if (await loc.isVisible({ timeout: 1000 })) {
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(600);
        add(`toggled ${label}`);
      }
    } catch {
      add(`toggle not available: ${label}`);
    }
  }

  for (const key of ['l', 'k', 'j', '8', '6', '4', '2']) {
    try { await page.keyboard.press(key); await page.waitForTimeout(200); } catch {}
  }
  add('attempted time/location/view shortcuts');
  await page.waitForTimeout(5000);
  return actions;
}

async function withScenario(setScenario, name, fn) {
  setScenario(name);
  await fn();
}

async function runMatrixProfile(page, setScenario) {
  const actions = [];
  const add = (x) => actions.push(x);
  await withScenario(setScenario, 'boot', async () => {
    await page.waitForTimeout(5000);
  });

  await withScenario(setScenario, 'pan_zoom', async () => {
    await page.mouse.move(960, 540);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -900);
      await page.waitForTimeout(300);
    }
    await page.mouse.down();
    await page.mouse.move(1300, 620, { steps: 20 });
    await page.mouse.move(650, 350, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(1000);
  });
  add('panned and zoomed');

  await withScenario(setScenario, 'faint_stars', async () => {
    await page.mouse.move(960, 540);
    for (let i = 0; i < 35; i++) {
      await page.mouse.wheel(0, -1200);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(5000);
  });
  add('requested faint-star depth');

  for (const [scenario, target] of [
    ['star_search', 'Sirius'],
    ['dso_search', 'M31'],
    ['planet_views', 'Jupiter'],
    ['moon_views', 'Moon'],
    ['sun_views', 'Sun'],
    ['object_search', 'ISS'],
  ]) {
    await withScenario(setScenario, scenario, async () => {
      try {
        await page.keyboard.press('Control+f');
        await page.waitForTimeout(250);
        await page.keyboard.type(target);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2200);
        await page.keyboard.press('Escape');
      } catch {}
    });
    add(`searched ${target}`);
  }

  await withScenario(setScenario, 'dss', async () => {
    try { await page.keyboard.press('d'); } catch {}
    await page.waitForTimeout(2500);
  });
  add('attempted DSS toggle');

  await withScenario(setScenario, 'hidef', async () => {
    await page.waitForTimeout(1800);
  });
  add('reserved HiDEF observation window');

  await withScenario(setScenario, 'milky_way', async () => {
    try { await page.keyboard.press('m'); } catch {}
    await page.waitForTimeout(1800);
  });
  add('attempted Milky Way toggle');

  await withScenario(setScenario, 'skycultures', async () => {
    try { await page.keyboard.press('c'); } catch {}
    await page.waitForTimeout(1500);
  });
  add('attempted skyculture-affecting control');

  await withScenario(setScenario, 'landscapes', async () => {
    try { await page.keyboard.press('g'); } catch {}
    await page.waitForTimeout(1500);
  });
  add('attempted landscape toggle');

  await withScenario(setScenario, 'time_date', async () => {
    for (const key of ['j', 'k', 'l']) {
      try { await page.keyboard.press(key); } catch {}
      await page.waitForTimeout(350);
    }
  });
  add('attempted time/date shortcuts');

  await withScenario(setScenario, 'observer_location', async () => {
    for (const key of ['8', '6', '4', '2']) {
      try { await page.keyboard.press(key); } catch {}
      await page.waitForTimeout(250);
    }
  });
  add('attempted observer-location shortcuts');

  setScenario('idle');
  await page.waitForTimeout(3000);
  return actions;
}

async function runMaxZoomIzarProfile(page) {
  const actions = [];
  const add = (x) => actions.push(x);
  await page.waitForTimeout(3000);
  try {
    await page.keyboard.press('Control+f');
    await page.waitForTimeout(200);
    await page.keyboard.type('Izar');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape');
    add('searched/selected Izar');
  } catch {
    add('search interaction failed for Izar');
  }

  await page.mouse.move(960, 540);
  for (let i = 0; i < 85; i++) {
    await page.mouse.wheel(0, -1200);
    await page.waitForTimeout(120);
  }
  add('max zoom wheel pass');

  for (let i = 0; i < 80; i++) {
    try { await page.keyboard.press('Equal'); } catch {}
    await page.waitForTimeout(40);
  }
  add('max zoom key pass');

  await page.mouse.down();
  await page.mouse.move(1300, 600, { steps: 30 });
  await page.mouse.move(700, 420, { steps: 30 });
  await page.mouse.up();
  add('high-zoom pan sweep');

  await page.waitForTimeout(12000);
  add('high-zoom dwell complete');
  return actions;
}

async function runFocusedUnobservedProfile(page, setScenario, targetUrl) {
  const actions = [];
  const add = (x) => actions.push(x);
  const baseUrl = targetUrl.endsWith('/') ? targetUrl : `${targetUrl}/`;
  const gotoFocusedRoute = async (url) => {
    await page.goto(url, {
      waitUntil: 'commit',
      timeout: 30000,
    });
  };

  await withScenario(setScenario, 'time_date', async () => {
    await gotoFocusedRoute(`${baseUrl}?date=2025-01-15T03:00:00Z&lat=40.71&lng=-74.01&elev=10`);
    await page.waitForTimeout(6000);
  });
  add('loaded explicit date/location URL');

  for (const [scenario, objectName] of [
    ['moon_views', 'NAME%20Moon'],
    ['sun_views', 'NAME%20Sun'],
  ]) {
    await withScenario(setScenario, scenario, async () => {
      await gotoFocusedRoute(`${baseUrl}skysource/${objectName}?fov=0.05&date=2025-01-15T03:00:00Z&lat=40.71&lng=-74.01&elev=10`);
      await page.waitForTimeout(9000);
    });
    add(`loaded ${objectName} focused route`);
  }

  await withScenario(setScenario, 'planet_views', async () => {
    await gotoFocusedRoute(`${baseUrl}skysource/NAME%20Jupiter?fov=0.05&date=2025-01-15T03:00:00Z&lat=40.71&lng=-74.01&elev=10`);
    await page.waitForTimeout(9000);
  });
  add('loaded Jupiter focused route');

  await withScenario(setScenario, 'object_search', async () => {
    await gotoFocusedRoute(`${baseUrl}skysource/NAME%20Moon?fov=5&date=2025-01-15T03:00:00Z&lat=40.71&lng=-74.01&elev=10`);
    await page.waitForTimeout(5000);
  });
  add('loaded object lookup route');

  setScenario('idle');
  await page.waitForTimeout(2000);
  return actions;
}

function observedFamilies(entries) {
  const out = {};
  for (const e of entries) {
    try {
      const u = new URL(e.url);
      const parts = u.pathname.split('/').slice(0, 4).join('/') || '/';
      if (!out[u.host]) out[u.host] = new Set();
      out[u.host].add(parts);
    } catch {}
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Array.from(v).sort()]));
}

function validateEntries(entries) {
  if (!entries.length) throw new Error('manifest validation failed: empty capture');
  for (const [idx, row] of entries.entries()) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in row)) throw new Error(`manifest validation failed: missing field ${field} at row ${idx}`);
      if ((row[field] === null || row[field] === '') && field !== 'size' && field !== 'content_encoding' && field !== 'mime_type') {
        throw new Error(`manifest validation failed: empty field ${field} at row ${idx}`);
      }
    }
  }
}

function buildSummary(entries, runMeta) {
  const total = entries.length;
  const ok = entries.filter((e) => e.status >= 200 && e.status < 300).length;
  const forbidden = entries.filter((e) => e.status === 403).length;
  const byTax = {};
  for (const e of entries) byTax[e.taxonomy] = (byTax[e.taxonomy] || 0) + 1;

  const lines = [
    '# Stellarium Web Runtime Capture Summary',
    '',
    `- Run ID: ${runMeta.run_id}`,
    `- Profiles: ${runMeta.profiles.join(', ')}`,
    `- Started: ${runMeta.started_at}`,
    `- Ended: ${runMeta.ended_at}`,
    `- Captured requests: ${total}`,
    `- Successful responses (2xx): ${ok}`,
    `- 403 responses: ${forbidden}`,
    '',
    '## Taxonomy counts',
    '',
  ];
  for (const [k, v] of Object.entries(byTax).sort((a, b) => a[0].localeCompare(b[0]))) lines.push(`- ${k}: ${v}`);
  lines.push('');
  return lines.join('\n');
}

function buildCoverageLedger(entries, profileActions) {
  const byScenario = {};
  for (const family of REQUIRED_COVERAGE_FAMILIES) {
    byScenario[family] = {
      attempted: false,
      request_count: 0,
      successful_response_count: 0,
      observed_live: false,
      notes: [],
    };
  }
  for (const [profile, actions] of Object.entries(profileActions)) {
    if (profile !== 'matrix' && profile !== 'focused_unobserved') continue;
    for (const action of actions) {
      if (action.includes('panned and zoomed')) byScenario.pan_zoom.attempted = true;
      if (action.includes('faint-star')) byScenario.faint_stars.attempted = true;
      if (action.includes('Sirius')) byScenario.star_search.attempted = true;
      if (action.includes('M31')) byScenario.dso_search.attempted = true;
      if (action.includes('Jupiter')) byScenario.planet_views.attempted = true;
      if (action.includes('Moon')) byScenario.moon_views.attempted = true;
      if (action.includes('Sun')) byScenario.sun_views.attempted = true;
      if (action.includes('ISS')) byScenario.object_search.attempted = true;
      if (action.includes('DSS')) byScenario.dss.attempted = true;
      if (action.includes('HiDEF')) byScenario.hidef.attempted = true;
      if (action.includes('Milky Way')) byScenario.milky_way.attempted = true;
      if (action.includes('skyculture')) byScenario.skycultures.attempted = true;
      if (action.includes('landscape')) byScenario.landscapes.attempted = true;
      if (action.includes('time/date')) byScenario.time_date.attempted = true;
      if (action.includes('observer-location')) byScenario.observer_location.attempted = true;
    }
  }
  byScenario.boot.attempted = true;
  for (const entry of entries) {
    if (!byScenario[entry.scenario]) continue;
    byScenario[entry.scenario].request_count += 1;
    if (entry.status >= 200 && entry.status < 300) {
      byScenario[entry.scenario].successful_response_count += 1;
      byScenario[entry.scenario].observed_live = true;
    }
  }
  for (const [name, row] of Object.entries(byScenario)) {
    if (row.attempted && !row.observed_live) row.notes.push('scenario attempted but no scenario-scoped response observed');
    if (!row.attempted) row.notes.push('scenario not attempted by capture script');
    if (name === 'hidef') row.notes.push('no dedicated UI automation path identified in checked-out frontend source');
  }
  return byScenario;
}

function writeAudit(auditPath, entries, storage, profileActions, runMeta) {
  const byTax = {};
  const status = {};
  for (const e of entries) {
    byTax[e.taxonomy] = (byTax[e.taxonomy] || 0) + 1;
    status[e.status] = (status[e.status] || 0) + 1;
  }
  const families = observedFamilies(entries);
  const lines = [
    '# STELLARIUM WEB RUNTIME TRAFFIC AUDIT',
    '',
    `- Generated: ${nowIso()}`,
    `- Run ID: ${runMeta.run_id}`,
    `- Profiles: ${runMeta.profiles.join(', ')}`,
    `- Target URL: ${runMeta.target_url}`,
    '- Tool mode: Real Playwright Chromium persistent profile capture',
    '- Scope: Only browser-observed requests/responses during normal interaction flow',
    '',
    '## Interaction Coverage',
    '',
  ];

  for (const [profile, actions] of Object.entries(profileActions)) {
    lines.push(`- ${profile}:`);
    for (const a of actions) lines.push(`  - ${a}`);
  }

  lines.push('', '## Observed URL Families', '');
  for (const [host, fams] of Object.entries(families)) {
    lines.push(`- \`${host}\``);
    fams.slice(0, 30).forEach((f) => lines.push(`  - \`${f}\``));
  }

  lines.push('', '## Taxonomy', '');
  for (const [k, v] of Object.entries(byTax).sort((a, b) => a[0].localeCompare(b[0]))) lines.push(`- ${k}: ${v}`);

  lines.push('', '## Status Breakdown', '');
  for (const [k, v] of Object.entries(status).sort((a, b) => Number(a[0]) - Number(b[0]))) lines.push(`- ${k}: ${v}`);

  lines.push('', '## Browser Storage Metadata', '');
  lines.push(`- localStorage keys: ${Object.keys(storage.localStorage || {}).length}`);
  lines.push(`- sessionStorage keys: ${Object.keys(storage.sessionStorage || {}).length}`);
  lines.push(`- IndexedDB databases: ${(storage.indexedDB || []).length}`);
  lines.push(`- CacheStorage buckets: ${(storage.cacheStorage || []).length}`);
  lines.push(`- Service worker registrations: ${(storage.serviceWorkers || []).length}`);

  lines.push('', '## Coverage Statement', '');
  lines.push('- This is observed-session coverage only; it is not complete global coverage of all Stellarium Web assets.');

  fs.mkdirSync(path.dirname(auditPath), { recursive: true });
  fs.writeFileSync(auditPath, `${lines.join('\n')}\n`, 'utf8');
}

async function runProfile(profile, options, entries, bodiesDir) {
  const profileActions = [];
  let currentScenario = profile === 'matrix' ? 'boot' : profile;
  const profileDir = path.join(options.profileRoot, profile);
  fs.mkdirSync(profileDir, { recursive: true });
  const browserContext = await chromium.launchPersistentContext(profileDir, {
    headless: options.headless,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  const page = await browserContext.newPage();

  page.on('response', async (resp) => {
    const req = resp.request();
    const url = resp.url();
    const status = resp.status();
    const headers = await resp.allHeaders();
    const normalized = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    const mimeType = normalized['content-type'] || '';
    const ext = extFor(url);

    let bodyPath = null;
    let bodySha = null;
    let bodyBuffer = null;
    if (status >= 200 && status < 300 && ext) {
      try {
        bodyBuffer = await resp.body();
        if (bodyBuffer && bodyBuffer.length > 0) {
          const name = `${hashName(`${profile}:${url}`)}${ext}`;
          const filePath = path.join(bodiesDir, name);
          fs.writeFileSync(filePath, bodyBuffer);
          bodyPath = path.relative(ROOT, filePath);
          bodySha = crypto.createHash('sha256').update(bodyBuffer).digest('hex');
        }
      } catch {}
    }

    const contentLength = normalized['content-length'] && /^\\d+$/.test(normalized['content-length'])
      ? Number(normalized['content-length'])
      : (bodyBuffer ? bodyBuffer.length : null);

    entries.push({
      run_id: options.runId,
      profile,
      target_url: options.targetUrl,
      notes: options.notes,
      timestamp: nowIso(),
      url,
      status,
      method: req.method(),
      mime_type: mimeType,
      size: contentLength,
      cache_control: normalized['cache-control'] || null,
      etag: normalized.etag || null,
      last_modified: normalized['last-modified'] || null,
      content_encoding: normalized['content-encoding'] || null,
      initiator: req.resourceType(),
      scenario: currentScenario,
      taxonomy: classify(url, mimeType),
      body_path: bodyPath,
      body_sha256: bodySha,
    });
  });

  await page.goto(options.targetUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  // Stellarium Web keeps long-lived background traffic active; a bounded settle
  // window is more reliable than waiting for networkidle indefinitely.
  await page.waitForTimeout(6000);

  if (profile === 'baseline') {
    profileActions.push(...(await runBaselineProfile(page)));
  } else if (profile === 'max_zoom_izar') {
    profileActions.push(...(await runMaxZoomIzarProfile(page)));
  } else if (profile === 'matrix') {
    profileActions.push(...(await runMatrixProfile(page, (name) => { currentScenario = name; })));
  } else if (profile === 'focused_unobserved') {
    profileActions.push(...(await runFocusedUnobservedProfile(page, (name) => { currentScenario = name; }, options.targetUrl)));
  }

  await page.waitForTimeout(3000);
  let storage;
  try {
    storage = await captureStorage(page);
  } catch (error) {
    storage = {
      localStorage: {},
      sessionStorage: {},
      indexedDB: [],
      cacheStorage: [],
      serviceWorkers: [],
      capture_error: String(error && error.message ? error.message : error),
    };
  }
  await browserContext.close();
  return { actions: profileActions, storage };
}

(async () => {
  const options = parseArgs();
  const outDir = options.outputRoot;
  const bodiesDir = path.join(outDir, 'bodies');
  const manifestPath = path.join(outDir, 'manifest.jsonl');
  const summaryPath = path.join(outDir, 'manifest_summary.md');
  const taxonomyPath = path.join(outDir, 'asset_taxonomy.json');
  const storagePath = path.join(outDir, 'browser_storage_metadata.json');
  const runMetaPath = path.join(outDir, 'capture_run.json');
  const coveragePath = path.join(outDir, 'coverage_ledger.json');

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(bodiesDir, { recursive: true });

  const startedAt = nowIso();
  const entries = [];
  const profileActions = {};
  const storageByProfile = {};

  for (const profile of options.profiles) {
    const { actions, storage } = await runProfile(profile, options, entries, bodiesDir);
    profileActions[profile] = actions;
    storageByProfile[profile] = storage;
  }

  validateEntries(entries);

  fs.writeFileSync(manifestPath, `${entries.map((e) => JSON.stringify(e)).join('\n')}\n`, 'utf8');

  const taxonomy = {};
  for (const e of entries) {
    if (!taxonomy[e.taxonomy]) taxonomy[e.taxonomy] = new Set();
    taxonomy[e.taxonomy].add(e.url);
  }
  const normalizedTax = Object.fromEntries(Object.entries(taxonomy).map(([k, v]) => [k, Array.from(v).sort()]));
  fs.writeFileSync(taxonomyPath, JSON.stringify(normalizedTax, null, 2), 'utf8');

  const endedAt = nowIso();
  const runMeta = {
    run_id: options.runId,
    profiles: options.profiles,
    started_at: startedAt,
    ended_at: endedAt,
    target_url: options.targetUrl,
    notes: options.notes,
    output_root: outDir,
  };
  fs.writeFileSync(runMetaPath, JSON.stringify(runMeta, null, 2), 'utf8');
  fs.writeFileSync(storagePath, JSON.stringify(storageByProfile, null, 2), 'utf8');
  fs.writeFileSync(coveragePath, JSON.stringify(buildCoverageLedger(entries, profileActions), null, 2), 'utf8');

  fs.writeFileSync(summaryPath, buildSummary(entries, runMeta), 'utf8');
  const primaryStorage = storageByProfile[options.profiles[0]] || {};
  writeAudit(options.auditPath, entries, primaryStorage, profileActions, runMeta);

  console.log(JSON.stringify({
    manifest: manifestPath,
    summary: summaryPath,
    taxonomy: taxonomyPath,
    storage: storagePath,
    run_meta: runMetaPath,
    coverage: coveragePath,
    audit: options.auditPath,
    requests: entries.length,
    profiles: options.profiles,
    run_id: options.runId,
  }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
