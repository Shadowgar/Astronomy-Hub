# Sky cinematic integration

Separate Hub presentation package stacked on Earth/shared foundation. Owner-approved originals: [Sky cinematic PNG](../../design/cinematic-references-2026-10-21/sky-cinematic.png) and [Adaptive Explorer](../../design/adaptive-explorer-r1a/evidence/sky-desktop.png).

Compact shared brand, existing visible native object/catalog search, contextual Observe/Tonight/native constellation-settings tools, selected-object details, observer and scene-time surfaces use one product language. The existing contained Stellarium sky, source positions/selection/focus, scientific APIs, native settings, Pennsylvania landscape and accepted transitions remain unchanged. Location copy correctly identifies the illustrative, unsurveyed Pennsylvania horizon.

The qualified native search is reused directly. An initial redundant Hub API search field was visually identified over the native search and removed; its unused parser/tests were also removed. No new search data path or native renderer patch remains. The native search retains its existing source-backed catalog/identity and provider/error behavior.

Supporting checks after removing the redundant field:312 frontend tests/47files passed, TypeScript/build PASS (existing chunk warning). Native browser qualification of the single-search final presentation is in progress; visual acceptance remains pending. The earlier alternate-search run remains historical and does not qualify the final field.

Runner `scripts/validation/verify_cinematic_sky.mjs` uses the actual `.oras-workspace-search input` in the native frame, checks native selection/camera movement, unchanged UTC/observer/panorama, short/mobile layouts, collapsed/expanded panels and native settings.

A prior harness expected a persistent tracking lock for every reduced-motion star focus. Source inspection of `runtimes/sky-adapter/plugin.js` proves native duration0 `pointAndLock` clears non-satellite locks; the qualified sub-frame workaround applies only to satellites. Final assertions require actual native selection and camera movement without inventing a tracking claim. Native source was unchanged.

Known visual gaps: real epoch, position, illumination and native asset availability differ from the illustrative sky concept. No nebula backdrop, relocated object, fake Jupiter/moon composition, weather or terrain is introduced. SwiftShader is not physical GPU/device qualification. No merge/deploy/R4.
