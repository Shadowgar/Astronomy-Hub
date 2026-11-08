# Solar 2.6 cold-entry performance qualification

Status: root cause reproduced and the minimal correction verified on the owner
Windows Edge / NVIDIA RTX 3060 Laptop path. A different agent completed the
[independent correction review](PERFORMANCE_INDEPENDENT_REVIEW.md), with no open
P0/P1/P2 finding in this bounded change.
This is a focused mission initialization correction, not a claim that all cold
startup stalls or Solar 2.6 qualification are complete.

## Authority and scope

The owner Solar 2.6 directive authorizes correcting cold stalls without lowering
quality. Starting branch `recovery/reconcile-20261026`, SHA
`66050b5e7f3a9cbcfccbf6258645bd1804051b28`, existing draft PR107. The root/frontend
instructions, CORE_CONTEXT, LIVE_SESSION_BRIEF, `solar_reconstruction` manifest,
canonical validation and renderer architecture, and the prior Solar 2.5
validation/performance records apply; see [PLAN.md](PLAN.md) for context inventory.
No unrelated document pack was loaded. The systematic-debugging workflow was
used: capture the actual failure, isolate its native/program calls, write a
failing regression against that trace, then change only the proven cause.

No model, texture, source vector, scientific frame, renderer resolution, shadow
resolution, HDR policy, dependency, native engine or navigation design changed.
The preview/container configuration and protected data were preserved by the
integrating agent. All test browser processes are explicitly closed.

## Reproduction and cause

Solar 2.5 had retained a 506.8 ms cold frame / 611 ms main-thread task. Three fresh
headed Edge processes against the unchanged Solar 2.5 preview reproduce the
problem. The uninstrumented run records a 563.2 ms maximum RAF gap, 691 ms startup
task, 473 ms first-render task and 1766.4 ms readiness. A second diagnostic run
records individual WebGL programs and their parallel-completion polls.

`frontend/src/features/missions/MissionScene.ts:29` prepares a scene with
`sunlight.castShadow = !!model`. In the original `draw()` at line64, the light was
changed to `castShadow = craft.visible`. The physically scaled craft is unresolved
in the encounter overview, so this removed the shadow define from every affected
scene shader after parallel preparation. Programs20–24 were linked and used
without a completion poll; the background and Jupiter programs block146.5ms and
211.5ms respectively in `getProgramInfoLog`. That diagnostic query is the first
use synchronization point, not the underlying defect. Disabling shader diagnostics
would conceal the wait instead of preserving the prepared shader variants.

The fix keeps `castShadow` constant for the scene lifetime and changes only
`sunlight.shadow.autoUpdate` / `needsUpdate` according to physical craft visibility.
Three r180's `WebGLShadowMap` skips both shadow allocation and draw work when those
two flags are false. The craft still receives and casts the existing1024×1024
self-shadow when visible. Diagnostic `selfShadow` continues to describe actual
visible self-shadowing; `shadowConfigured` and `shadowUpdates` expose the stable
configuration and gated work independently.

## Attribution boundaries

Instrumented timings are diagnostic evidence, not substituted for plain timings.
The program trace separates the major contributors:

| Contributor | Observed baseline | Interpretation |
| --- | ---: | --- |
| Native `getContext('webgl2')` |375.3ms | Synchronous browser/ANGLE context initialization remains. |
| First `EXT_texture_filter_anisotropic` query |139.7ms | Native extension/driver initialization remains. |
| First-render program diagnostics |424.9ms total,211.5ms maximum | Unprepared shader variants caused by the shadow toggle; corrected scope. |
| Source model decode timers |31.1ms and36.7ms | Source model processing; no model reduction is justified. |
| Texture `texSubImage2D` |9.5ms total,2.7ms maximum | Uploads are not the dominant observed stall. |
| Trace `EvaluateScript` |13.8ms total,7.5ms maximum | Observed JavaScript evaluation is not the dominant stall. |
| Parallel shader preparation |273.9ms elapsed | Already asynchronous; original first draw discarded five prepared variants. |
| First render |433.4ms CPU | Predominantly the unprepared program synchronization above. |

React invokes the mount, but the recorded native WebGL calls explain the large
mount work. No evidence supports a React rewrite, model simplification, shader
error suppression, texture downsampling or disabling HDR. Eliminating the native
context stall itself would require a separately qualified architecture change;
this correction does not claim that result. Fresh browser processes/contexts do
not flush Windows driver or backend caches and are not machine-cold proof.

## Actual candidate results

The integrating agent built and exported the Docker candidate to the existing
private preview at `localhost:4231`, preserving the original Solar 2.5 build at
`solar25.localhost:4231`. The source/data backends were unchanged. Candidate also
contains optional camera distance limits for the new Beyond workspace; mission
defaults remain unchanged. The preview stayed frozen during these checks.

