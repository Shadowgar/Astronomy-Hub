#!/usr/bin/env node
const fs = require('fs');
const { chromium } = require('playwright');

const TARGETS = ['Polaris', 'Vega', 'Izar', 'Procyon'];
const RUNS = [
  { name: 'official', url: 'https://stellarium-web.org', profile: '.playwright-profiles/star-targets-official' },
  { name: 'local', url: 'http://127.0.0.1:4173/sky-engine', profile: '.playwright-profiles/star-targets-local' },
];

function isStarUrl(u) {
  const s = u.toLowerCase();
  return s.includes('/stars/') || s.includes('/surveys/gaia/') || s.includes('gaia') || s.includes('hip') || s.includes('tyc') || s.includes('tycho') || s.includes('sao');
}

async function runOne(run) {
  const out = {};
  const ctx = await chromium.launchPersistentContext(run.profile, { headless: true, viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(run.url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(6000);
  for (const target of TARGETS) {
    const seen = [];
    const handler = (resp) => {
      try {
        const url = resp.url();
        if (isStarUrl(url)) seen.push({ url: url.split('?')[0], status: resp.status() });
      } catch {}
    };
    page.on('response', handler);
    try {
      await page.keyboard.press('Control+f');
      await page.waitForTimeout(250);
      await page.keyboard.type(target, { delay: 30 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2500);
      await page.keyboard.press('Escape');
    } catch {}

    for (let i = 0; i < 50; i++) {
      await page.mouse.wheel(0, -1200);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(4000);
    await page.mouse.down();
    await page.mouse.move(1300, 600, { steps: 20 });
    await page.mouse.move(700, 420, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(2000);

    page.off('response', handler);
    const uniq = new Map();
    for (const r of seen) if (!uniq.has(r.url)) uniq.set(r.url, r.status);
    const statuses = [...uniq.values()];
    out[target] = {
      star_requests_total: seen.length,
      star_urls_unique: uniq.size,
      star_urls_2xx: statuses.filter((v) => v >= 200 && v < 300).length,
      star_urls_403: statuses.filter((v) => v === 403).length,
      sample_urls: [...uniq.keys()].slice(0, 12),
    };
  }
  await ctx.close();
  return out;
}

(async () => {
  const result = { generated_at: new Date().toISOString(), targets: TARGETS, runs: {} };
  for (const run of RUNS) result.runs[run.name] = await runOne(run);
  fs.writeFileSync('study/web/star_target_comparison.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ out: 'study/web/star_target_comparison.json' }));
})();
