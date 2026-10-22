# Sky cinematic integration

Separate Hub presentation package stacked on Earth/shared foundation. Owner-approved originals: [Sky cinematic PNG](../../design/cinematic-references-2026-10-21/sky-cinematic.png) and [Adaptive Explorer](../../design/adaptive-explorer-r1a/evidence/sky-desktop.png).

Compact shared brand, existing visible native object/catalog search, contextual Observe/Tonight/native constellation-settings tools, selected-object details, observer and scene-time surfaces use one product language. The existing contained Stellarium sky, source positions/selection/focus, scientific APIs, native settings, Pennsylvania landscape and accepted transitions remain unchanged. Location copy correctly identifies the illustrative, unsurveyed Pennsylvania horizon.

The qualified native search is reused directly. An initial redundant Hub API search field was visually identified over the native search and removed; its unused parser/tests were also removed. No new search data path or native renderer patch remains. The native search retains its existing source-backed catalog/identity and provider/error behavior.

Supporting checks after stacking on Solar/Earth:316 frontend tests/48files passed, TypeScript/build PASS (existing chunk warning). Actual single-search final-layout native browser9/9 groups PASS across1440×900,390×900 and667×390. Visual acceptance remains pending. The earlier alternate-search run remains historical and does not qualify the final field.

Runner `scripts/validation/verify_cinematic_sky.mjs` uses the actual `.oras-workspace-search input` in the native frame, checks native selection/camera movement, unchanged UTC/observer/panorama, short/mobile layouts, collapsed/expanded panels and native settings.

A prior harness expected a persistent tracking lock for every reduced-motion star focus. Source inspection of `runtimes/sky-adapter/plugin.js` proves native duration0 `pointAndLock` clears non-satellite locks; the qualified sub-frame workaround applies only to satellites. Final assertions require actual native selection and camera movement without inventing a tracking claim. Native source was unchanged.

Known visual gaps: real epoch, position, illumination and native asset availability differ from the illustrative sky concept. No nebula backdrop, relocated object, fake Jupiter/moon composition, weather or terrain is introduced. SwiftShader is not physical GPU/device qualification. No merge/deploy/R4.

## Matched acceptance evidence

[Desktop before](screenshots/1440-before.png) · [Desktop selected before](screenshots/1440-before-selected-collapsed.png) · [Desktop selected after](screenshots/1440-after-selected-collapsed.png) · [Desktop expanded](screenshots/1440-after-selected-expanded.png) · [Mobile before](screenshots/390-before.png) · [Mobile selected before](screenshots/390-before-selected-collapsed.png) · [Mobile selected after](screenshots/390-after-selected-collapsed.png) · [Mobile expanded](screenshots/390-after-selected-expanded.png) · [Short-screen](screenshots/667-after-selected-collapsed.png). Native-settings and initial-state captures for all3sizes are also preserved.

Before screenshots are actual b68e2b40 at4211; after is actual Sky73ffa4f4 source at4214 (source hashes recorded; subsequent evidence-only rebase adds inherited Solar/Earth history). The Sirius identity and2026-02-28UTC match before/after. Native target position and camera remain scientific rather than artistic.

Intermediate duplicate-search capture is explicitly historical and corrected: [duplicate field](screenshots/1440-intermediate-duplicate-search.png). Final current proof is evidence/current-native.json; the prior lock failure remains evidence/red-lock-assumption.json, labeled as a harness assumption rather than fabricated success. Final native checks verify actual stable identity, camera movement, frozenUTC, observer, Pennsylvania panorama, collapsed/expanded panels, native observing settings and oneiframe. They do not claim renderercleanup/WebGL/iframekeyboardtrap/physicalGPU coverage; the final integration package owns those additional gates.

| Target | Implemented / remaining gap |
|---|---|
| Shared product language | Compact sharedbrand, glassmaterials, contextual observing tools and right selected-object card |
| Native search/settings | Existing full native catalog search and constellation/settings reused; redundant Hub API field removed |
| Actual sky | Real epoch/positions/illumination/qualified sources preserved; no arbitrarynebula art or movedplanets |
| Selected details | Sourceidentity/facts/focus, compact/expanded desktopcard and existing mobile bottomsheet |
| Credits/layout | Desktop observerbutton overlaps nativecredits after composition moves it down; reported to root for final integration sizing correction. Nativecredits are preserved unchanged |
| Accessibility |44px newobservingtools, existingtouch/sheets/reducedmotion preserved. Shared32pxmodebutton and nativeiframeTab/chooserEscape concerns are owned by finalintegration review/correction, not waived here |
| Performance | SoftwareChromium/touch emulation only; no fresh hardwareGPU/mobilefps claim |

Exact commands: `npm --prefix frontend test` (316/48); `npm --prefix frontend run typecheck` (PASS); `npm --prefix frontend run build -- --outDir ../output/cinematic-sky/hub` (PASS with existing chunk warning); `CIN_SKY_OUT=output/playwright/cinematic-sky-current timeout 180s node scripts/validation/verify_cinematic_sky.mjs` (9groups PASS, actual current layout).
