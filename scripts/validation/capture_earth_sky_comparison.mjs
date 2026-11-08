import { chromium } from '../../node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'output/earth-sky-completion/comparison';
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const proof = { status: 'RUNNING', baseline: '89491f72ef4f4ab9e75d1bc2e4599cd3e74ca3f2', runs: [] };
try {
  for (const [width, height] of [[1440, 900], [390, 900], [667, 390]]) {
    for (const [revision, port] of [['baseline', 4217], ['candidate', 4220]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 768, reducedMotion: 'reduce' });
      const page = await context.newPage();
      for (const mode of ['earth', 'sky']) {
        const date = mode === 'earth' ? '2026-06-05T16:00:00Z' : '2026-08-13T04:00:00Z';
        await page.goto(`http://127.0.0.1:${port}/${mode === 'earth' ? 'earth' : 'sky-engine'}?date=${date}`);
        await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({ timeout: 90000 });
        await page.waitForTimeout(10000);
        const frame = page.frames().find(f => f.url().includes(mode === 'earth' ? '/earth-runtime/' : '/oras-sky-engine/'));
        const state = await frame.evaluate(mode => mode === 'earth' ? window.orasEarthDiagnostics() : ({ navigation: window.orasSkyAdapter.navigation(), selection: window.orasSkyAdapter.snapshot().selection, exposure: window.__ORAS_STEL.core.exposure_scale, stars: window.__ORAS_STEL.core.star_linear_scale }), mode);
        const file = `${width}x${height}-${mode}-${revision}.png`;
        await page.screenshot({ path: `${out}/${file}` });
        proof.runs.push({ revision, width, height, mode, date, file, state });
        console.log(file);
        await writeFile(`${out}/proof.json`, JSON.stringify(proof, null, 2));
      }
      await context.close();
    }
  }
  proof.status = 'PASS';
} catch (error) {
  proof.status = 'FAIL'; proof.error = error.stack; process.exitCode = 1;
} finally {
  await browser.close();
  await writeFile(`${out}/proof.json`, JSON.stringify(proof, null, 2));
}
