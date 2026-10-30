# Solar 2.2 performance qualification

**24/24 cases PASS** on 2026-10-30, 17:30:30–17:31:46 UTC (76.1 seconds).
This is a bounded single-machine comparison, not a physical-phone or sustained-load qualification.
Candidate application: `39f73b2ff0162d491fcf65b41a0bc038dd608b65`, served by the owner Docker preview at `http://localhost:4231`.
Preserved Solar 2.1.1 baseline: `http://solar211.localhost:4231`; all 14 loaded JavaScript bundle hashes are in the receipt.
Branch: `recovery/reconcile-20261026`. The benchmark changed no application code.

The [complete receipt](performance.json.gz) includes every case, raw RAF intervals, shader-call phases, asset decode/resource timing, dimensions, GPU identity and loaded bundle hashes.
Uncompressed SHA-256: `35695e188ac4354eff6d633d233b5ad01297104bb2c1e174a2234a5d888b8b93` (1,103,302 bytes; gzip 86,044 bytes).
Raw local copy: `output/playwright/solar-system-2.2/performance.json`.

## Method and checks

From the worktree root:

```bash
node --check scripts/validation/benchmark_solar22.mjs
node scripts/validation/benchmark_solar22.mjs --list
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/benchmark_solar22.mjs")" http://solar211.localhost:4231 http://localhost:4231 docs/validation/solar-system-2.2/performance.json
```

The first two commands passed; the execution completed with exit 0 and 24 `PASS` cases. Gzip receipts were verified by round-trip decompression. Benchmark source SHA-256: `9be3d238e58852659d597797a560608e8cebcc9b1a7aecb37ea5c4e807179814`.

Windows 10.0.26300, headed Edge 156.0.4314.50, Intel i7-11800H, NVIDIA RTX 3060 Laptop GPU / D3D11, driver 32.0.16.1714. Every case checked its actual WebGL renderer and foreground visibility. No concurrent browser, screenshots, recording, tracing or test suites ran during measurement.

Eighteen desktop cases cover Earth/Saturn/Sun × Balanced/Efficient/Detailed × baseline/candidate at 1440×900. Each candidate immediately follows its baseline and restores the same camera/target/up through the existing return-view contract. Six additional candidate Earth cases use portrait 390×844 and landscape 844×390. DPR is 1; mobile layouts still use the desktop GPU.

Each fresh, cache-disabled context waits for base textures/clouds, stable science inputs including Eros, completed atmosphere lookup loading, no camera animation, and settled detail reservations where available. Initial Balanced readiness and a subsequent requested-quality switch are timed separately. The fixed epoch is `2026-10-27T04:00:00Z`.

The existing Orbit camera right control is activated once per RAF: 40 warm-up frames followed by 200 measured frames. Independent RAF/input samples retain all 200; existing renderer CPU/GPU diagnostics retain 180 rolling samples. Assertions require GPU timing, 200 rendered frames, stable geometry/texture counts, unchanged source positions/epoch, valid target/quality, foreground visibility and no console/network errors. All passed. These are actual frame timings, not FPS extrapolated from GPU duration.

## Desktop CPU/GPU results

Each timing is **median/p95 in milliseconds**, baseline → candidate. Draw calls are the final frame.

| Case | Renderer CPU ms | GPU ms | Draw calls |
| --- | --- | --- | --- |
| Earth balanced | 1.100/1.300 → 1.200/1.800 | 1.037/1.130 → 1.118/1.168 | 29 → 29 |
| Earth efficient | 0.800/1.200 → 0.900/1.400 | 0.197/1.388 → 0.261/0.284 | 11 → 13 |
| Earth detailed | 1.100/1.900 → 1.100/1.500 | 0.877/0.924 → 0.808/0.829 | 29 → 29 |
| Saturn balanced | 0.900/1.300 → 0.900/1.700 | 1.011/1.035 → 0.916/0.944 | 28 → 28 |
| Saturn efficient | 0.800/1.100 → 0.900/1.500 | 0.174/0.224 → 0.221/0.256 | 12 → 14 |
| Saturn detailed | 1.100/1.500 → 1.000/1.300 | 0.689/0.745 → 1.060/1.116 | 28 → 28 |
| Sun balanced | 0.900/1.100 → 1.000/1.300 | 1.185/1.211 → 0.714/0.744 | 27 → 27 |
| Sun efficient | 0.700/0.900 → 0.900/1.400 | 0.358/0.798 → 0.331/0.351 | 11 → 13 |
| Sun detailed | 0.900/1.200 → 1.000/1.400 | 1.116/1.210 → 0.910/0.947 | 27 → 27 |

