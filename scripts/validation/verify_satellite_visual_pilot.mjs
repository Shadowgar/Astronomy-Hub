// Bounded native-pixel/motion/control evidence. No object data or photometry injection.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = process.env.SV_URL || 'http://127.0.0.1:4227', out = process.env.SV_OUT || 'output/satellite-visual-pilot/browser', id = process.env.SV_NORAD || '61045', epoch = process.env.SV_EPOCH || '2026-10-25T10:22:00Z';
await mkdir(out, { recursive: true });
const files = ['backend/app/services/sky_catalog_service.py', 'backend/app/services/satellite_feed_status_service.py', 'scripts/skydata/build_visual_satellite_pilot.py', 'scripts/validation/verify_satellite_visual_pilot.mjs', 'runtimes/sky-adapter/plugin.js', 'runtimes/sky-adapter/entry.mjs', 'runtimes/sky-adapter/satellite-presentation.mjs', 'runtimes/sky-adapter/satellite-tracking.mjs', 'frontend/src/features/workspace/TimeSurface.tsx', 'frontend/src/features/workspace/WorkspaceShell.tsx', 'frontend/src/features/workspace/satelliteTimeStatus.ts'];
const hash = x => createHash('sha256').update(x).digest('hex'), identity = async () => Object.fromEntries(await Promise.all(files.map(async (p) => [p, hash(await readFile(p))])));
const expectedSkyBuild = JSON.parse(await readFile('frontend/public/oras-sky-engine/oras-runtime-build.json'));
const proof = { status: 'RUNNING', base, source_sha256: await identity(), runs: [], limits: ['Fresh 155-record limited visual subset; native optical eligibility is conditional. No geometrically eligible sunlit dark-observer pass existed at the independently checked current instant.', 'Upcoming-pass replay at the declared October25 epoch uses native1x as a simulation, not current LiveUTC. The fixed-time Hub intent remains Paused; the native simulation clock is controlled explicitly by this evidence harness. UI Live/Paused actions are tested separately.', 'Point-isolation temporarily hides native satellites at a frozen instant. Native light-point and glyph pixels are measured separately.', 'Actual Chromium software rendering; mobile input/viewport emulated.'] }, browser = await chromium.launch();
const frames = (f, n) => f.evaluate(n => new Promise(resolve => { let i = 0; function tick() { if (++i >= n)
    resolve();
else
    requestAnimationFrame(tick); } requestAnimationFrame(tick); }), n);
