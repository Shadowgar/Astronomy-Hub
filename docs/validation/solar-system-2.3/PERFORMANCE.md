# Solar 2.3 — actual Windows/NVIDIA performance

**28 cases measured; all behavioral/resource assertions PASS. No stutter-free or physical-phone claim.** Headed Windows Edge156.0.4314.58, ANGLE/NVIDIA RTX3060 Laptop GPU. All runtime inputs and exact build files are bound in `evidence/source-binding.json`; final commit is identified in PR107.

## Method and limitations

```bash
WIN_NODE='/mnt/c/Program Files/nodejs/node.exe'
"$WIN_NODE" "$(wslpath -w "$PWD/scripts/validation/benchmark_solar23.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.3/performance-final")"
```

Exit0; status MEASURED;28/28 run statusPASS, no console/page errors. Each case creates a browser context with HTTP cache disabled; **browser/driver shader caches are not forcibly cleared**. No screenshot, video, profiler, concurrent test suite or build ran during this final benchmark. Fixed source UTC2026-10-27T04:00Z; desktop1440×900 and mobile-size390×844/844×390 on the same desktop GPU.

Every cold navigation starts at the product's default **Balanced** quality. After startup, Efficient/Detailed cases switch through the actual UI and await admitted detail before steady sampling. Consequently startup/cold columns do not independently measure cold startup at each named quality. Readiness includes the actual selected body, complete overview assets, selected detail settlement, shader preparation and first renderer draw. Source/driver/OS caching and run order affect these single-run results.

Steady measurement uses70 warm-up frames then200 actual keyboard orbit frames; all200 renders are required, with the same scene identity, UTC and source centers. GPU timer queries report180 retained samples. CPU measurements include JS rendering/submission; GPU queries cover submitted rendering; neither is total system cost. Texture reservations include a conservative mip allowance, not total VRAM: render targets, depth, geometry and driver allocations are additional.

## Final measurements

All frame intervals and CPU/GPU costs below are milliseconds. Startup is wall time from navigation to source/assets/preparation readiness. Cold max is the largest observed RAF interval during that startup, not a promise about every later scene transition.

| System/body | Viewport | Steady quality | Startup | Cold max | RAF median/p95 | CPU median/p95 | GPU median/p95 | Source textures MiB |
|---|---|---|---:|---:|---:|---:|---:|---:|
| jupiter/jupiter | 1440×900 | efficient | 999 | 145.9 | 6.9/7.0 | 0.30/0.60 | 0.271/1.029 | 30.67 |
| jupiter/jupiter | 1440×900 | balanced | 715 | 41.6 | 6.9/7.0 | 0.40/0.80 | 0.644/0.664 | 78.67 |
| jupiter/jupiter | 1440×900 | detailed | 795 | 62.5 | 6.9/7.0 | 0.40/0.90 | 1.048/1.096 | 78.67 |
| saturn/saturn | 1440×900 | efficient | 774 | 48.7 | 6.9/7.0 | 0.30/0.50 | 0.266/0.275 | 25.69 |
| saturn/saturn | 1440×900 | balanced | 544 | 41.7 | 6.9/7.0 | 0.40/0.90 | 0.754/0.772 | 73.69 |
| saturn/saturn | 1440×900 | detailed | 552 | 41.8 | 6.9/7.0 | 0.40/0.80 | 0.765/0.800 | 73.69 |
| jupiter/io | 1440×900 | efficient | 741 | 48.6 | 6.9/7.0 | 0.30/0.50 | 0.183/0.248 | 25.33 |
| jupiter/io | 1440×900 | balanced | 758 | 48.6 | 6.9/7.0 | 0.40/0.80 | 0.722/0.826 | 57.33 |
| jupiter/io | 1440×900 | detailed | 758 | 48.5 | 6.9/7.0 | 0.40/0.90 | 0.918/1.214 | 57.33 |
| saturn/titan | 1440×900 | efficient | 519 | 41.7 | 6.9/7.0 | 0.30/0.40 | 0.232/0.249 | 20.35 |
| saturn/titan | 1440×900 | balanced | 575 | 62.6 | 6.9/7.0 | 0.40/0.80 | 0.703/0.720 | 52.35 |
| saturn/titan | 1440×900 | detailed | 552 | 41.8 | 6.9/7.0 | 0.40/0.60 | 0.879/0.901 | 52.35 |
| earth/earth | 1440×900 | efficient | 1007 | 166.6 | 6.9/7.0 | 0.40/0.60 | 0.297/0.315 | 26.67 |
| earth/earth | 1440×900 | balanced | 835 | 55.5 | 6.9/7.0 | 0.60/1.20 | 0.847/0.886 | 58.67 |
| earth/earth | 1440×900 | detailed | 830 | 48.7 | 6.9/7.0 | 0.60/0.90 | 1.547/1.574 | 186.67 |
| mars/phobos | 1440×900 | efficient | 868 | 48.6 | 6.9/7.0 | 0.30/0.50 | 0.255/0.534 | 2.67 |
| mars/phobos | 1440×900 | balanced | 618 | 48.6 | 6.9/7.0 | 0.40/0.70 | 0.982/1.498 | 2.67 |
| mars/phobos | 1440×900 | detailed | 724 | 48.7 | 6.9/7.0 | 0.40/0.80 | 0.738/1.386 | 2.67 |
| jupiter/jupiter | 390×844 | balanced | 740 | 48.6 | 6.9/7.0 | 0.40/0.70 | 1.062/1.136 | 78.67 |
| saturn/saturn | 390×844 | balanced | 546 | 41.8 | 6.9/7.0 | 0.40/1.00 | 1.040/1.087 | 73.69 |
| jupiter/io | 390×844 | balanced | 762 | 48.6 | 6.9/7.0 | 0.40/0.80 | 0.251/0.297 | 57.33 |
| saturn/titan | 390×844 | balanced | 619 | 55.6 | 6.9/7.0 | 0.40/0.70 | 1.018/1.114 | 52.35 |
| jupiter/jupiter | 844×390 | balanced | 779 | 48.7 | 6.9/7.0 | 0.30/0.90 | 0.993/1.036 | 78.67 |
| saturn/saturn | 844×390 | balanced | 578 | 41.7 | 6.9/7.0 | 0.30/0.80 | 1.080/1.124 | 73.69 |
| jupiter/io | 844×390 | balanced | 743 | 41.7 | 6.9/7.0 | 0.40/1.10 | 0.251/0.284 | 57.33 |
| saturn/titan | 844×390 | balanced | 536 | 41.7 | 6.9/7.1 | 0.30/0.70 | 1.036/1.123 | 52.35 |
| uranus/titania | 1440×900 | balanced | 944 | 41.8 | 6.9/7.0 | 0.50/1.00 | 0.709/0.738 | 26.67 |
| neptune/triton | 1440×900 | balanced | 556 | 48.6 | 6.9/7.0 | 0.40/0.70 | 0.557/0.592 | 48.00 |