| Measurement | Original Solar 2.5 | Corrected candidate |
| --- | ---: | ---: |
| Unprepared programs before first ready, diagnostic trace |5 |0 |
| First-render CPU, diagnostic trace |433.4ms |27.0ms |
| First-render CPU, uninstrumented fresh browser |472.4ms,418.1ms |24.0ms |
| First-render long task, plain |473ms,418ms |None reported |
| Native/mount long task, plain |691ms,630ms |637ms |
| Maximum RAF gap, plain |563.2ms,451.4ms |520.9ms |
| End-to-end readiness, plain |1766.4ms,1656.3ms |1623.6ms |

The repeated baseline run used the preserved original build after the candidate
run. These few samples demonstrate the eliminated first-render recompilation;
they do **not** establish a statistically reliable overall cold-start speedup.
Native initialization still dominates the maximum frame and remains an explicit
limitation. The candidate diagnostic trace records412.5ms inside `getContext`
and133ms for the first anisotropy extension query. Shader info-log synchronization
falls from424.9ms total /211.5ms maximum to24.3ms /7ms, including the later first
model inspection.

Four models pass three encounter ↔ inspection cycles each, retaining the same
renderer, model mesh counts5/5/15/6 and stable texture/geometry counts after the
first inspection. Shadows stay active in inspection and stop updating when the
craft is unresolved. Four Solar returns retire the mission renderer with zero
owned resources and zero active animation loops. Twelve actual screenshots cover
1440×900,390×844 and844×390. The matched Voyager before/after screenshot is
byte-for-byte identical, SHA256
`a13fb0636f13fd7f76e62de0c3f951e105c2ebe08cf36b0730039b79e6672235`.

The existing actual pending-model context-loss, initial trajectory action,
full-path Back and selected-interval Back checks pass4/4. The focused warm
four-model benchmark passes12cases,70warmup plus200measured orbit frames each:
2,400measured frames, actual GPU median0.253–0.986ms, p95≤1.548ms; RAF median6.9ms,
p95≤7.1ms. Prior Solar2.5 GPU median0.268–0.733ms/p95≤1.169ms is retained as
historical context; individual GPU samples vary and are not a controlled
machine-cold comparison. Neither run shows a frame-budget regression in its
qualified viewport/model cases. No page/shader errors occurred.

[Bounded evidence and artifact hashes](evidence/mission-performance.json) include
all six cold runs, raw trace hashes, program identities, actual lifecycle and
warm diagnostic receipts. Full traces remain in ignored `output/`; they are not
replaced or discarded. [Before](performance-gallery/baseline-voyager1-inspection.png)
and [after](performance-gallery/candidate-voyager1-inspection.png) are unchanged
actual browser captures.

| Model | Desktop | Portrait | Landscape |
| --- | --- | --- | --- |
| Voyager1 |[image](performance-gallery/voyager1-desktop.png) |[image](performance-gallery/voyager1-portrait.png) |[image](performance-gallery/voyager1-landscape.png) |
| Voyager2 |[image](performance-gallery/voyager2-desktop.png) |[image](performance-gallery/voyager2-portrait.png) |[image](performance-gallery/voyager2-landscape.png) |
| Cassini |[image](performance-gallery/cassini-desktop.png) |[image](performance-gallery/cassini-portrait.png) |[image](performance-gallery/cassini-landscape.png) |
| New Horizons |[image](performance-gallery/newhorizons-desktop.png) |[image](performance-gallery/newhorizons-portrait.png) |[image](performance-gallery/newhorizons-landscape.png) |

## Focused regressions

The actual program regression initially fails with five unprepared first-frame
programs, preserved at
`output/playwright/solar-system-2.6/performance/baseline-programs/prepared-regression.txt`.
The trace/capture harness bounds traces to64MiB, keeps original evidence, and
asserts actual RTX3060 hardware, loaded model, active inspection self-shadow and
zero shader/page errors. Candidate runs verify repeated overview ↔ inspection
transitions, fixed model/resource identity, renderer disposal, portrait/landscape
output and the existing pending-model context-loss behavior.

Commands completed before candidate runtime testing:

```sh
node scripts/validation/verify_solar26_prepared_programs.mjs output/playwright/solar-system-2.6/performance/baseline-programs/cold.json
npm --prefix frontend test -- tests/missionContracts.test.ts tests/missionPrecision.test.ts tests/missionReview.test.ts tests/solarShaderPreparation.test.ts tests/solarAssets.test.ts
npm --prefix frontend run type-check
node --check scripts/validation/profile_solar26_cold.mjs
node --check scripts/validation/verify_solar26_prepared_programs.mjs
node --check scripts/validation/verify_solar26_shadow_continuity.mjs
git diff --check
```

