# Final cinematic acceptance corrections — draft PR88

**Working candidate. Owner visual acceptance pending. Do not merge, deploy, activate paid providers or begin R4.**

Continue the five delivered packages #84–#88 from `4e07ebfb4821b57e6bed3df4937eb78cce9755ee`. The approved original design family and scientific foundation remain authoritative. [Plan](../../superpowers/plans/2026-10-22-cinematic-acceptance-corrections.md). [Original reference images and byte manifest](../../design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md).

Working Docker preview: [Solar](http://127.0.0.1:4217/solar-system?date=2026-02-28T00:00:00Z), [Earth daytime](http://127.0.0.1:4217/earth?date=2026-06-05T12:00:00Z), [Sky astronomical night](http://127.0.0.1:4217/sky-engine?date=2026-08-13T04:00:00Z). The previous4216 preview and artifacts remain intact as rollback/comparison evidence. These local previews are not production deployments.

## Demonstrated causes and bounded corrections

Earth's actual390×900CSS/DPR3 browser canvas was195×450. Cesium's default recommended-resolution mode already uses CSS pixels; the existing `min(DPR,1.5)/DPR` cap divided it again. The owned Viewer now explicitly uses physical browser resolution before applying the existing cap. Actual DPR1/2/3 dimensions are390×900,585×1350,585×1350. Epoch and camera contracts remain unchanged. This corrects framebuffer softness; **no reduced imagery LOD caused by this setting is claimed**. Native tile refinement remains Cesium-owned.

Real provider probes distinguish NASA overview, regional EOX and qualified local aerial coverage from actual browser resolution. NASA Blue Marble remains a static500m overview, EOX the2016 Sentinel-2 cloudless10m mosaic capped at14, NAIP footprint-dependent, and PEMA restricted to the verified local-development footprint while release permission remains unverified. Night-side darkness comes from native illumination and controlled UTC. No brightness filter, invented imagery/clouds/night lights, paid imagery, terrain substitution, cache-policy change or provider promotion was added. Paris EOX screenshots retain source/SDK attribution; raw local PEMA captures are excluded from this publication bundle.

Solar's earlier camera fit ignored most HUD footprints and Saturn's ring extent. Labels could cover other bodies and controls. The corrected presentation measures the current HUD and fits visual envelopes using the camera's optical frame, leaving source AU positions and selection targets exact. Inner and Full views remain explicit; all nine supported bodies remain available through selection. Inner presentation omits nonselected outer-system glyphs rather than showing a clipped Saturn; Full view retains all eight planets. Full-system inner-body size and real planet arrangements still differ from the artistic concept. Label placement avoids live visible body/HUD bounds; unavailable label space uses the persistent accessible body rail.

Sky's fresh native Atmosphere ON conflicted with the approved OFF default. The owned adapter applies OFF once per embedded instance and preserves explicit native choices across recreation using a strict boolean setting. Standalone behavior remains unchanged. Real pointer evidence also exposed a Hub context card covering native observing tools; the desktop context/drawer now reserves the native rail and yields its footprint only while a native panel is open. This preserves the actual native controls, calculations, Pennsylvania panorama and observer/time. The UI-only Sky rebuild preserves native WASM, vendor code and original PNG bytes.

## Source-backed Sky comparison conditions

At ORAS41.321903°N,79.585394°W,432.816m, historical2026-02-28T00Z has Sun−10.751397° and Moon+52.685545°: nautical twilight, not astronomical night. The additional2026-08-13T04Z comparison has Sun−30.788493° and Moon−31.170198°. Docker observability and independent Skyfield evaluation of the unchanged DE442s agree. Weather, transparency, seeing and measured light pollution are not evaluated. Native Atmosphere OFF is a display preference, not a claim that real daytime/twilight has dark observing conditions.

The deliberate visual-default star profile remains1668 canonical stars/magnitude4.8, with existing optional deeper profiles. Native Milky Way/DSS, constellations/art, DSO/grids, landscape, Night Mode, search/focus, FOV and native settings remain available; no invented stars or nebulae are inserted. Initial native tile bootstrap and settled views are recorded separately. Optional object-media summary index returns404; rich media unavailable from that source is not fabricated.

## Evidence and status

Source-matched counts, screenshots, commands, immutable identities and remaining gaps are recorded below. Historical #84–#88 and N1 partial records remain historical and are not relabeled as fresh tests. Hardware GPU/mobile qualification is separate from SwiftShader/browser evidence. Green tests do not grant owner visual acceptance.

[Original/actual gallery](gallery/index.html) · [Specific remaining discrepancies](GAPS.md) · [Exact commands and results](COMMANDS.md) · [Loaded context](context.json) · [Exact changed paths](FILES_CHANGED.txt).

## Final focused qualification

| Check | Observed result |
| --- | --- |
| Frontend / TypeScript |319/319 in49 files; typecheck exit0|
| Native Earth + Sky regression tests |239/239 (Earth147, native92)|
| Docker Solar science |23passed; two existing deprecation warnings retained|
| Final integrated desktop/mobile navigation |14/14 each; actual Cesium destinations, touch/keyboard, source vectors, epoch/history, native Sky returns and one heavy renderer|
| Solar five-size geometry/UI/source |345/345 at1440×900,390×900,540×390,667×375,320×568|
| Normal-motion approach |2/2; actual Earth/Mars flights remain active through~900ms after HUD reflow and end at exact source targets|
| Renderer lifecycle / WebGL / fallback |7/7; source imagery failure/recovery, real context loss/Retry, resize, idle rendering and late-model teardown|
| Earth actual browser |DPR1/2/3 framebuffer assertions pass; four desktop and four high-DPI mobile checks plus separately labeled later desktop UI capture|
| Sky actual browser |Five pointer/preference/native round-trip groups; six independently completed scene slices/two epochs; three additional short-screen native groups|
| Reproducible artifacts / served bytes |Three identical136-file Hub builds; two identical513-payload-file Earth builds;136Hub and514Earth served files match|
| Original assets/data/settings/pins/rollback |Original archive/four PNGs, NASA bytes/Mars UVs, kernel, native scientific code,117 container states/mounts and90 volumes preserved|

Final Hub artifact `d8008d865cc7a19c1a773600dbfb627ad6a0802cb497395e8488745294c05be4`; Earth `43e822e52ffe01bc7591579e329ce0fb5aed5a521ffb9cd47808173f8beb03d3`; Sky `b1dbd0f039ccf4ed4c0a669baf5bd7288b1ea07c9db98e199c04949431a644fb`. External source pins and native WASM/vendor/PNG bytes remain unchanged. The two owned-runtime artifact identities are deliberately updated; prior qualified artifacts remain in the unchanged4216 preview and Git history.

Final browser checks ran against the frozen working source and reproduced artifacts. The final commit adds the same source plus its documentation/evidence; postcommit local/remote/served identity and independent exact-head review are recorded in the draft PR delivery receipt. No browser run is falsely described as having executed after a documentation-only commit.

## Loading, failed probes and reuse boundaries

The first desktop Earth UI capture at3s recorded partial loading. At the later bounded12s checkpoint its globe remained partial while selected Paris was ready; mobile globe/Paris and the separately measured native camera/LOD probes were ready. This does not prove complete geographical high-resolution coverage. The remaining desktop globe refinement delay was not assigned a proven underlying cause. Native regional source levels were10desktop/9mobile; close Paris reached14. No application tile-LOD defect was demonstrated. Publication excludes PEMA imagery with unverified release permission.

Two optional Earth diagnostic harness attempts failed to enable the loopback hooks, and reloading an already bridged iframe reset its time. Those are harness evidence, not valid integrated historical-epoch captures; their initial screenshot is not published as such. The real DPR red is the195×450 browser receipt and failing DPR2/3 unit regression. One initial sandbox export-test failure was proven `spawnSync python3 EPERM`; the permitted host suite subsequently passed.

Solar retains failed/partial probes separately: a validator initially included behind-camera bodies and read layout before its existing asynchronous reflow settled; those harness defects were corrected without hiding actual collisions. One15s initial readiness timeout had no sufficient diagnostic capture and its cause remains **UNKNOWN**. It is not relabeled as a functional assertion mismatch or a resource diagnosis. The final345-check run and separate motion red/green are fresh. The initially passing340-check working-source run predates the compact typography and motion correction and remains historical.

Sky's enclosing scene audit remains **FAILED** where a later retained mobile selection sheet intercepted a new search. Its independently completed desktop/mobile slices are reused with exact source/PNG hashes and explicit enclosing status; short scenes completed separately with fresh per-epoch contexts. A broad restarted audit was interrupted and is not passing evidence. The desktop native-rail collision was a real defect, reproduced separately and qualified with actual pointer input while context stayed mounted. The final source record does not claim an uninterrupted six-scene suite or a fresh full original nine-group native matrix.

Accepted Sky/Earth scrolling uses unchanged protocol/wheel/camera source and retained qualified evidence; this pass freshly verifies native returns, keyboard/touch, history, observer/UTC and serial renderer cleanup. Browser history recreation is not bfcache certification. The old N1 desktop5/22/mobile7/22 at240s and broad R3 qualification limits remain historical. No stalled N1 suites or open-ended resource investigation were repeated.

## Measured software rendering

All current graphics observations are ANGLE/Vulkan SwiftShader. No DRI device is exposed; NVML reports that OS policy blocks GPU access. GPU timers are unsupported/null. The following24-step input/double-RAF browser intervals include native rendering, scheduling and acknowledged input; they are not GPU execution, FPS certification or a controlled hardware before/after benchmark.

| Mode / viewport / DPR | Median / p95 interval ms |
| --- | --- |
| Earth1440×900 /1 |470.2 /523.0|
| Earth390×900 /3 |325.25 /390.0|
| Solar1440×900 /1 |93.65 /148.8|
| Solar390×900 /1 |51.9 /66.4|
| Solar390×900 /3 |78.75 /105.7|

Solar native CPU-submission median/p95 values were0.5/20.6,0.5/15.7 and0.6/17.3ms respectively; asynchronous GPU work is not included. Driver ReadPixels stall warnings remain recorded. Display quality, effects and aggregate density controls remain explicit; scientific behavior is not silently degraded. Build large-chunk advice and backend deprecations remain unsuppressed.

**Next action: owner visual review of the working preview and the exact original/actual gallery, then separately named physical-device qualification. No merge, deployment, paid activation or R4.**
