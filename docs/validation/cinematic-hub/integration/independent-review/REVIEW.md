# Independent technical review: complete cinematic Hub

Reviewed runtime/source HEAD: 34eb8f08392a1886ac409e39d3f50938c0491ac6. Foundation bdd0e0a0, Solar9e7f2336, Earth59fd9f0f, Sky9eb60f09. Final documentation-only SHA follow-up pending.

No unresolved actionable technical finding after reproduced fixes. Owner visual acceptance and physical-device performance remain open. The approved images are presentation references, never ephemeris references. Review is not an external GitHub approval. No merge or deployment performed.

## Source and science

47 Default review-pack documents loaded (context.txt). Foundation source and updated authority reviewed; no unrelated documents scanned. Independent typecheckPASS; foundational12testsPASS; frozenSolar22focusedtests/5filesPASS; architecture61docs1698references, reconciliation67capabilities457links and four exact original PNG/archive hashesPASS.

All16 new independent Horizons fixture rows parsed against raw SOE values exactly. Request UT, ICRF FRAME, Sun10 origin, NONE correction, AU-D and targets199/299/399/4..8 match local evaluation. HorizonsDE441 differs from pinnedDE442s; documented1500km outer comparison envelope is a regression ceiling, not measured accuracy or same-model precision qualification. Bodycenter/barycenter mapping explicit. No source positions edited. Aggregate belt rotated J2000ecliptic→ICRF, no identity/epoch/individual asteroid ephemeris claims. Existing NASA Earth/cloud/Mars assets/UV remain unchanged. New authored shader/ring/belt resources are owned/disposed with scene; native renderers remain isolated.

## Reproduced findings and fixes

1. NativeiframeTab target still queried removed brand selectors. Original4213 same5s actual-focus predicate fails, focus remains iframe (tab-original-red.json). Integrated4216 same predicate passes (repro-green.json). Initial250ms check was scheduling-ambiguous and retained separately.
2. Open mode chooser Escape also dismissed underlying Sources panel. Actual RED heading disappeared; corrected open-state capture exclusion preserves panel, returns focus, and secondEscape dismisses panel. repro-red.json / repro-green.json and screenshots.
3. Root fulljourney separately reproduced Earthsearch overlay intercepting mobilemodeoptions; reviewer now independently verifies allthree menuoption center hitboxes clear across allnine viewport/mode combinations, including selectedEarth search andcard.
4. Root44px correction independently verified actualchooser width/height >=44 across allnine combinations. Nativecredits andobserver controls do not overlap in allthree Sky sizes.

## Actual browser scope and synchronization limits

18 review check groups passed across9 mode/viewport combinations at1440x900,390x900,540x390. This is a collection of scoped runs, not one uninterrupted fullsuitepass.

- final/proof.json: initialdesktopSolar/EarthPASS. Following nativeSirius text wait expired15s; mechanismUNKNOWN. Separate diagnostic then recorded API200, realcatalogresult and visibleDOM with noJSerrors (sky-search-diagnostic.json).
- final-sky-desktop/proof.json: APIresponse-synchronized desktopSkyPASS. Native Sirius source direction converted ICRF→VIEW is [1.19e-13,2.18e-13,-1,0], correctly centered. Exact UTC, observer, sourceidentity and Pennsylvania panorama retained.
- final-mobile-short/proof.json: five combinationsPASS (all390;Solar/Earth540). ShortSky instant-after-click direction assertion sampled before asynchronous native focus settled.
- final-sky-short/proof.json: nativepointing predicate awaited within5s; shortSkyPASS, correctly centered. This demonstrates the prior instant assertion raced asynchronous acknowledgment; no app runtime/math change or timeout increase.

Current screenshots include selectedcollapsed/expanded states and visible mode/time controls. NativeTab, popupEscape, realEarthcoordinate destination, nativeSky identity/pointing, popupsearchclearance and attributionclearance passed. Original b68Earth/Sky667x390 shortbaseline was freshly captured on preserved4211 (baseline-short.json), explicitly historicalsource rather than currentqualification.

## Bounded interaction performance

24 realcamera steps perrun (Solar orbitbuttons; Earth nativewheel zoom; Sky adapterzoom), with per-step nativecamera samples proving movement. All six preserve exactUTC; Solar sourcepositions/target/selectedEarth unchanged; Sky observer/selection/Pennsylvania unchanged. Earth zoom camera/ground intersection evolves as native navigation intends.

| Mode | Viewport | RAF interval median ms | p95 ms |
| --- | --- | --- | --- |
| solar | 1440x900 | 98.3 | 140.8 |
| earth | 1440x900 | 616.3 | 824.6 |
| sky | 1440x900 | 46.9 | 62.5 |
| solar | 390x900 | 40.9 | 66.2 |
| earth | 390x900 | 255.2 | 438.9 |
| sky | 390x900 | 22.0 | 25.6 |

Allsix report ANGLE/Vulkan SwiftShader. EXT_disjoint_timer_query and WebGL2variant unavailable; GPUms is null. These RAF intervals include browser/render scheduling during fixed interactions, not GPU timings or physical-device qualification. They expose slow Earth software rendering; no60fps/hardware performance claim. SolarCPU submission time in diagnostics is separate from RAF intervals. See performance.json and exact executedperformance.mjs. No background workload/resource/service changes.

## Remaining acceptance limits

Procedural planet/ring detail, aggregatebelt-only selection, true-scaleFull overview and short-screen sheet use remain documented visual/scientific limits. Inspected shortSky expanded sheet consumes mostscene; owner should judge this visible tradeoff against approvedreference. Source-backed point remains correctly centered, potentially behind native landscape when belowhorizon; it is not relocated for composition. Original images/data/accepted mechanics protected by source and rootdeliveryverifier; hardwareGPU/mobile and ownervisualacceptance are not inferred from greenchecks.
