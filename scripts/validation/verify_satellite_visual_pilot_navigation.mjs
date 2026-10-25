// Focused final-UI/source/remount qualification; original N1 campaign is not repeated.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:4227', out = 'output/satellite-visual-pilot/navigation', epoch = '2026-10-25T10:22:00.000Z';
await mkdir(out, { recursive: true });
const hash = b => createHash('sha256').update(b).digest('hex');
const sourceFiles = ['frontend/src/features/workspace/satelliteTimeStatus.ts', 'frontend/src/features/workspace/AboutLicenses.tsx', 'backend/app/services/sky_catalog_service.py', 'backend/app/services/satellite_feed_status_service.py', 'scripts/skydata/build_visual_satellite_pilot.py'];
const sourceHashes = () => Promise.all(sourceFiles.map(async (p) => [p, hash(await readFile(p))])).then(Object.fromEntries);
const expected = JSON.parse(await readFile('output/satellite-visual-pilot/release/manifest.json'));
const target = gunzipSync(gunzipSync(await readFile('output/satellite-visual-pilot/release/tle_satellite.jsonl.gz'))).toString().trim().split('\n').map(JSON.parse).find(r => r.model_data.norad_number === 61045);
const proof = { status: 'RUNNING', started: new Date().toISOString(), source_sha256: await sourceHashes(), runs: [], limits: ['Native point/pixel motion proof is retained separately at identical feed and native artifact bytes. The final UI adds source citation text only.', 'Viewport/touch emulation and software rendering do not qualify physical devices.', 'DOM frame detachment and single active surface do not prove driver allocation reclamation.'] };
const browser = await chromium.launch();
try {
    for (const [width, height] of [[1440, 900], [390, 900], [667, 390]]) {
        const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 768, reducedMotion: 'reduce' }), page = await ctx.newPage();
        page.setDefaultTimeout(15000);
        const run = { width, height, steps: [], pageErrors: [], warnings: [], requests: [] };
        proof.runs.push(run);
        page.on('pageerror', e => run.pageErrors.push(e.message));
        page.on('console', m => { if (['warning', 'error'].includes(m.type()))
            run.warnings.push({ type: m.type(), text: m.text() }); });
        page.on('requestfailed', r => run.requests.push({ url: r.url(), failure: r.failure() }));
        page.on('response', r => { if (r.status() >= 400)
            run.requests.push({ url: r.url(), status: r.status() }); });
        const heavy = () => page.frames().filter(f => /\/(oras-sky-engine|earth-runtime|planet-runtime)\//.test(f.url()));
        const sky = () => page.frames().find(f => f.url().includes('/oras-sky-engine/'));
        async function ready(mode) { await page.locator(['sky', 'earth'].includes(mode) ? '[data-runtime-mode=' + mode + '][data-runtime-status=ready]' : '[data-solar-status=ready]').waitFor({ timeout: 45000 }); if (mode === 'sky')
            await sky().waitForFunction(() => { const o = window.__ORAS_STEL?.getObj('NORAD 61045'); if (!o)
                return false; o.destroy(); return true; }, null, { timeout: 15000 }); }
        async function choose(name) { await page.getByRole('button', { name: 'Choose exploration mode', exact: true }).click(); await page.locator('.cin-mode-options').getByRole('button', { name, exact: true }).click(); }
        async function record(name, previous = []) {
            const mode = await page.locator('[data-workspace-mode]').getAttribute('data-workspace-mode'), frames = heavy(), canvas = await page.locator('.solar-canvas canvas,.system-canvas canvas').count();
            assert.equal(frames.length + canvas, 1);
            assert.ok(previous.every(f => f.isDetached()));
            const row = { name, mode, url: page.url(), heavyFrames: frames.length, canvasCount: canvas, detached: previous.length };
            if (mode === 'sky') {
                row.native = await sky().evaluate(() => { const a = window.orasSkyAdapter, s = window.__ORAS_STEL, o = s.getObj('NORAD 61045'); try {
                    return { ...a.navigation(), speed: s.core.time_speed, tle: o.jsonData.model_data.tle };
                }
                finally {
                    o.destroy();
                } });
                assert.equal(row.native.utc, epoch);
                assert.equal(row.native.speed, 0);
                assert.deepEqual(row.native.tle, target.model_data.tle);
                row.feed = await (await page.request.get(base + '/api/sky/satellite-feed')).json();
                assert.equal(row.feed.data.sha256, expected.sha256);
                assert.equal(row.feed.data.fresh_record_count, 155);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            run.steps.push(row);
            console.log(width, height, name, 'PASS');
            await writeFile(out + '/proof.json', JSON.stringify(proof, null, 2));
        }
        try {
            await page.goto(base + '/sky-engine?date=' + encodeURIComponent(epoch));
            await ready('sky');
            await record('initial-sky');
            await page.getByRole('group', { name: 'Scene time', exact: true }).getByRole('button', { name: 'Change time' }).click();
            const detail = page.locator('.ws-satellite-time-details');
            await detail.waitFor();
            const text = await detail.innerText();
            assert.ok(text.includes('155 objects') && text.includes('not the full catalog') && text.includes('USSPACECOM / 18 SDS') && text.includes('caelo-works/tle-mirror'));
            run.sourceDetails = text;
            await page.screenshot({ path: out + '/' + width + 'x' + height + '-source-details.png' });
            await page.getByRole('button', { name: width < 768 ? 'Close sheet' : 'Close panel', exact: true }).first().click();
            await page.getByText('Limited pilot', { exact: true }).waitFor();
            run.frameTiming = await sky().evaluate(() => new Promise(resolve => { const times = [], canvas = document.querySelector('#stel-canvas'), gl = canvas.getContext('webgl2') || canvas.getContext('webgl'), ext = gl?.getExtension('WEBGL_debug_renderer_info'); function tick(t) { times.push(t); if (times.length < 31)
                return requestAnimationFrame(tick); const d = times.slice(1).map((t, i) => t - times[i]), sorted = [...d].sort((a, b) => a - b); resolve({ intervalsMs: d, medianMs: sorted[15], p95Ms: sorted[28], renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null }); } requestAnimationFrame(tick); }));
            let prior = heavy();
            await choose('Earth');
            await ready('earth');
            await record('sky-earth', prior);
            prior = heavy();
            await choose('Sky');
            await ready('sky');
            await record('earth-sky', prior);
            if (width === 1440) {
                prior = heavy();
                await choose('Solar System');
                await ready('solar');
                await record('sky-solar', prior);
                await page.getByRole('button', { name: 'Return to Sky', exact: true }).click();
                await ready('sky');
                await record('solar-sky');
                prior = heavy();
                await page.goBack();
                await ready('solar');
                await record('back-solar', prior);
                await page.goForward();
                await ready('sky');
                await record('forward-sky');
            }
            prior = heavy();
            await page.reload();
            await ready('sky');
            await record('reload-sky', prior);
            await page.screenshot({ path: out + '/' + width + 'x' + height + '-returned-sky.png' });
            assert.deepEqual(run.pageErrors, []);
            run.status = 'PASS';
        }
        catch (e) {
            run.status = 'FAIL';
            run.error = e.stack;
            await page.screenshot({ path: out + '/' + width + 'x' + height + '-failure.png' }).catch(() => { });
            throw e;
        }
        finally {
            await ctx.close();
            await writeFile(out + '/proof.json', JSON.stringify(proof, null, 2));
        }
    }
    proof.status = 'PASS';
}
catch (e) {
    proof.status = 'FAIL';
    proof.error = e.stack;
    console.error(e.stack);
    process.exitCode = 1;
}
finally {
    await browser.close();
    proof.source_unchanged = JSON.stringify(await sourceHashes()) === JSON.stringify(proof.source_sha256);
    if (!proof.source_unchanged) {
        proof.status = 'SOURCE_CHANGED';
        process.exitCode = 1;
    }
    proof.finished = new Date().toISOString();
    await writeFile(out + '/proof.json', JSON.stringify(proof, null, 2));
}
