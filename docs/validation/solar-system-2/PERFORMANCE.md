# Solar System 2.0 controlled Windows performance evidence

**Eight cases measured successfully on the owner's Windows NVIDIA system.**
During continuous camera orbit, both builds retained a6.9ms median RAF interval
and7.0–7.1ms p95. The candidate costs more renderer CPU/GPU time and loads more
assets. This is evidence of unchanged observed frame pacing in this bounded
scenario, not a claim that the candidate renders faster than the baseline.

Machine: Windows10.0.26300, Intel i7-11800H,32GB RAM, headed Microsoft Edge
156.0.4314.42, NVIDIA GeForce RTX3060 Laptop GPU, driver32.0.16.1714. Every run
checks the actual WebGL renderer and rejects software rendering. The raw
[receipt](performance.json) records OS/browser/GPU, resource URLs, script hashes,
all200 intervals per case, decode samples, warnings and assertions.

## Method and scope

- Baseline `http://localhost:4231`; candidate `http://solar2.localhost:4231`.
  Epoch `2026-10-27T04:00:00.000Z`, time paused. Both use their initial inner-system
  overview, cinematic body sizing, effects/orbit paths on and asteroid layers off.
- One headed browser and one foreground page at a time. A fresh isolated context
  per case; CDP HTTP cache disabled. No screenshot/video capture or per-frame
  diagnostics during measurement. The private Docker server and real backend
  supply the application and scientific data; no mocked response is used.
- Actual **Orbit camera right** UI activation once per RAF:40 warm-up frames,
  then200 measured moving frames. Each case records200 actual renderer draws,
  changed camera, preserved target/source positions/epoch, and no geometry or
  texture-count growth. This is not idle RAF timing.
- RAF reports exactly200 interval samples. Renderer CPU and asynchronous GPU
  timers report the existing rolling last180 draw/query samples. All GPU queries
  were supported. CPU submission time, GPU elapsed time and RAF pacing are
  different measurements; their reciprocals are not interchangeable FPS.
- Identical nominal DPR1; actual browser DPR1.000000015. Phone-size viewports
  are Windows browser layouts with touch enabled, not physical phone tests.
  The1440×900,390×844 and844×390 render buffers match those dimensions.
- Startup means navigation until ready status plus all initial imagery/clouds:
  baseline2 body textures, candidate9, candidate asset requests zero. Every
  startup uses the initial Balanced profile. Efficient/Detailed are then selected
  through the real quality control before warm-up. Their startup entries do
  **not** represent distinct Efficient/Detailed asset-loading implementations.

## Observed times

All values are milliseconds. Renderer columns are median / p95.

| Build / profile | Viewport | Assets ready | RAF median / p95 | Renderer CPU | GPU |
|---|---:|---:|---:|---:|---:|
| Baseline Balanced |1440×900|1270.6|6.9 /7.0|0.50 /0.80|0.607 /0.772|
| Candidate Balanced |1440×900|1638.9|6.9 /7.0|1.00 /1.50|1.042 /1.172|
| Baseline Balanced |390×844|383.6|6.9 /7.0|0.60 /1.00|0.212 /0.353|
| Candidate Balanced |390×844|711.2|6.9 /7.1|0.90 /1.40|0.459 /1.172|
| Baseline Balanced |844×390|380.5|6.9 /7.0|0.50 /0.70|0.204 /0.367|
| Candidate Balanced |844×390|712.3|6.9 /7.0|0.90 /1.20|0.424 /0.462|
| Candidate Efficient |1440×900|827.5*|6.9 /7.0|0.80 /1.10|0.236 /0.684|
| Candidate Detailed |1440×900|788.0*|6.9 /7.0|0.90 /1.20|1.091 /1.222|

\* Initial Balanced startup, then the selected quality before measurement.
These are single runs, not statistical repetitions. The first desktop pair
includes cold browser/process and shader startup effects; subsequent cases can
benefit from process, OS, backend and driver caches despite disabled HTTP cache.
Startup is a local-server observation, not an internet/mobile download forecast.

