# Earth cinematic integration

Owner-authorized presentation around the qualified Cesium runtime, stacked on the shared cinematic foundation. Exact approved reference: [Earth original PNG](../../design/cinematic-references-2026-10-21/earth-cinematic.png); [Adaptive Explorer](../../design/adaptive-explorer-r1a/evidence/earth-desktop.png).

The Hub now shares compact branded mode selection, glass materials, contextual left navigation tools and centered direct address/place/coordinate search. A separate selected-location card remains visible when search results are closed, and expands to source/context limitations. Mobile keeps existing sheets and 44px controls. Existing provider/API/science/scroll/native imagery/runtime behavior is preserved.

Supporting qualification: `npm --prefix frontend test`: 312 passed /47 files; `npm --prefix frontend run typecheck`: PASS; `npm --prefix frontend run build -- --outDir ../output/cinematic-earth/hub`: PASS with existing chunk-size warning. New selected-location test reproduced missing card before implementation then passed. Runtime/browser qualification pending. This initial implementation commit is not a readiness or visual-acceptance claim.

Before screenshots: task-local `output/playwright/cinematic-before/` (1440×900 and390×900, Earth/Sky). Browser runner: `scripts/validation/verify_cinematic_earth.mjs` uses native camera state and source-matched route; no fake provider response.

Remaining visual gaps: native source imagery and camera framing remain authoritative rather than the impossible concept composition; no decorative city lights/cloud weather/terrain or unsupported location metadata was added. Physical mobile/GPU performance and owner visual acceptance remain open. No paid provider, merge or deployment.