Results: actual baseline regression **FAIL as expected**;34tests/5files **PASS**;
typecheck, harness syntax and whitespace **PASS**. The reused shader preparation
tests include cancellation while pending, pre-abort, supported/unsupported
parallel compilation, synchronous failure and bounded timeout without continued
polling. No shader preparation or resource ownership logic was altered.

Actual Windows command pattern (executed from the recovery worktree):

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/profile_solar26_cold.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/candidate-programs")" http://localhost:4231 trace voyager1
node scripts/validation/verify_solar26_prepared_programs.mjs output/playwright/solar-system-2.6/performance/candidate-programs/cold.json
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/profile_solar26_cold.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/candidate-plain")" http://localhost:4231 plain voyager1
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/profile_solar26_cold.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/baseline-paired")" http://solar25.localhost:4231 plain voyager1
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar26_shadow_continuity.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/shadow-continuity")" http://localhost:4231
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_lifecycle_edges.mjs")" http://localhost:4231 "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/lifecycle")"
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/verify_solar25_performance.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/performance/warm-four-models")"
python3 scripts/validation/package_solar26_performance.py
```

All candidate commands pass. The packager records6cold runs,12warm cases,
4shadow missions,4lifecycle checks,14images and identical Voyager inspection.

Raw baseline evidence is under
`output/playwright/solar-system-2.6/performance/{baseline-plain,baseline-trace,baseline-programs}/`:
`cold.json`, actual screenshot, and for traces `cpu-profile.json` / `trace.json`.
The served Solar 2.5 entry is `index-CwsSK4Ok.js`; each receipt records its exact
SHA256. Candidate entry hashes are in the bounded receipt. The separate
correction review inspected and reran the retained actual-program red/green
regression; the implementation author did not approve their own fix.
Physical iPhone, owner visual acceptance, native-context stall
elimination and whole-PR/source-release approval remain outside this evidence.

## New Beyond scene: actual device qualification

After the integrated candidate was rebuilt and frozen, a separate bounded run
measured the two most involved new visualizations: the transparent conceptual
heliosphere and the theoretical Oort display. Each view used a fresh headed
Windows Edge process on the same RTX3060 hardware. Each viewport received70warmup
and200measured keyboard-orbit frames. This is6cases /1,200measured frames; it does
not repeat the mission journey suite.

| View / viewport | GPU median / p95 | RAF median / p95 | CPU render median / p95 |
| --- | --- | --- | --- |
| Heliosphere desktop |1.186 /1.219ms |6.9 /7.0ms |0.7 /1.0ms |
| Heliosphere portrait |0.503 /0.537ms |6.9 /7.0ms |0.6 /0.9ms |
| Heliosphere landscape |0.568 /0.629ms |6.9 /7.0ms |0.6 /0.9ms |
| Oort desktop |0.807 /0.836ms |6.9 /7.0ms |0.5 /0.9ms |
| Oort portrait |0.367 /0.427ms |6.9 /7.0ms |0.5 /0.7ms |
| Oort landscape |0.468 /0.589ms |6.9 /7.0ms |0.5 /0.7ms |

All cases pass with one renderer loop and zero shader/page errors. CPU summaries
are the scene's bounded rolling samples; desktop/portrait include startup draws,
and are not identical to the explicit200-frame RAF window. Maximum measured RAF
gap is7.1ms. Admitted geometry typed buffers total378,340bytes against64MiB;
this is neither total driver VRAM nor the HDR target allocation. The scene owns
no new source textures. Geometry, compositor and owner lifecycle remain separate.

Cold readiness is1078.6ms for heliosphere and1024.1ms for Oort. Maximum cold RAF
gaps are527.8ms /430.6ms, with650ms /632ms startup long tasks. These uninstrumented
measurements show that cold responsiveness is still limited; no hitch-free or
machine-cold claim is made. The separate mission trace attributes its native
initialization costs; the new scene run does not pretend to separately attribute
every native call without tracing it.

```sh
'/mnt/c/Program Files/nodejs/node.exe' "$(wslpath -w "$PWD/scripts/validation/profile_solar26_beyond.mjs")" "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/beyond-performance")" http://localhost:4231
```

[Exact new-scene metrics, served hashes and artifact receipts](evidence/beyond-performance.json).
Actual captures after the measured orbit include
[heliosphere desktop](performance-gallery/heliosphere-desktop.png),
[portrait](performance-gallery/heliosphere-portrait.png),
[landscape](performance-gallery/heliosphere-landscape.png),
[Oort desktop](performance-gallery/oort-desktop.png),
[portrait](performance-gallery/oort-portrait.png) and
[landscape](performance-gallery/oort-landscape.png).
These are software/device qualification outputs, not owner visual acceptance.