## Resource and decode cost

| Build / profile | Viewport | Last-frame draw calls | Geometries | GPU texture objects |
|---|---:|---:|---:|---:|
| Baseline Balanced |1440×900|19|24|3|
| Candidate Balanced |1440×900|35|32|25|
| Baseline Balanced |390×844|19|23|3|
| Candidate Balanced |390×844|35|27|20|
| Baseline Balanced |844×390|20|24|3|
| Candidate Balanced |844×390|37|33|25|
| Candidate Efficient |1440×900|19|31|12|
| Candidate Detailed |1440×900|35|32|25|

Resource Timing reports7,902,370 transfer bytes over16 resources for each
baseline case and33,021,141 bytes over26 resources for each candidate case.
These totals include assets, application modules and API responses after the
document; they are not imagery-only sizes. The candidate adds25,118,771 bytes.
Tracked source texture allocation is128,999,428 bytes (123.02MiB), under its
192MiB budget, with47 owned resources and no pending asset requests. This source
budget excludes other GPU allocations such as postprocessing render targets;
it is not a hardware VRAM total. Quality changes did not alter the admitted
source texture-byte total in these runs. Efficient disables bloom and reduces
draw/texture objects. DPR1 does not exercise the higher DPR ceilings of other
profiles.

Candidate desktop Balanced recorded3 texture decode/resize operations at
83.8ms median /103.7ms maximum, and8 GLB parse/decode/resize operations at
191.0ms median /282.6ms maximum. Across candidate cases, the model maximum was
244.3–287.0ms. These existing instrumentation samples are asynchronous elapsed
durations, can overlap, and must not be added into a CPU time estimate. Baseline
has no equivalent decode instrumentation, so no unsupported comparison is made.

## Reproduction and retained failures

From the repository worktree in WSL, using installed Windows Node/Edge:

```sh
node --check scripts/validation/benchmark_solar2.mjs
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/benchmark_solar2.mjs")" http://localhost:4231 http://solar2.localhost:4231 "$(wslpath -w "$PWD/docs/validation/solar-system-2/performance.json")"
```

Final output:8 cases `PASS`, receipt status `MEASURED`, exit0;200 actual camera
draws each, zero page errors or failed HTTP responses, no motion-time resource
growth. The harness SHA-256 and served entry-module SHA-256 values are retained
in the receipt. Source application files were not edited by the benchmark.

The first attempt had7 measured cases and one failed baseline portrait startup
during the coordinated backend restart: `/api/v1/planetary-systems` and
`/api/v1/solar-system` returned502. It is retained separately at
`output/playwright/solar2/performance-first-attempt.json`; the stable rerun above
repeated all eight cases against the final frozen candidate. The failed startup
was not turned into a performance sample.

One candidate desktop shader compilation warning remains recorded: ANGLE HLSL
X3595 (gradient instruction in a varying loop) and X4000 (potentially
uninitialized `f_ApplyFXAA`). It did not produce a page/WebGL error, and subsequent
cases logged no warnings. This is not a warning-clean qualification.

The test covers a bounded overview orbit, not maximum-load close-ups, long time
playback, high-DPR devices, thermal endurance, lower-end GPUs, physical mobile,
or owner visual acceptance. RAF6.9ms is refresh-paced behavior on this display;
it does not establish a universal achieved FPS or spare capacity for all scenes.
The meaningful result is higher source/graphics cost with no observed pacing
regression in these eight controlled cases.

Measurement checkpoint: the retained bundle hashes precede final navigation-only
corrections for initial focus/restore and native observer handoff. The overview
rendering path, source imagery, effects, quality profiles and shader/resource
code measured above are unchanged by those corrections. Final frozen-build
navigation/capture proof is separate in runtime-receipt.json; this receipt is
reused evidence for the unchanged measured rendering scenario, not a claim that
its entry-module hash is the final application bundle hash.
