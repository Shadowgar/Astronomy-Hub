# Earth cinematic integration

Owner-authorized presentation around the qualified Cesium runtime, stacked on the shared cinematic foundation. Exact approved reference: [Earth original PNG](../../design/cinematic-references-2026-10-21/earth-cinematic.png); [Adaptive Explorer](../../design/adaptive-explorer-r1a/evidence/earth-desktop.png).

The Hub now shares compact branded mode selection, glass materials, contextual left navigation tools and centered direct address/place/coordinate search. A separate selected-location card remains visible when search results are closed, and expands to source/context limitations. Mobile keeps existing sheets and 44px controls. Existing provider/API/science/scroll/native imagery/runtime behavior is preserved.

Supporting qualification: `npm --prefix frontend test`: 312 passed /47 files; `npm --prefix frontend run typecheck`: PASS; `npm --prefix frontend run build -- --outDir ../output/cinematic-earth/hub`: PASS with existing chunk-size warning. New selected-location test reproduced missing card before implementation then passed. Actual native desktop/mobile each6/6 groups passed before the final compact-only sizing adjustment; source paths for those viewports are unchanged. Fresh compact667×3906/6 PASS follows two reproduced overlap fixes. See evidence/prior-bounded.json (top-level FAIL honestly retains the then-failing short case) and evidence/short-current.json (PASS). These are scoped source-path qualification, not a claim that the earlier full run passed or that all cases reran on the final bundle. Final integrated branch qualification is a separate gate. Visual acceptance remains pending.

Before screenshots: task-local `output/playwright/cinematic-before/` (1440×900 and390×900, Earth/Sky). Browser runner: `scripts/validation/verify_cinematic_earth.mjs` uses native camera state and source-matched route; no fake provider response.

Remaining visual gaps: native source imagery and camera framing remain authoritative rather than the impossible concept composition; no decorative city lights/cloud weather/terrain or unsupported location metadata was added. Physical mobile/GPU performance and owner visual acceptance remain open. No paid provider, merge or deployment.

## Visible comparison and exact incomplete evidence

[Desktop before](screenshots/1440-before.png) · [Desktop selected](screenshots/1440-after-selected-collapsed.png) · [Desktop expanded](screenshots/1440-after-selected-expanded.png) · [Mobile before](screenshots/390-before.png) · [Mobile selected](screenshots/390-after-selected-collapsed.png) · [Mobile expanded](screenshots/390-after-selected-expanded.png) · [Short-screen selected](screenshots/667-after-selected-collapsed.png). Sources, native Sky returns and initial states are also retained in screenshots/. Baseline is actual b68e2b40 at4211; after is actual isolated Earth preview4213, fixed2026-02-28UTC epoch. Source hashes are recorded separately.

Two real compact bugs were reproduced: selected location card covered searchClose; compact toolbarSources was behind the search field. Results now own their surface while open; compact map tools and the scrollable location card use separate screen areas. The initial heading timeout was a harness mismatch (`Diagnostics` versus actual `Sources & display quality`), not an application failure. No unknown timeout is relabeled as PASS.

| Target | Implemented / remaining gap |
|---|---|
| Compact brand/search/tools | Shared brand, centered desktop search, contextual left tools; mobile permanent search and source access |
| Selected context | Independent collapsed/expanded coordinate/location card; no invented population/elevation/weather/gallery |
| Concept globe/night lights | Qualified native Cesium imagery/camera preserved; source tile coverage/age and lighting differ from illustrative concept |
| Time/navigation | Real native camera destination and keyboardzoom, frozen sceneUTC retained; Earth live source times remain distinct |
| Mobile/GPU | Actual Chromium touch emulation and compact screenshots; no physical-device or GPU performance claim |

Commands: `npm --prefix frontend test`; `npm --prefix frontend run typecheck`; `npm --prefix frontend run build -- --outDir ../output/cinematic-earth/hub`; `CIN_EARTH_OUT=output/playwright/cinematic-earth-corrected timeout 240s node scripts/validation/verify_cinematic_earth.mjs` (desktop/mobile PASS, reproduced compactSources overlap); `CIN_EARTH_SIZES='[[667,390]]' CIN_EARTH_OUT=output/playwright/cinematic-earth-short-final timeout 100s node scripts/validation/verify_cinematic_earth.mjs` (affected compact6/6 PASS).

After stacking onto Solar9e7f2336: `npm --prefix frontend test`316 passed/48files; `npm --prefix frontend run typecheck`PASS. Native Earth/Sky source and approved images remain unchanged. Fresh cross-mode integrated preview qualification is owned by the final integration package.

Matched baseline selected-state captures from actual b68e2b40 at4211: [desktop collapsed](screenshots/1440-before-selected-collapsed.png), [desktop expanded](screenshots/1440-before-selected-expanded.png), [mobile collapsed](screenshots/390-before-selected-collapsed.png), [mobile expanded](screenshots/390-before-selected-expanded.png). All use the same41.321903,−79.585394 coordinate destination and frozen2026-02-28UTC as after captures.
