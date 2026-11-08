# Solar System 2.1 — actual atmosphere and regional terrain

Engineering candidate on existing `recovery/reconcile-20261026` / draft PR107,
starting from `b4005ce48e9869c298de4ed019c67e4e246accda` (main remains `9a03d826`).
**Owner visual acceptance is not granted. Physical iPhone remains unverified.**
No merge, production deployment, source publication, branch deletion or protected
volume/data changes were performed. Exact final commit and hosted checks are
recorded in the PR107 qualification comment.

## Try the private application

- [Earth with Takram](http://localhost:4231/solar-system?solarBody=earth&date=2026-10-27T04:00:00Z)
- [Apollo17 regional terrain](http://localhost:4231/planet-terrain/apollo17-nac-v1?date=2026-10-28T00:00:00Z)
- [Matched captures, original references and actual recordings](http://localhost:4231/owner-review/solar-system-2.1/)
- Native Moon also exposes **Apollo17 terrain**, with explicit camera/time-preserving return.
- Solar2 rollback remains at `http://solar2.localhost:4231/`; its files and prior gallery are preserved. The listener is still127.0.0.1:4231 only, with no tunnel or firewall change.

## Delivered implementation

Actual **Takram atmosphere0.19.1**, geospatial0.9.1 and postprocessing6.39.5 run in the existing Three0.180 Solar renderer. Actual **NASA AMMOS 3D Tiles Renderer0.5.3** streams/refines the new regional lunar route. One Three instance, one active heavy renderer and one scheduler/output transform per scene. The Hub stays React18; unused React19/R3F peers exist only in the isolated package graph and are absent from the production bundle. Exact locks, notices, build proof and advisory triage: [DEPENDENCIES](DEPENDENCIES.md).

Earth uses source JPL Earth399/Sun10 vectors, CPU double subtraction before GPU submission, camera-relative metre rasterization, and Skyfield ICRF→ITRS orientation at the same UTC. The backend qualifies hourly quaternion interpolation against direct rotations; no observed polar motion/EOP or terrestrial positioning accuracy is claimed. Actual upstream depth-aware aerial perspective and Bruneton lookup scattering/transmittance are integrated before the existing single output transform. Distant opaque objects use the actual upstream full atmospheric path rather than being projected onto Earth. Original NASA Earth/cloud imagery is preserved. Custom atmosphere remains selectable and is an explicit fallback for missing tables/frame, cinematic scale, efficient quality or unsupported graphics. Earth-only1km camera clearance and a denser sphere permit close atmospheric approach; no Earth terrain/weather is invented. [Atmosphere](ATMOSPHERE.md), [independent frame review](EARTH_FRAME_REVIEW.md).

Apollo17 uses official PDS NAC5m elevation, matching5m ortho and confidence, on the source1737400m lunar sphere. The5.12×5.12km crop contains204.375m actual relief and85progressive GLBs (40/20/10/5m levels), with bounded queues, memory/cache, cancellation/retry, context recovery, touch/keyboard camera and true height scale. Acquisition74,748,629bytes; served pack47,728,870bytes. It is a regional3Dsurface with real occlusion, not an image overlay. Historical image shadows remain; optional gray relief lighting is explicitly illustrative. LROC_ME is source-qualified; exact ME421 realization/alignment is not asserted. Native Moon remains its original separate globe. [Source/datum/license](TERRAIN_SOURCE.md), [runtime](TILES_RUNTIME.md), [independent1,414,485vertex review](REVIEW_TERRAIN.md).

## Qualification

- Warning-clean Docker Earth-frame/motion tests: **7 PASS**. Independent1,736rotation checks cover source boundaries/leaps; worst sampled interpolation0.0112814arcsec. Source tests10PASS; all generated files reproduce, independent vertex error≤0.122mm after local rebasing. These are numerical/conversion checks, not new physical accuracy claims.
- **500frontend tests /75files PASS**, types and build pass. Production Docker clean-source build succeeds with both lockfiles/shared CSS and all bounded assets. Source archive contracts6PASS; historical source archive is not renewed.
- Actual Windows Edge/NVIDIA RTX3060: **10 matched atmosphere A/B captures**, **12 performance cases**, **3 source/fallback/moving-Earth/1km approach groups**, **27 preserved Solar journey groups** across3layouts. Seven independent controlled GPU views, foreground and distant opaque HDR controls, and zero-resource disposal also pass as supporting software-rendered proof.
- Actual NASA3DTiles Windows3layout journeys verify LOD3/5m refinement, native Moon entry/return, camera/UTC, touch/keyboard, resize, reduced motion, context restoration, retry and renderer disposal. Final native Earth/Sky return checks include normal/loading/source failure/GPU-init failure; no source response is fabricated outside explicit failure injection.
- Desktop balanced custom→Takram median CPU0.90→1.10ms, GPU0.80→1.32ms; measured active RAF intervals remain~6.9ms. These are separate clocks, not inverse-time FPS claims. Phone layouts use the desktop GPU. [Raw measurements and costs](PERFORMANCE.md).
- Hosted implementation checks passed CodeQL (four languages plus aggregate), repository integrity and Playwright. Two obsolete G6 workflows referenced scripts/tests removed with the legacy Sky renderer in May; they were retired with history and coverage evidence, preserving all active checks. [CI follow-up](COMMANDS.md#hosted-ci-follow-up-obsolete-g6-workflows). Final exact-head hosted status is recorded in PR107.

[Exact commands and retained failed attempts](COMMANDS.md), [fresh non-author final review](REVIEW_FINAL.md), [independent integration corrections](ATMOSPHERE_INTEGRATION_REVIEW.md). No remaining actionable P0/P1/P2 was found in those bounded code reviews after corrections; they do not approve the entire consolidated PR or replace owner/device/source release gates.

## Findings corrected during this qualification

| Priority | Defect and user impact | Correction / reproducible evidence |
|---|---|---|
| P1 | Production npm install omitted the nested graphics lock; clean image could not install. Existing shared glass source also absent from Docker context. | Explicit manifest/shared-source copies; standard npmci and complete production build pass. Exact files/lines and initial failure in independent integration review. |
| P1 | Terrain SPA path collided with a physical asset directory; nginx301 redirected to its internal port, making real browser entry fail. | Exact route handlers serve index200 without redirects; asset paths remain404 on absence. Independent HTTP receipt plus actual Windows route entry. |
| P2 | AU logarithmic-depth cancellation created stepped Earth surface bands. | Camera-relative metre rasterization; source/camera/HUD remainAU; inspected actual GPU and Windows captures. |
| P2 | Earth geometric correction projected distant opaque objects onto Earth and altered limb radiance. | Disable ground projection and apply upstream full-path scattering outside atmosphere; independent behind-limb HDR difference35→0 and foreground0. |
| P2 | Float32 height+radius lost precision before lunar local rebasing. | Float64 addition/rebase; all1,414,485vertices independently verified, maximum error0.122mm. |
| P2 | Native Earth departure retained query coordinates but did not apply its camera/observer handoff. Loading/failure paths could also substitute stored observer. | Existing solarExit contract plus validated current intent before initialization/at departure; new source tests, independent reproduction and actual native runtime checks. |
| P2 | DOM planet markers could appear through Earth; prior camera envelope prevented the promised close approach. | Displayed-sphere line-of-sight checks, Earth-only1km clearance and100m near plane; red/green tests and actual Windows near-horizon/zoom proof. |

## Remaining gates and precise limits

Owner visual/product acceptance remains pending; physical iPhone has no existing private connection and remains unverified. Source precession/UT1, lunar frame realization, historical imagery and modeled radiance limits are explicit above. The field of view does not add lunar information beyond the5m source sampling; crop edges remain visible rather than claiming global terrain. No high-resolution Earth/Sky/Mars redesign was added.

The final Hub differs from the historical `f7cb702c` archive. A matching final archive-only reconstruction, approved public anonymous HTTPS source offer and retained combined-work/third-party source qualification are still required before release. New package/source notices are present, but this is not legal/source-release acceptance. Twelve existing Hub dependency advisory entries remain maintenance debt; the new isolated graphics graph audits clean. The broader legacy TestClient test failed warning-clean collection; this run does not claim a full backend-suite pass.

Loaded context and authorization: [PLAN](PLAN.md). Exact changed-file inventory is `FILES.txt`. Native Sky/Earth/Moon implementations/pins, JPL/scientific data and approved reference PNGs remain preserved. Recommended next step: owner evaluation of this exact private candidate, followed by separately bounded outstanding device/source/security release qualifications. No further feature phase is started here.