Across28 cases: steady RAF median6.9ms, p95≤7.1ms; GPU p95≤1.574ms; CPU p95≤1.20ms. Startup519–1007ms in this local warmed-backend run. Source-texture reservations peak186.67MiB for Detailed Earth, within its384MiB admission ceiling; other profiles retain64/192MiB ceilings.

Observed source fetch wall durations ranged6.1–111.1ms; overview/model or detail-image decode spans0.5–234.0ms. These operations can overlap and should not be summed. Explicit selected-texture initialization/upload submission spans3.2–67.6ms. First installed-detail participation records a **whole-scene CPU render span**, up to165.5ms; it is not isolated texture GPU upload or isolated shader compile time. Detailed Earth's67.6ms promotion submission is a remaining loading cost even though steady rendering is fast.

## Cold hitch investigation and bounded correction

The previous Solar2.2 report recorded a319.5ms cold travel frame without a CPU trace of that exact event. This run does not claim retrospective proof of that historical frame's cause. Reproduction on the shared renderer's first Solar2.3 system candidate showed666.7ms Jupiter and652.8ms Saturn startup RAF gaps. Retained CPU profiles attributed roughly485–517ms to Three's first-use WebGL program validation (`getProgramInfoLog`); selected texture upload added tens of milliseconds. These are current reproduction findings, not an invented trace of the older319.5ms event.

The correction prepares pinned Three r180 scene and HDR/bloom/output/FXAA program variants using `KHR_parallel_shader_compile`, with cancellable polling and playback readiness gating. Validation stays enabled. The final FXAA variant is prepared for the default framebuffer. Unsupported extensions are reported honestly. Context-loss/route teardown aborts polling; synchronous creation failure rejects through owner cleanup. Six unit regressions and four actual lifecycle/native-route checks qualify these paths. No blur, resolution reduction, renderer replacement or scientific-feature disablement was used.

The final first Jupiter startup max is145.9ms and the largest final cold interval is166.6ms for the first Earth case. **Cold stalls remain.** In that Earth trace, `getProgramInfoLog` still blocks81.1ms and39.4ms after delayed Earth/Takram variants become available; the actual first-detail whole-scene draw is165.5ms. Texture submission and synchronous initial compile setup remain costs. Later cases benefit from caches. The before/final observations are not a rigorously reset driver-cache A/B and do not justify a universal speedup claim.

## Resource and transition proof

All28 runs require stable owned resources, texture allocations and reservations during orbit; GPU-uploaded geometry is bounded by those owners plus compositor quads. Uploaded counts can legitimately rise on first visibility of an already-owned offscreen moon. No assertion was removed to conceal a proven leak: the earlier false assumption and failed receipts remain documented in VALIDATION.md.

Separate27-check actual journeys exercise physical travel, forward/reverse source-window changes, parent/Solar/native returns and context retry at all three viewports. Six retained Solar streaming cases prove request/decode cancellation, fallback, quality retirement and disposal; four lifecycle cases prove delayed preparation and native terrain teardown. These are behavioral travel checks and recordings, not isolated GPU-cost attribution for each travel phase. The recordings expose any visible transition stalls for owner review.

Final receipt: [compressed measurements](evidence/performance.json.gz). Earlier failed/incomplete runs and raw CPU profiles remain in ignored `output/playwright/solar-system-2.3/`. Physical iPhone, other GPUs, fully cold browser/driver caches, long-duration thermal behavior and total VRAM remain unqualified.
