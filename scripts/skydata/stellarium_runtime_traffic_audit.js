#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUT_DIR = path.join(ROOT, 'captured_assets');
const DEFAULT_DOC_PATH = path.join(ROOT, 'docs', 'audits', 'STELLARIUM_WEB_RUNTIME_TRAFFIC_AUDIT.md');
const DEFAULT_PROFILE_DIR = path.join(ROOT, '.playwright-profiles', 'stellarium-web');
const REQUIRED_FIELDS = ['url', 'status', 'method', 'mime_type', 'size', 'content_encoding', 'initiator', 'timestamp'];
const ALLOWED_PROFILES = new Set(['baseline', 'max_zoom_izar']);

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
      taxonomy: classify(url, mimeType),
      body_path: bodyPath,
      body_sha256: bodySha,
    });
  });

  await page.goto(options.targetUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForLoadState('networkidle', { timeout: 120000 });

  if (profile === 'baseline') {
    profileActions.push(...(await runBaselineProfile(page)));
  } else if (profile === 'max_zoom_izar') {
    profileActions.push(...(await runMaxZoomIzarProfile(page)));
  }

  await page.waitForTimeout(3000);
  const storage = await captureStorage(page);
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

  fs.writeFileSync(summaryPath, buildSummary(entries, runMeta), 'utf8');
  const primaryStorage = storageByProfile[options.profiles[0]] || {};
  writeAudit(options.auditPath, entries, primaryStorage, profileActions, runMeta);

  console.log(JSON.stringify({
    manifest: manifestPath,
    summary: summaryPath,
    taxonomy: taxonomyPath,
    storage: storagePath,
    run_meta: runMetaPath,
    audit: options.auditPath,
    requests: entries.length,
    profiles: options.profiles,
    run_id: options.runId,
  }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
