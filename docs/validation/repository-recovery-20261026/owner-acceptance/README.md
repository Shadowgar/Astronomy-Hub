# Owner application review — 2026-10-27

**Preview:** [operate the application](http://localhost:4231/sky-engine) · [visual gallery and three recordings](http://localhost:4231/owner-review/).
Open these URLs in **Windows Edge on this computer**. The gallery is evidence; its mode links open the actual application.

Application commit **`47fcc14c93693149ad16bcf2e078893db655f20d`**, existing branch `recovery/reconcile-20261026`, PR107. Started from verified clean `0cad847b2515a07c42e1a188dfa0978c79584e1a`. Subsequent documentation commits do not change the application. **Owner acceptance pending. No merge/deployment/release approval.**

The loopback-only Docker preview remains running as `pr107-owner-preview` and `pr107-owner-backend` on the existing recovery network. Existing containers/volumes were not changed. All application/scientific mounts are read-only; only disposable container temporary directories are writable. If stopped, run from WSL: `docker start pr107-owner-backend pr107-owner-preview`. If Docker/WSL is stopped, start the existing local Docker environment first. Do not substitute the older port4173 checkout. Nothing was exposed on Wi-Fi/Tailscale. **Physical iPhone access/testing remains UNVERIFIED**; localhost on an iPhone addresses that phone, not this computer. An already-authorized private connectivity path is required before device qualification.

## What was actually exercised

Headed **Windows Edge156.0.4314.42**, Windows10 browser UA, WebGL ANGLE **NVIDIA RTX3060 Laptop GPU / Direct3D11**, with GPU compositing/WebGL enabled and no forced software rendering. Desktop1440×900, touch-emulated portrait390×844 and landscape844×390; these are not physical iPhone results. Recordings contain actual interactions, trimmed continuously without substituted frames.

- Native Sky: Polaris search/selection, atmosphere on/off, native settings close, time/satellite source status; controlled UTC retained through Earth/Sky returns. Native satellite motion/Track/Stop scientific evidence is reused from [prior qualification](../p0-satellite-usability/README.md), not rerun or relabeled Windows proof. Current text search for `ISS` returns two DSO substring matches and no satellite. This is a search-coverage limitation, not proof that native satellite rendering/tracking failed.
- Earth: live Photon/OSM San Francisco results, real coordinate selection, camera zoom, automatic Blue Marble→EOX imagery, Sources, and return. No recorded provider responses or mocks. Imagery tiles decoded with no tile failures in the measured close-view intervals.
- Solar: source-backed overview, zoom/orbit, physical/cinematic scale selector, Sun close-up, Saturn system and return. Parent-centered Earth system→selected Moon→native Moon→Earth system; real lunar orbit/zoom, coordinates and zero remaining Moon iframe after return. All three layouts exercised these journeys. Zero page exceptions in the36-step capture run.
- Separate final Sky checks **3/3 viewports**, final focused Earth repair checks **3/3**, **22/22 focused frontend tests**, typecheck and build pass. Build retains the existing >500kB chunk warning; no warning-clean claim. Initial capture scripts had incorrect control names/close actions; receipts retain those failures. Their failures are not application defects. The startup delay and two pointer obstructions below were real observations.

## Reproduced defects and disposition

| Priority | Cause and exact source | Evidence / impact | Correction/status |
|---|---|---|---|
| P2, fixed | [`EarthSearch.tsx:14`](../../../../frontend/src/features/workspace/EarthSearch.tsx#L14) left results open after successful navigation | Choose coordinates on mobile, then click Zoom in: `.ws-search-panel-heading` intercepted the pointer. [RED](receipts/earth-search-red.json) | Collapse only a successful, still-current selection; retain newer queries, keyboard focus, results reopening, selected card and validation errors. |
| P2, fixed | [`earthWorkspace.css:29`](../../../../frontend/src/features/workspace/earthWorkspace.css#L29): location/search layer covered desktop Sources | Select coordinates→Sources→Close panel: `.ce-location` intercepted the pointer. [RED](receipts/source-close-red.json) | Hide the retained search/location layer while Sources is open, matching mobile behavior; restore on close. [Final3/3GREEN](receipts/earth-final-green.json). |

Both corrections received a separate read-only reviewer assessment, including saved RED/GREEN evidence. No actionable findings remain in those narrow diffs. Navigation false/throw paths were inspected, not browser-injected. This is not consolidated-PR or owner approval.

## Most consequential remaining UX issues

| Priority / classification | Actual behavior versus approved direction | Bounded next action for owner decision |
|---|---|---|
| P1 responsiveness observation | First desktop Polaris request took27.104s while Tonight requests took36–39s; later search188–236ms. Blank waiting results feel broken. Exact bottleneck is not isolated. Route [`sky.py:72`](../../../../backend/app/routes/sky.py#L72) calls synchronous search from an async handler; timing alone does not prove this is the sole cause. | Profile one cold startup and add clear pending/error feedback; decide scheduling/caching repair from measured evidence. No science changes inferred. |
| P1 visual/product dissatisfaction | Earth overview is dark and visually flat; region zoom uses historical2016 EOX10m mosaic, overview uses Blue Marble500m. No configured terrain/buildings/photorealistic provider. Close zoom cannot invent detail. | Agree honest imagery coverage/terrain goals and provider rights/cost before implementation. Current imagery and ellipsoid limits are data/configuration limits, not a missing shader fix. |
| P1 visual/product dissatisfaction | Solar has sparse background, small separated globes, thin orbit paths and a dominant selector/control rail; less depth and composition than the flagship reference. Sun close-up works. Giants/rings are procedural and static illustrative orientation; overview sizes enlarged independently. | Review one overview plus Saturn/Mars close-up in the actual app before a bounded materials/camera pass. Preserve source positions and explicit scale. |
| P2 cohesion/discoverability | Several menu/rail/sheet patterns; selecting a Solar planet enters its system, while Sun selects a close-up. Time moves inside mobile selection sheets. Moon still brands itself Solar System. Landscape Moon header/form/credits consume much of390px height and its globe is clipped. | Approve one panel hierarchy, clear destination/return wording and short-screen behavior before restyling. |
| P2 search coverage | `ISS` returns Polarissima DSOs. [`sky_catalog_service.py:317`](../../../../backend/app/services/sky_catalog_service.py#L317) searches star/DSO packs; exact TLE lookup exists separately at411. No native satellite text-search result was available in this preview. | Separately scope data-driven TLE search and no-result messaging if desired; do not substitute hand-added objects or reopen propagation. |
| P2 data limitation | Moon orbit/coordinates/return work, but its historical grayscale mosaic is3.79km/pixel,7.86% no-data, sphere/no terrain.30km-height exploration enlarges pixels rather than revealing craters. | Decide whether current coarse globe is useful; detailed exploration requires a separate imagery/terrain qualification. |

Comparison uses the [exact approved cinematic references](../../../design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md) and [unified design contract](../../../design/UNIFIED_WORKSPACE_DESIGN_SPEC.md). Gallery pairs original reference bytes with real captures. Current glass/scene-first structure partially follows the references; premium scene depth, selected-place richness, consistent progressive disclosure and mobile composition remain unsatisfactory. Concept clouds/night lights/planet arrangement are not provider or scientific promises. Moon has no new accepted cinematic surface reference.

**Recommended sequence:** owner operates preview and chooses one priority → shared layout/interaction acceptance → Earth provider decision → one Solar visual slice → separate Moon detail decision. Stop before implementing significant visual changes.

## Evidence and boundaries

Twelve [original captures](captures/) total3.6MB; [capture revisions/hashes](receipts/captures.json). Sky/Earth captures use47fcc14c; Solar/Moon captures use3e4459f7, preceding only Earth CSS changes. Three private recordings remain on the working gallery; [trim/source ledger](receipts/clips.json). Full untrimmed recordings remain in local `output/playwright/owner-acceptance/video/`.

[Commands and context](COMMANDS.md), [journeys](receipts/journeys.json), [Sky rechecks](receipts/sky-recheck.json), [preview mounts](receipts/preview.json), [preservation](receipts/preservation.json). All111 packaged native Sky files are byte-identical to the qualified artifact; Earth/Moon artifacts and scientific packs are reused unchanged. Dense-star expected-empty404s were already qualified and were not reinvestigated.

Public source publication/legal-source scope, physical iPhone, owner visual acceptance and prior release gates remain open. The earlier archive-only source result remains historical evidence for its exact source commit; these Hub repairs require a matching source distribution before release. No archive was reconstructed or published in this task.
