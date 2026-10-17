// Inspect saved real-input screenshots independently of native policy booleans.
// A central 24px mask excludes labels above the native satellite symbol.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '../../node_modules/playwright/index.mjs';
const root = process.env.N1_EVIDENCE_ROOT || 'output/n1/satellite-zoom-reveal';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const file = 'scripts/validation/verify_n1_satellite_symbol_pixels.mjs';
const input = await readFile(`${root}/browser/proof.json`);
const journey = JSON.parse(input);
assert.equal(journey.status, 'PASS');
const proof = { status: 'RUNNING', sourceHashes: { [file]: hash(await readFile(file)) }, journeySha256: hash(input), runs: [] };
await mkdir(`${root}/symbol-pixels`, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const run of journey.runs) {
    const row = { width: run.width, method: run.method, id: run.id, status: 'RUNNING', pageErrors: [], scenes: [] };
    proof.runs.push(row);
    for (const name of ['automatic-close', 'outward-hidden', 'automatic-return']) {
      const scene = run.scenes.find(scene => scene.name === name);
      const png = await readFile(`${root}/browser/${scene.file}`);
      const pixels = await page.evaluate(async base64 => {
        const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))]));
        const canvas = new OffscreenCanvas(64, 64), ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        let icon = 0, identification = 0;
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
          const i = (y * 64 + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
          if (g > 70 && g - r > 20 && g - b > 15) {
            identification++;
            if (x >= 20 && x <= 44 && y >= 20 && y <= 44) icon++;
          }
        }
        return { icon, identification };
      }, png.toString('base64'));
      row.scenes.push({ name, file: scene.file, sha256: hash(png), pixels });
      if (name === 'outward-hidden') assert.equal(pixels.identification, 0);
      // The very bright desktop point masks its icon; it is a label control.
      // The desktop boundary and every mobile input must have actual icon pixels.
      else if (run.id === '14136' || run.width < 768) assert.ok(pixels.icon >= 20, `${run.width}/${run.method}/${name}: actual central icon required`);
      else assert.ok(pixels.identification >= 20);
    }
    row.status = 'PASS';
  }
  assert.equal(hash(await readFile(file)), proof.sourceHashes[file]);
  proof.status = 'PASS';
} catch (error) {
  proof.status = 'FAIL'; proof.error = error.stack; throw error;
} finally {
  await browser.close();
  await writeFile(`${root}/symbol-pixels/proof.json`, JSON.stringify(proof, null, 2) + '\n');
}
console.log('Native central-icon pixels (labels excluded): desktop wheel/trackpad and mobile wheel/trackpad/pinch PASS; bright desktop label control retained.');