All 24 measured RAF medians were 6.9 ms, p95 7.0–7.1 ms; the largest interval was 7.4 ms. This reflects the tested display cadence, not a guarantee at other refresh rates or on other devices. No measured-phase resource growth occurred.

The largest paired GPU median increase was Detailed Saturn: 0.689 → 1.060 ms (+0.371 ms, about 54%). Efficient Earth/Saturn cost +0.064/+0.047 ms and two additional draws for the linear composition/output passes. Balanced Earth cost +0.081 ms. Other paired GPU medians decreased in this sweep; this is not evidence that every quality or body is uniformly faster.

Candidate mobile-layout Earth CPU medians were 0.7–1.1 ms, p95 at most 1.5 ms; GPU medians 0.403–0.534 ms, p95 at most 1.937 ms. Full per-case values and frame intervals remain in the receipt.

## Startup, memory and shader calls

Desktop navigation-to-Balanced-ready median was 971 ms baseline versus 817 ms candidate, with ranges 837–2,020 and 765–1,886 ms. Candidate Sun Detailed's initial readiness was slower (1,886 versus 837 ms), so the aggregate is not a universal startup improvement. The process and OS/driver caches are shared, though browser contexts and HTTP caches are reset. Detailed Earth then needed 361 ms desktop, 386 ms portrait and 364 ms landscape to switch to its 8K detail; baseline desktop Detailed switched in 79 ms.

Base source-texture reservation fell from 128,999,428 bytes (123.02 MiB) to 49,304,922 (47.02 MiB). Candidate base **plus detail** totals were:

| Selected body / quality | Reserved bytes | MiB |
| --- | ---: | ---: |
| Earth Efficient | 60,489,733 | 57.69 |
| Earth Balanced | 94,044,165 | 89.69 |
| Earth Detailed, 8K | 228,261,893 | 217.69 |
| Saturn Efficient | 66,082,138 | 63.02 |
| Saturn Balanced / Detailed | 116,413,786 | 111.02 |
| Sun, all qualities | 49,304,922 | 47.02 |

Detailed Earth therefore exceeds the previous base reservation. These accounting figures include source texture mip allowances, not render targets, driver overhead, CPU bitmaps or total VRAM. Efficient keeps composition targets, including allocations from initial Balanced mode: desktop texture counts changed Earth 14→29, Saturn 12→28 and Sun 1→16. Counts alone do not measure their byte cost; Efficient bloom is disabled.

Identical `WebGL2RenderingContext.compileShader` and `linkProgram` wrappers were installed before navigation in both builds. They record native-call counts and CPU wall time only, without shader status queries, added programs or GPU blocking. Per-page candidate totals were 38–46 compile calls and 19–23 link calls; baseline 38–64 and 19–32. **Every measured 200-frame interval had zero compile/link calls.** Warm-up had 0–4/0–2 candidate compile/link calls and 2–14/1–7 baseline calls.

Candidate native-call sums per page were 0–0.2 ms compile and 0–0.4 ms link (baseline link maximum 0.5 ms). Compile p95 rounded to 0 ms; link p95 was 0–0.1 ms. Browser clock precision and asynchronous driver work mean these values do **not** measure GPU compiler completion, compilation success or shader program count. No sample truncation or native-call exceptions occurred. Driver shader caches were not forcibly cleared. Instrumentation may be disabled consistently with `--no-shader-calls`.

Warm-up contained two candidate and five baseline RAF intervals above 50 ms, with maxima 278 and 410 ms. These are startup/motion stutter proxies; they cannot be attributed exclusively to shader compilation. There were no >50 ms intervals in the measured phases.

## Preserved failures and limits

Two earlier attempts failed strictly and are retained:

- [Artifact-fetch DNS failure](performance-first-failure.json.gz): baseline rendering passed; Node's artifact request could not resolve `solar211.localhost`. Bundle hashing now uses loopback with the original Host header, matching the browser route. No measurement assertion was relaxed.
- [Incomplete science-readiness failure](performance-source-readiness-failure.json.gz): six Earth cases passed, then baseline Saturn's Eros position changed from unavailable to loaded. Both builds now wait for finite Eros/science inputs before measurement; the strict unchanged-position assertion remains.

The final run had zero console errors and zero HTTP/network failures. One baseline Earth Balanced warning event contains D3D11 FXAA warnings X3595 and X4000; candidate cases had none. The raw warning is retained. No lookup-table cancellation exception or broad error filter was needed.

Only the tested RTX float-render-target path is qualified here. Unsupported-float fallback, physical phones, thermal/battery behavior, long-duration travel/streaming and asynchronous GPU compiler completion are not qualified by this performance sweep. Visual, interaction and streaming qualification are separate evidence. No commit, push, merge or deployment was performed by this benchmark task.