try {
    for (const [width, height] of (process.env.SV_VIEWPORT ? [process.env.SV_VIEWPORT.split('x').map(Number)] : [[1440, 900], [390, 900], [667, 390]])) {
        const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 768, reducedMotion: 'reduce' }), p = await ctx.newPage();
        p.setDefaultTimeout(15000);
        const run = { width, height, id, status: 'RUNNING', method: width < 768 ? 'pinch' : 'wheel', errors: [], checks: [] };
        proof.runs.push(run);
        p.on('pageerror', e => run.errors.push(e.message));
        let f, box, center;
        const cdp = await ctx.newCDPSession(p);
        const state = () => f.evaluate(id => { const s = window.__ORAS_STEL, c = s.core, o = s.getObj('NORAD ' + id); try {
            return { wallUtc: new Date().toISOString(), ...window.orasSkyAdapter.navigation(), speed: c.time_speed, selection: c.selection?.jsonData?.model_data?.norad_number ?? null, lock: c.lock?.jsonData?.model_data?.norad_number ?? null, satellites: c.satellites.visible, hints: c.satellites.hints_visible, offset: c.satellites.hints_mag_offset, magnitude: o.getInfo('vmag', c.observer), radec: o.getInfo('radec', c.observer), viewVector: s.convertFrame(c.observer, 'ICRF', 'VIEW', o.getInfo('radec', c.observer)), source: o.jsonData, snapshot: window.orasSkyAdapter.snapshot(), atmosphere: c.atmosphere.visible, landscape: c.landscapes.current_id, night: window.orasSkyAdapter.nightMode() };
        }
        finally {
            o.destroy();
        } }, id);
        async function open() { await p.goto(base + '/sky-engine?date=' + epoch); await p.locator('[data-runtime-status=ready]').waitFor({ timeout: 45000 }); f = p.frames().find(x => x.url().includes('/oras-sky-engine/')); run.servedSkyBuild = await (await p.request.get(base + '/oras-sky-engine/oras-runtime-build.json')).json(); assert.deepEqual(run.servedSkyBuild, expectedSkyBuild); await f.waitForFunction(id => { const o = window.__ORAS_STEL?.getObj('NORAD ' + id); if (!o)
            return false; o.destroy(); return true; }, id, { timeout: 30000 }); await f.evaluate(id => { const s = window.__ORAS_STEL, o = s.getObj('NORAD ' + id); s.core.selection = 0; s.core.lock = 0; s.pointAndLock(o, 0); o.destroy(); }, id); box = await f.locator('#stel-canvas').boundingBox(); center = { x: box.x + box.width / 2, y: box.y + box.height / 2 }; await frames(f, 60); }
        async function zoom(inward) { if (width >= 768) {
            await p.mouse.wheel(0, inward ? -120 : 120);
            await p.waitForTimeout(50);
            return;
        } const small = 18, big = Math.min(120, box.width / 2 - 24), start = inward ? small : big, end = inward ? big : small, points = r => [{ id: 1, x: center.x - r, y: center.y }, { id: 2, x: center.x + r, y: center.y }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(start) }); for (let n = 1; n <= 12; n++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(start + (end - start) * n / 12) });
            await p.waitForTimeout(65);
        } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await frames(f, 3); }
        async function crop(name) { const path = `${out}/${width}x${height}-${name}.png`; const bytes = await p.screenshot({ clip: { x: center.x - 64, y: center.y - 64, width: 128, height: 128 } }); await writeFile(path, bytes); return { path, sha256: hash(bytes), base64: bytes.toString('base64') }; }
        async function pointPair(name) { const sample = await state(); assert.equal(sample.speed, 0); assert.equal(sample.camera.projection, 2); const v = sample.viewVector, n = Math.hypot(...v.slice(0, 3)), q = v.slice(0, 3).map(x => x / n), aspect = box.width / box.height, fovy = aspect < 1 ? 4 * Math.atan(Math.tan(sample.camera.fovRad / 4) / aspect) : sample.camera.fovRad, scale = box.height / (2 * Math.tan(fovy / 4)), target = { x: 64 + scale * q[0] / (1 - q[2]), y: 64 - scale * q[1] / (1 - q[2]) }; await frames(f, 5); const on = await crop(name + '-on'); await f.evaluate(() => window.__ORAS_STEL.core.satellites.visible = false); await frames(f, 5); const off = await crop(name + '-off'); await f.evaluate(() => window.__ORAS_STEL.core.satellites.visible = true); await frames(f, 5); const pixels = await p.evaluate(async ({ on, off, target }) => { async function data(b) { const im = await createImageBitmap(new Blob([Uint8Array.from(atob(b), c => c.charCodeAt(0))])); const c = new OffscreenCanvas(128, 128), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, 128, 128).data; } const a = await data(on), b = await data(off); let sum = 0, mass = 0, xsum = 0, ysum = 0, pixels = 0; for (let y = Math.max(0, Math.floor(target.y) - 6); y <= Math.min(127, Math.ceil(target.y) + 6); y++)
            for (let x = Math.max(0, Math.floor(target.x) - 6); x <= Math.min(127, Math.ceil(target.x) + 6); x++) {
                const i = (y * 128 + x) * 4, d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
                sum += d;
                if (d >= 15) {
                    mass += d;
                    xsum += x * d;
                    ysum += y * d;
                    pixels++;
                }
            } return { sum, pixels, target, centroid: mass ? [xsum / mass, ysum / mass] : null }; }, { on: on.base64, off: off.base64, target }); return { projection: 'Pinned native stereographic2 ICRF→VIEW, normalized vector, 6px target-local mask', on: { path: on.path, sha256: on.sha256 }, off: { path: off.path, sha256: off.sha256 }, pixels, state: await state() }; }
        async function symbol(name) { const image = await crop(name); const pixels = await p.evaluate(async (b) => { const im = await createImageBitmap(new Blob([Uint8Array.from(atob(b), c => c.charCodeAt(0))])); const c = new OffscreenCanvas(128, 128), x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, 128, 128).data; let symbol = 0, label = 0; for (let y = 0; y < 128; y++)
            for (let x = 0; x < 128; x++) {
                const i = (y * 128 + x) * 4;
                if (d[i + 1] > 70 && d[i + 1] - d[i] > 20 && d[i + 1] - d[i + 2] > 15) {
                    if (x >= 52 && x <= 76 && y >= 52 && y <= 76)
                        symbol++;
                    else
                        label++;
                }
            } return { symbol, label }; }, image.base64); return { file: image.path, sha256: image.sha256, pixels, state: await state() }; }
        try {
            console.log(width, height, 'open fresh-source upcoming-pass simulation');
            await open();
            run.initial = await state();
            const expectedFeed = JSON.parse(await readFile('output/satellite-visual-pilot/release/manifest.json'));
            run.feed = await (await p.request.get(base + '/api/sky/satellite-feed?norad=' + id)).json();
            assert.equal(run.feed.data.sha256, expectedFeed.sha256);
            assert.equal(run.feed.data.source_profile, 'visual_satellite_pilot.v1');
            assert.equal(run.feed.data.record_count, 155);
            assert.equal(run.feed.data.fresh_record_count, 155);
            assert.equal(run.feed.data.release_validated, true);
            const nativeExpected = gunzipSync(gunzipSync(await readFile('output/satellite-visual-pilot/release/tle_satellite.jsonl.gz'))).toString().trim().split('\n').map(JSON.parse);
            run.nativeSourceAudit = await f.evaluate(expected => { const s = window.__ORAS_STEL, errors = []; for (const row of expected) {
                const o = s.getObj('NORAD ' + row.model_data.norad_number);
                if (!o) {
                    errors.push({ id: row.model_data.norad_number, error: 'not discovered' });
                    continue;
                }
                try {
                    const m = o.jsonData.model_data;
                    if (JSON.stringify(m.tle) !== JSON.stringify(row.model_data.tle) || m.mag !== row.model_data.mag)
                        errors.push({ id: row.model_data.norad_number, error: 'TLE or standard magnitude mismatch' });
                }
                finally {
                    o.destroy();
                }
            } return { count: expected.length, errors }; }, nativeExpected);
            assert.deepEqual(run.nativeSourceAudit, { count: 155, errors: [] });
            assert.ok(run.initial.camera.fovRad * 180 / Math.PI > 60);
            assert.equal(run.initial.selection, null);
            assert.equal(run.initial.lock, null);
            assert.equal(run.initial.hints, false);
            run.pointBefore = await pointPair('wide-before');
            assert.ok(run.pointBefore.pixels.sum > 0);
            assert.ok(run.pointBefore.pixels.centroid);
            await p.screenshot({ path: `${out}/${width}x${height}-wide.png` });
            if (width === 1440)
                await f.evaluate(() => { const canvas = document.querySelector('#stel-canvas'), stream = canvas.captureStream(15), chunks = [], recorder = new MediaRecorder(stream, { mimeType: 'video/webm', videoBitsPerSecond: 1500000 }); let done; const result = new Promise(resolve => { done = resolve; }); recorder.ondataavailable = e => { if (e.data.size)
                    chunks.push(e.data); }; recorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); done(new Blob(chunks, { type: 'video/webm' })); }; window.__orasPilotRecording = { recorder, result }; recorder.start(); });
            await f.evaluate(() => { window.orasSkyAdapter.setLive(true); setTimeout(() => { window.orasSkyAdapter.setLive(false); window.__orasPilotRecording?.recorder.stop(); }, 8000); });
            run.motionBefore = await state();
            run.motionSamples = [run.motionBefore];
            for (let step = 1; step <= 4; step++) {
                await p.waitForTimeout(2000);
                run.motionSamples.push(await state());
                await f.locator('#stel-canvas').screenshot({ path: `${out}/${width}x${height}-simulation-motion-${step}.png` });
            }
            await f.evaluate(() => window.orasSkyAdapter.setLive(false));
            run.motionAfter = await state();
            if (width === 1440) {
                const video = await f.evaluate(async () => { const blob = await window.__orasPilotRecording.result, bytes = new Uint8Array(await blob.arrayBuffer()); let binary = ''; for (let i = 0; i < bytes.length; i += 8192)
                    binary += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(binary); });
                const bytes = Buffer.from(video, 'base64'), path = out + '/fresh-pass-native-1x.webm';
                await writeFile(path, bytes);
                run.video = { path, sha256: hash(bytes), bytes: bytes.length, scope: 'Actual native canvas capture at 15fps; explicit upcoming-pass simulation; native clock1x for eight seconds, no product LiveUTC claim' };
            }
            run.pointAfter = await pointPair('wide-after');
            assert.ok(Date.parse(run.motionAfter.utc) > Date.parse(run.motionBefore.utc) + 6000);
            assert.equal(run.motionAfter.lock, null);
            for (const key of ['yawRad', 'pitchRad', 'rollRad'])
                assert.equal(run.motionAfter.camera[key], run.motionBefore.camera[key]);
            const a = run.motionBefore.radec.slice(0, 3), b = run.motionAfter.radec.slice(0, 3), dot = a.reduce((s, x, i) => s + x * b[i], 0);
            run.angularDisplacementDeg = Math.acos(Math.max(-1, Math.min(1, dot / Math.hypot(...a) / Math.hypot(...b)))) * 180 / Math.PI;
            assert.ok(run.angularDisplacementDeg > .001);
            assert.ok(run.pointAfter.pixels.sum > 0 && run.pointAfter.pixels.centroid);
            run.pointPixelDisplacement = Math.hypot(...run.pointAfter.pixels.centroid.map((v, i) => v - run.pointBefore.pixels.centroid[i]));
            assert.ok(run.pointPixelDisplacement > .25);
            run.checks.push('Unselected normal-FOV native point pixels and angular/pixel displacement at fixed camera during native1x fresh-source upcoming-pass simulation');
            console.log(width, height, 'wide point and motion captured');
            await open();
            await p.mouse.move(center.x, center.y);
            const fov = async () => Number((await state()).camera.fovRad) * 180 / Math.PI;
            for (let n = 0; await fov() > 5 && n < 100; n++) {
                await zoom(true);
            }
            assert.ok(await fov() <= 5);
            await frames(f, 10);
            run.close = await symbol('automatic-close');
            assert.equal(run.close.state.selection, null);
            assert.equal(run.close.state.lock, null);
            assert.equal(run.close.state.hints, true);
            assert.ok(run.close.pixels.symbol > 0);
            assert.ok(run.close.pixels.label > 0);
            console.log(width, height, 'automatic symbols captured');
            await p.screenshot({ path: `${out}/${width}x${height}-automatic-close-full.png` });
            const indicator = await p.getByLabel('Field of view').innerText().catch(() => p.locator('.as-fov').innerText());
            run.indicator = indicator;
            const displayed = Number(indicator.match(/([0-9.]+)°/)[1]);
            assert.ok(Math.abs(displayed - await fov()) <= .051, 'Displayed FOV agrees with native rounded to one decimal');
            run.checks.push('Actual wheel/pinch input automatically reveals separate native symbol and label pixels without selection');
            for (let n = 0; await fov() < 7.1 && n < 30; n++) {
                await zoom(false);
            }
            await frames(f, 8);
            run.widened = await symbol('widened');
            assert.equal(run.widened.state.hints, false);
            assert.equal(run.widened.pixels.symbol, 0);
            assert.equal(run.widened.pixels.label, 0);
            run.widePoint = await pointPair('widened-point');
            assert.ok(run.widePoint.pixels.sum > 0);
            run.checks.push('Widening past7° hides identification and retains native point contribution');
            for (let n = 0; await fov() > 5 && n < 30; n++) {
                await zoom(true);
            }
            await frames(f, 8);
            run.returned = await symbol('close-return');
            assert.ok(run.returned.pixels.symbol > 0);
            if (width < 768)
                await p.touchscreen.tap(center.x, center.y);
            else
                await p.mouse.click(center.x, center.y, { delay: 250 });
            await f.waitForFunction(id => String(window.__ORAS_STEL.core.selection?.jsonData?.model_data?.norad_number) === id, id);
            await p.waitForTimeout(1200);
            const selected = await state();
            assert.equal(selected.snapshot.selection.source_id, id);
            assert.equal(selected.snapshot.selection.trackable, true);
            if (width < 768 && !await p.getByRole('button', { name: 'Track', exact: true }).first().isVisible())
                await p.getByRole('button', { name: 'Selected object', exact: true }).click();
            await p.getByRole('button', { name: 'Track', exact: true }).first().click();
            await f.waitForFunction(id => String(window.__ORAS_STEL.core.lock?.jsonData?.model_data?.norad_number) === id, id);
            run.trackingPaused = await state();
            assert.equal(run.trackingPaused.speed, 0);
            assert.equal(run.trackingPaused.utc, selected.utc);
            for (const key of ['atmosphere', 'landscape', 'night', 'observer'])
                assert.deepEqual(run.trackingPaused[key], selected[key]);
            assert.equal(run.trackingPaused.camera.fovRad, selected.camera.fovRad);
            await p.screenshot({ path: `${out}/${width}x${height}-paused-tracking.png` });
            run.checks.push('Real pointer/touch satellite selection and nativeTrack preserve pausedUTC,FOV,observer,atmosphere,landscape,NightMode');
            if (width < 768) {
                const close = p.getByRole('button', { name: 'Close sheet', exact: true });
                if (await close.isVisible())
                    await close.click();
            }
            await p.getByRole('button', { name: 'Resume Live', exact: true }).click();
            await f.waitForFunction(() => window.__ORAS_STEL.core.time_speed === 1);
            run.liveBefore = await state();
            await p.waitForTimeout(2000);
            run.liveAfter = await state();
            assert.ok(Date.parse(run.liveAfter.utc) > Date.parse(run.liveBefore.utc) + 1000);
            assert.equal(String(run.liveAfter.lock), id);
            assert.ok(Math.abs(run.liveAfter.camera.yawRad - run.liveBefore.camera.yawRad) + Math.abs(run.liveAfter.camera.pitchRad - run.liveBefore.camera.pitchRad) > 1e-8);
            await p.getByRole('group', { name: 'Scene time', exact: true }).getByRole('button', { name: 'Stop tracking', exact: true }).click();
            await f.waitForFunction(() => !window.__ORAS_STEL.core.lock);
            assert.equal((await state()).speed, 1);
            run.currentFeed = await (await p.request.get(base + '/api/sky/satellite-feed?norad=' + id)).json();
            assert.equal(run.currentFeed.data.fresh_record_count, 155);
            assert.equal(run.currentFeed.data.selected.freshness_status, 'fresh');
            run.currentNativeEligibility = await f.evaluate(expected => { const s = window.__ORAS_STEL, rows = []; for (const row of expected) {
                const o = s.getObj('NORAD ' + row.model_data.norad_number);
                try {
                    rows.push({ norad_id: String(row.model_data.norad_number), vmag: o.getInfo('vmag', s.core.observer), source_tle: o.jsonData.model_data.tle });
                }
                finally {
                    o.destroy();
                }
            } return { utc: window.orasSkyAdapter.navigation().utc, rows }; }, nativeExpected);
            await p.getByText('Limited pilot', { exact: true }).waitFor();
            assert.ok(Math.abs(Date.parse(run.liveAfter.utc) - Date.parse(run.liveAfter.wallUtc)) < 5000);
            assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await p.screenshot({ path: `${out}/${width}x${height}-live-limited-pilot.png` });
            run.checks.push('ResumeLive keeps native tracking and advances camera/time; Stoptracking leaves timeLive; current sourcefreshness is validated for this limited155recordsubset; currentinstant opticalvisibility is conditional');
            assert.deepEqual(run.errors, []);
            run.status = 'PASS';
            console.log(width, height, 'PASS', run.checks.length, 'pointPixelMove', run.pointPixelDisplacement);
        }
        catch (e) {
            run.status = 'FAIL';
            run.error = e.stack;
            run.url = p.url();
            run.body = await p.locator('body').innerText();
            run.native = await state().catch(() => null);
            await p.screenshot({ path: `${out}/${width}x${height}-failure.png` });
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
    proof.source_unchanged = JSON.stringify(await identity()) === JSON.stringify(proof.source_sha256);
    if (!proof.source_unchanged) {
        proof.status = 'SOURCE_CHANGED';
        process.exitCode = 1;
    }
    await writeFile(out + '/proof.json', JSON.stringify(proof, null, 2));
}
