# Solar 2.4 Windows graphics measurements

Actual headed Microsoft Edge on Windows, NVIDIA RTX 3060. Nineteen sequential cases; no competing browser recording or screenshot work. HTTP cache disabled; driver/browser shader caches were not forcibly reset. Startup begins at Balanced quality, followed by the requested quality switch. This is not physical-phone or total-VRAM qualification.

The runner activates the real orbit-control button each frame, warms 70 frames and measures 200. The retained rejected attempt used SystemScene keyboard bindings that Solar orbit mode does not implement; its unchanged render count failed the assertion and those timings are excluded.

| Scene | Quality | Viewport | Startup ms | RAF p95 ms | GPU p95 ms | CPU render p95 ms | Cold max ms |
|---|---|---|---:|---:|---:|---:|---:|
| pluto | efficient | 1440×900 | 1388.2 | 7.00 | 0.967 | 1.00 | 236.0 |
| pluto | balanced | 1440×900 | 1246.0 | 7.00 | 0.717 | 2.30 | 97.2 |
| pluto | detailed | 1440×900 | 1166.6 | 7.00 | 0.870 | 1.20 | 104.1 |
| ceres | efficient | 1440×900 | 1102.9 | 7.00 | 0.237 | 1.50 | 125.1 |
| ceres | balanced | 1440×900 | 1159.6 | 7.00 | 1.014 | 1.30 | 118.0 |
| ceres | detailed | 1440×900 | 1073.2 | 7.00 | 0.802 | 1.80 | 97.2 |
| 67p | efficient | 1440×900 | 1080.1 | 7.00 | 0.296 | 1.00 | 90.2 |
| 67p | balanced | 1440×900 | 1121.3 | 7.00 | 0.775 | 1.60 | 111.1 |
| 67p | detailed | 1440×900 | 1124.0 | 7.00 | 0.820 | 1.30 | 166.7 |
| belt | efficient | 1440×900 | 1263.6 | 7.00 | 0.626 | 1.80 | 104.1 |
| belt | balanced | 1440×900 | 1291.4 | 7.00 | 0.950 | 1.70 | 97.3 |
| belt | detailed | 1440×900 | 1388.4 | 7.00 | 1.489 | 2.10 | 104.1 |
| kuiper | efficient | 1440×900 | 1329.1 | 7.00 | 0.538 | 1.90 | 125.1 |
| kuiper | balanced | 1440×900 | 1254.4 | 7.00 | 1.068 | 3.00 | 124.9 |
| kuiper | detailed | 1440×900 | 1452.7 | 7.00 | 0.888 | 2.00 | 125.1 |
| pluto | balanced | 390×844 | 1148.7 | 7.00 | 1.029 | 1.30 | 104.2 |
| kuiper | balanced | 390×844 | 1413.2 | 7.00 | 0.589 | 1.50 | 97.4 |
| pluto | balanced | 844×390 | 1141.2 | 7.00 | 1.029 | 1.60 | 152.7 |
| kuiper | balanced | 844×390 | 1419.8 | 7.00 | 1.651 | 2.60 | 97.2 |

All 19 runs meet the stated invariants: actual render count increases, stable renderer/epoch/source positions, one output transform, unchanged source-asset ownership/reservations, texture budget respected, at most one population draw and worker, and no console/page errors. Source-texture accounting peaks at **97.69 MiB** in these cases; render targets, driver memory and total VRAM are additional.

Steady RAF p95 ≤7.0 ms and GPU p95 ≤1.651 ms. Startup to settled candidate is **1,073–1,453 ms**. The largest cold frame is **236 ms**: this candidate is not hitch-free. Cold WebGL call and long-task arrays remain in [the receipt](evidence/performance.json). CPU timings of WebGL calls measure submission/blocking, not asynchronous GPU compilation completion.

The larger catalog is parsed/validated in its worker; prior Node-only measurements (133 ms parse, 39 ms validation, 24–41 ms evaluation) are supporting evidence only. The browser measures the complete source-backed scene. No population-wide precision or physical-device performance guarantee follows.

The prior Solar 2.3 28-case measurements remain valid for their unchanged scenes. The new scenes and complete catalog add a different loading workload; the new startup range is not a controlled speedup/regression ratio against those old cases.

Streaming retains 64/192/384 MiB admission budgets and cancellable selected detail. Pluto/Charon use only native-source levels. Cold source parsing, texture submission and shader validation still contribute stalls; no blur, invented detail or feature disablement was used to mask them.
