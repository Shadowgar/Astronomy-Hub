#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 ? (process.argv[i + 1] || '') : fallback;
}

function readUrls(file) {
  const p = path.resolve(file);
  const text = fs.readFileSync(p, 'utf8');
  if (p.endsWith('.jsonl')) {
    const out = [];
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim();
      if (!s) continue;
      try {
        const row = JSON.parse(s);
        if (typeof row === 'string' && row.startsWith('http')) out.push(row);
        if (row && typeof row.url === 'string' && row.url.startsWith('http')) out.push(row.url);
      } catch {}
    }
    return Array.from(new Set(out));
  }
  if (p.endsWith('.json')) {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : (Array.isArray(data.urls) ? data.urls : []);
    return Array.from(new Set(arr.filter((u) => typeof u === 'string' && u.startsWith('http'))));
  }
  return Array.from(new Set(text.split(/\r?\n/).map((x) => x.trim()).filter((x) => x.startsWith('http'))));
}

function extFor(url, contentType = '') {
  const clean = url.split('?')[0].toLowerCase();
  const known = ['.eph','.json','.dat','.bin','.webp','.jpg','.jpeg','.png','.wasm','.js','.css','.ktx','.ktx2','.fits','.gz','.br'];
  for (const k of known) if (clean.endsWith(k)) return k;
  if (contentType.includes('json')) return '.json';
  if (contentType.includes('jpeg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  return '.bin';
}

(async () => {
  const urlsFile = arg('--urls');
  if (!urlsFile) throw new Error('missing --urls <file>');

  const outRoot = path.resolve(arg('--out', 'captured_assets/browser_parallel'));
  const profileDir = path.resolve(arg('--profile', '.playwright-profiles/browser-parallel'));
  const target = arg('--target', 'https://stellarium-web.org');
  const concurrency = Math.max(1, Number(arg('--concurrency', '64')) || 64);

  const urls = readUrls(urlsFile);
  if (!urls.length) throw new Error('no URLs loaded');

  fs.mkdirSync(outRoot, { recursive: true });
  const bodiesDir = path.join(outRoot, 'bodies');
  fs.mkdirSync(bodiesDir, { recursive: true });
  const manifestPath = path.join(outRoot, 'manifest.jsonl');
  const rows = [];

  const ctx = await chromium.launchPersistentContext(profileDir, {
    headless: true,
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  const urlSet = new Set(urls);
  page.on('response', async (resp) => {
    const url = resp.url();
    if (!urlSet.has(url)) return;
    const status = resp.status();
    const headers = await resp.allHeaders();
    const ct = (headers['content-type'] || '').toLowerCase();

    let bodyPath = null;
    let sha = null;
    let size = null;
    if (status >= 200 && status < 300) {
      try {
        const buf = await resp.body();
        size = buf.length;
        const ext = extFor(url, ct);
        const name = crypto.createHash('sha256').update(url).digest('hex').slice(0, 24) + ext;
        const fp = path.join(bodiesDir, name);
        fs.writeFileSync(fp, buf);
        bodyPath = path.relative(process.cwd(), fp);
        sha = crypto.createHash('sha256').update(buf).digest('hex');
      } catch {}
    }

    rows.push({
      timestamp: new Date().toISOString(),
      url,
      status,
      method: resp.request().method(),
      mime_type: headers['content-type'] || '',
      content_encoding: headers['content-encoding'] || '',
      size,
      initiator: resp.request().resourceType(),
      body_path: bodyPath,
      body_sha256: sha,
    });
  });

  await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // Browser-driven parallel fetch queue.
  const result = await page.evaluate(async ({ urls, concurrency }) => {
    let idx = 0;
    let ok = 0;
    let err = 0;

    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= urls.length) return;
        const u = urls[i];
        try {
          const r = await fetch(u, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store' });
          if (r.ok) ok += 1;
          else err += 1;
          // Consume body to force full network transfer.
          await r.arrayBuffer();
        } catch {
          err += 1;
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return { total: urls.length, ok, err };
  }, { urls, concurrency });

  await page.waitForTimeout(2000);
  await ctx.close();

  fs.writeFileSync(manifestPath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  fs.writeFileSync(path.join(outRoot, 'run.json'), JSON.stringify({
    started_at: new Date().toISOString(),
    target,
    concurrency,
    requested_urls: urls.length,
    fetched: result,
    captured_rows: rows.length,
    manifest: manifestPath,
  }, null, 2));

  console.log(JSON.stringify({
    out_root: outRoot,
    manifest: manifestPath,
    requested_urls: urls.length,
    fetched: result,
    captured_rows: rows.length,
  }, null, 2));
})();
