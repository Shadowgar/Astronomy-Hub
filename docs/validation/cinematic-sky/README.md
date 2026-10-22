# Sky cinematic integration

Separate Hub presentation package stacked on Earth/shared foundation. Owner-approved originals: [Sky cinematic PNG](../../design/cinematic-references-2026-10-21/sky-cinematic.png) and [Adaptive Explorer](../../design/adaptive-explorer-r1a/evidence/sky-desktop.png).

Compact shared brand, visible object/catalog search, contextual Observe/Tonight/native constellation-settings tools, selected-object details, observer and scene-time surfaces use one product language. The existing contained Stellarium sky, source positions/selection/focus, scientific APIs, native settings, Pennsylvania landscape and accepted transitions remain unchanged. Location copy now correctly identifies the illustrative, unsurveyed Pennsylvania horizon.

Search reuses `/api/sky/search` and the existing native identity/selection/focus adapter. It preserves string source IDs, rejects incomplete/external/mismatched identities, aborts obsolete requests, bounds search to15seconds, handles provider errors and empty results. API object search is distinct from the native observing controls; unsupported catalog queries do not fabricate objects or visibility.

Supporting checks: `npm --prefix frontend test`:313 passed/48files; `npm --prefix frontend run typecheck`:PASS; `npm --prefix frontend run build -- --outDir ../output/cinematic-sky/hub`:PASS with existing chunk warning. Stable-link parser test reproduced the actual `/skysource/` route mismatch before correction then passed. Real Sirius API identity/path was inspected. Actual browser qualification pending; this initial source commit does not claim readiness or visual acceptance.

Runner `scripts/validation/verify_cinematic_sky.mjs` checks native selection/lock, unchanged UTC/observer/panorama, short/mobile layouts, collapsed/expanded panels and native settings. Exact matching screenshots and gaps follow runtime qualification.

Known visual gaps: real epoch, position, illumination and native asset availability differ from the illustrative sky concept. No nebula backdrop, relocated object, fake Jupiter/moon composition, weather or terrain is introduced. SwiftShader is not physical GPU/device qualification. No merge/deploy/R4.
