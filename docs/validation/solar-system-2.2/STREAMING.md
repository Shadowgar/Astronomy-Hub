# Solar 2.2 texture streaming qualification

**6/6 PASS** against served application
`39f73b2ff0162d491fcf65b41a0bc038dd608b65` on2026-10-30 at17:23:38–17:23:50UTC.
Windows Node22.14.0; headed Edge156.0.4314.50; NVIDIA RTX3060 Laptop/D3D11;
1440×900, reduced motion, fixed2026-10-27T04:00:00Z. Exclusive browser window.
[Full receipt, compressed](receipts/streaming.json.gz).

| Case | Actual evidence |
|---|---|
| Overview / first promotion | No high-detail startup fetch; Jupiter4096×3072 after selection; overview releases detail. |
| Original UV arrival race | Actual high atlas arrives before delayed compact model; no map on generic sphere; source UV geometry precedes atlas application. |
| Selection cancellation | Deferred Saturn request aborted by Mars selection; late release cannot publish stale detail. |
| Detail unavailable | Controlled Mars503 preserves1024×512 overview, source state and truthful notice. |
| Earth quality / retirement | Actual8192×4096 and2048×1024 transitions preserve camera/UTC/frame. A delivery barrier around a real decoded8k bitmap proves cancelled decode remains budgeted and closes before lower-budget replacement. |
| Eros / context retry | Preserved original Eros, no detail shader calls; actual context loss disposes ownership; UI Retry restores camera/UTC with exactly one fresh canvas. |

Zero page exceptions or unexpected console/network failures. Tracked textures:
overview49,304,922bytes/13allocations; Jupiter116,413,786bytes/14; Detailed Earth
228,261,893bytes/14; Efficient Earth60,489,733bytes/14, below64MiB. First Jupiter
promotion took263.64ms after real selection, including UI/transfer/decode.
This single run is not a general latency or FPS measurement. Texture admission
excludes render targets, Takram LUTs, CPU bitmap storage and driver overhead;
it is not measured total VRAM. No physical iPhone or owner acceptance claim.

From repository root, executed through Windows Node:

```sh
solar_script=$(wslpath -w "$PWD/scripts/validation/verify_solar22_streaming.mjs")
solar_output=$(wslpath -w "$PWD/output/playwright/solar-system-2.2/streaming-run2")
'/mnt/c/Program Files/nodejs/node.exe' "$solar_script" http://127.0.0.1:4231 "$solar_output"
node --check scripts/validation/verify_solar22_streaming.mjs
git diff --check
```

All commands passed. Script guards Windows, visible headed Edge and RTX3060;
network/decode barriers are disclosed controls, not synthetic rendering data.

Initial run had5harness failures and1pass; full receipt/screenshots remain at
`output/playwright/solar-system-2.2/streaming-run1/`. Exact corrections:

- Readiness now waits for real motion/ITRS/Eros availability and LUT completion;
  the initial comparison incorrectly treated unavailable→available Eros source
  initialization as a source mutation.
- Existing Takram code calls `reader.cancel()` after completed reads. Edge can
  report that stream as `net::ERR_ABORTED`. Only the exact table URL with200
  response, matching binary length,8,527,872 validated lookup bytes and finite
  completion time is recorded as expected completed-stream cancellation. Other
  aborts/errors remain failures. Explicit injected503/cancelled Saturn requests
  are separately retained as expected failures.

No application change was made for these harness corrections. Browser closed and
exclusive access returned to root after the successful run.
