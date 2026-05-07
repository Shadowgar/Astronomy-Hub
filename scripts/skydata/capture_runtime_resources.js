#!/usr/bin/env node
const fs = require('fs');
const { chromium } = require('playwright');

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? (process.argv[idx + 1] || '') : fallback;
}

(async () => {
  const target = arg('--target', 'Capella');
  const fov = arg('--fov', '0.8');
  const localBase = arg('--local-base', 'http://127.0.0.1:4173');
  const officialBase = arg('--official-base', 'https://stellarium-web.org');
  const out = arg('--out', `data/runtime-packs/resource-capture-${Date.now()}.json`);
  const browser = await chromium.launch({ headless: true });

  const captures = [];
  for (const [label, base] of [['local', localBase], ['official', officialBase]]) {
    const page = await browser.newPage();
    const events = [];
    page.on('response', (resp) => {
      const url = resp.url();
      events.push({ url, status: resp.status() });
    });
    const url = `${base}/oras-sky-engine/skysource/${encodeURIComponent(target)}?fov=${encodeURIComponent(fov)}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (err) {
      events.push({ url, status: 0, error: String(err) });
    }
    await page.waitForTimeout(10000);
    captures.push({ label, target, fov, url, events });
    await page.close();
  }

  await browser.close();
  fs.mkdirSync(require('path').dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(captures, null, 2));
  console.log(JSON.stringify({ out, captures: captures.length }, null, 2));
})();
