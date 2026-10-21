# PR83 visual refinement — owner review pending

**FOCUSED FUNCTIONAL QUALIFICATION PASSED. VISUAL ACCEPTANCE PENDING. DRAFT — DO NOT MERGE OR DEPLOY.**

Branch `r3-a-cinematic-solar-1`; continuation from reviewed `23806bcaff704b13bcf54eaf898e306e4f51e3af` on existing PR83, base PR82 `7aaeeef4`. No new design direction, R3-B/R4, upstream renderer edits, paid services, dependencies or production changes. The PR83→82→81→80→79→78→74→73 stack remains; PR71 stays independent. N1 remains OWNER ACCEPTED. Historical partial N1 and broad R3 backend results are retained as historical, not relabeled.

[Working Docker preview](http://127.0.0.1:4211/solar-system?date=2026-02-28T00:00:00Z) · [Interactive reference/before/after comparison](http://127.0.0.1:4211/evidence/solar-refinement/comparison.html) · [versioned comparison HTML](comparison.html) · [exact changed files](FILES_CHANGED.txt) · [commands](COMMANDS.md).

## Context and scope

Default Mode CORE_CONTEXT/LIVE_SESSION_BRIEF followed by the `docs_change`, `frontend_change`, `planning`, `validation`, `review`, `reconciliation` packs: [64-document inventory](evidence/context.json). Requested primary/Adaptive reference and cinematic evidence were explicit additions; no full docs scan or unrelated documents. The owner explicitly authorized continuation of PR83, superseding older next-new-branch wording. [Bounded execution plan](PLAN.txt).

The original [primary](../../../design/cinematic-references-2026-10-21/solar-primary-cinematic.png) and [Adaptive Explorer](../../../design/cinematic-references-2026-10-21/solar-adaptive-explorer.png) PNG bytes are unchanged and verified against the approval manifest. All four PNGs and archive remain protected.

## Reference/actual comparison and remaining gaps

All before images were captured fresh this pass from unchanged reviewed 23806bca at 4211 before replacing its preview. After images are actual WebGL from the refined source at the same UTC **2026-02-28 00:00**, same **1440×900 / 390×900** viewports and selected-body states. Camera composition intentionally changed; no identical-camera, pixel-perfect or owner acceptance claim. Images are original captures, not edited composites. [Before diagnostics](evidence/baseline.json), [after diagnostics and image hashes](evidence/refinement.json).

| State | Desktop before | Desktop refined | Mobile before | Mobile refined |
| --- | --- | --- | --- | --- |
| Overview | [Before](screenshots/before-1440-overview.png) | [Actual](screenshots/after-1440-overview.png) | [Before](screenshots/before-390-overview.png) | [Actual](screenshots/after-390-overview.png) |
| Earth selected | [Before](screenshots/before-1440-earth.png) | [Actual](screenshots/after-1440-earth.png) | [Before](screenshots/before-390-earth.png) | [Actual](screenshots/after-390-earth.png) |
| Mars selected | [Before](screenshots/before-1440-mars.png) | [Actual](screenshots/after-1440-mars.png) | [Before](screenshots/before-390-mars.png) | [Actual](screenshots/after-390-mars.png) |

Sun close-up: [desktop](screenshots/after-1440-sun-close.png), [mobile](screenshots/after-390-sun-close.png). Earth close-up: [desktop](screenshots/after-1440-earth-close.png), [mobile](screenshots/after-390-earth-close.png). Mars close-up: [desktop](screenshots/after-1440-mars-close.png), [mobile](screenshots/after-390-mars-close.png).

| Objective | Implemented difference from reviewed baseline | Specific remaining gap / acceptance boundary |
| --- | --- | --- |
| Sun photosphere, limb, corona | Lower exposure, less clipped surface contrast, filtered small-scale granulation, limb darkening, broader separate soft corona | Procedural optical illustration. No measured solar activity, magnetic loops, prominences or spectral photometry; concept's dramatic extended flares are not reproduced. Owner must judge luminous appearance. |
| Earth atmosphere/clouds/depth | Original NASA historical cloud composite on a separate static shell; thin sunward blue rim, terminator scattering, restrained illustrative ocean reflectance | No live weather, night lights, accurate rotation, terrain or geophysical reflectance model. Shell altitude and optical coefficients are illustrative. |
| Mars | Less washed-out surface lighting, dark terminator, subdued rim, screen-space corner brackets tied to the actual globe | Original NASA atlas and matching UV mesh retained exactly; no invented craters, relief or normal-map terrain. Static orientation and system-barycenter anchor remain disclosed. |
| Environment | Spatial decorative points plus low-cost mesh-evaluated blue optical haze | Solar has **no catalog-derived stars**. All points/haze are illustrative and carry no catalog identity/magnitude/distance; native Sky remains catalog-backed. No fake galaxy/nebula objects. Haze is subtler than the primary concept. |
| Camera | Oblique overview, Earth foreground depth, selected camera's optical frame offset clear of context card, real orbit/zoom/approach | Actual ephemeris centers and trajectories are unchanged; cannot reproduce concept's body arrangement at this epoch. Sun .44/Earth .23/Mars .175 AU glyph radii are deliberately exaggerated, not physical radii. No added/reordered bodies. |
| Mobile | Collapsed card hides secondary intro/distance until expanded; larger selected globe above card; existing controls remain reachable across ten tested sizes | No approved mobile PNG exists. Very short viewports still scroll expanded details and provide less scene space. Emulated touch is not physical-device acceptance. |
| Glass HUD | Existing compact rail/time controls preserved, corner selection marks, quality choice inside existing Sources dialog | No invented search/provider tools, disabled decorative controls or concept-only surface imagery. System fonts remain; exact concept font is unlicensed. |
| Performance | One draw per explicit camera step; no idle RAF; explicit Efficient/Balanced/Detailed pixel/point/haze budgets | SwiftShader remains slow at high DPI. Hardware GPU/mobile performance and owner visual acceptance are still open. No silent scientific degradation or automatic quality changes. |

## Imagery provenance

Original Earth surface PNG and Mars GLB remain byte-identical. Added original NASA [historical cloud composite](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg): 2048×1024, 829,367 bytes; original bytes retained. NASA's [Blue Marble context](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-2181/) describes the historical composite; the legacy Visible Earth catalog URL now redirects, while the original image remains available. Credit: NASA Goddard / Reto Stöckli. [NASA usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), [exact source URLs/hashes](../../../../frontend/src/features/solar/assets/provenance.json). This is static imagery, not current weather. No generated or edited scientific images. No external runtime imagery calls or additional providers.

Failure to load clouds leaves surface imagery and scientific navigation usable, with an explicit notice: [desktop fallback](screenshots/after-1440-clouds-unavailable.png). Original Earth/Mars failure fallback, delayed assets after disposal and retry are also browser-tested.

## Fresh qualification

| Check | Result | Evidence |
| --- | --- | --- |
| Source positions, Sun/Earth/Mars framing, clouds, quality, time, real WebGL loss/retry, idle/error checks | 6/6 desktop + 6/6 mobile | [Refinement](evidence/refinement.json) |
| Cinematic scene, direct ray selection, approach, panels, source time, keyboard | 9/9 desktop + 9/9 mobile | [Cinematic](evidence/cinematic.json) |
| Compact pointer/touch targets, collapsed/expanded cards and camera actions | 40/40 groups across ten viewports | [Compact](evidence/compact.json) |
| Native real Cesium destination, Earth/Solar/Sky returns, Pennsylvania, observer/UTC, history and renderer lifetime | 14/14 desktop + 14/14 mobile | [Navigation](evidence/navigation-proof.json) |
| Asset failure/recovery, reduced motion/orientation, WebGL retry, idle and late-GLB teardown | 7/7 | [Lifecycle](evidence/lifecycle.json) |
| Native identity + history/entry races | 3 + 1 + 1 passed | [Identity](evidence/identity-proof.json), [history](evidence/history-race-proof.json), [entry](evidence/entry-race-proof.json) |
| Frontend | 310/310, 46 files | [Log](evidence/frontend-tests.log) |
| TypeScript | PASS | [Log](evidence/typecheck.log) |
| Docker scientific APIs/ephemeris | 15 passed, 2 existing skips, 2 existing deprecation warnings | [Log](evidence/docker-science.log) |
| Source reference/asset bytes | PASS | [References](evidence/references.log), [NASA assets](evidence/assets.log) |

Two new framing/quality tests first failed on absent functions (2 RED), then passed (5 including existing presentation cases). Three additional GPU-query tests exercise unsupported drivers, bounded nonblocking pending queries, disjoint invalidation and disposal; physical-driver integration is untested because the extension is unavailable here. No functional assertion failure remains. The first new browser attempt failed only because equivalent UTC strings differed (`Z` versus `.000Z`); it was corrected to compare epoch values, with failed evidence retained. An early identity verifier was invoked before the navigation proof existed; its FileNotFoundError was orchestration ordering, not a navigation failure. Final dependent checks ran after all suites completed. No timeouts were increased and no stalled N1 investigation was repeated.

Unchanged runtime/Earth 231/231 and earlier host science 7/7 are **historical source-matched evidence**, not fresh passes in this refinement. Old N1 5/22 desktop, 7/22 mobile at240s and prior R3 broad backend incompletion remain unchanged.

## Actual browser performance and texture loading

Chromium reports **ANGLE / Vulkan SwiftShader (software renderer)**. `EXT_disjoint_timer_query_webgl2` is **unsupported**: actual GPU execution milliseconds are unavailable, never inferred from CPU or RAF. Runtime diagnostics report that explicitly; supported-driver timer handling has focused tests.

Controlled same-source test: 1440×900 and390×900, DPR2, Earth focus, same48 explicit 15° orbit steps (two full revolutions), reduced motion. Each step produces exactly one render; all source vectors, epoch, target and final camera position remain unchanged after each revolution pair. CPU submission medians0.3–0.5ms; these are not rendering latency. Frame intervals include the software renderer and browser scheduling. Balanced was repeated to expose variability; no unrelated workloads were changed.

| Viewport | Quality | Render DPR | Median frame interval ms | p95 ms |
| --- | --- | --- | --- | --- |
| 1440×900 | balanced | 1.5 | 137.2 | 171.4 |
| 1440×900 | efficient | 1 | 63.4 | 82.0 |
| 1440×900 | detailed | 2 | 229.7 | 342.2 |
| 1440×900 | balanced | 1.5 | 145.0 | 182.6 |
| 390×900 | balanced | 1.5 | 49.7 | 62.3 |
| 390×900 | efficient | 1 | 30.8 | 41.2 |
| 390×900 | detailed | 2 | 82.0 | 106.7 |
| 390×900 | balanced | 1.5 | 50.5 | 62.3 |

The initial per-pixel haze iteration measured desktop Balanced185–188ms median / Detailed299ms. Moving broad haze to a bounded96×64 background mesh reduced that cost; the final table above is the delivery source. Those earlier measurements are iteration evidence, not a new baseline pass. There is no claim of60fps or physical GPU qualification.

Rendering quality is explicit in **Science, scale & sources**: Efficient caps DPR1, draws1200 decorative points and removes haze; Balanced caps1.5/4000 points; Detailed caps2/4000 points. All retain original source textures and scientific data. Quality survives epoch rebuild and WebGL retry, stays within this Solar visit, and writes no owner settings. Effects can be turned off separately. [Efficient desktop](screenshots/after-1440-efficient.png).

All three local textures have confirmed loaded state and exact served bytes: surface1,511,379, clouds829,367, Mars4,032,148. Resource transfer durations in this run: desktop surface3.9ms / clouds3.1ms / Mars712.2ms; mobile4.5 /3.6 /480.0ms. These are browser Resource Timing download measurements, not GPU upload/decode or internet-provider benchmarks. No shader/page errors; no render increments during idle; context loss destroys the old canvas, explicit Retry creates one replacement, and late assets cannot revive a disposed renderer.

## Reproduction, preservation and review

Two host builds and an independent pinned offline Docker build match **136 files**, artifact `7776afd6ebed951aa96eda357636fabe85c8825ffa895169eeb18fd88c3938da`. All **136 Hub / 514 native Earth** served files match. [Candidate receipt](evidence/candidate-delivery.json) binds source hashes, screenshots, checks and preserved identities; it explicitly precedes the final commit. The exact committed HEAD receipt and independent review will be linked in PR83 after delivery.

Baseline23806bca's135-file build is preserved separately at `output/solar-refinement/baseline-hub` with artifact9f53469f9bc36db1cda6ec8eeb8050565fef73aa924cf92263f93e5392c8d031. Original Sky/Earth artifacts, God's Eye source pin, all existing tracked rollback files, DE442s, owner settings and116 existing container identities/statuses/mounts plus90 volumes are verified unchanged. No container restarted or volume pruned. The preview continues in the existing task-owned containers. Vite's >500kB lazy-chunk advisory remains visible; no new dependency or chunk-warning suppression.

Independent final exact-head Codex review is required before handoff; the review result is separate from GitHub approval and owner visual acceptance. Stop for owner review of the revised preview. Recommended next task: owner compares the reference and actual Sun/Earth/Mars desktop/mobile states and tests quality on their physical device. No merge, production deployment or R3-B/R4 activation.
