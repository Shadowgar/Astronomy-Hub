# Unified Universe Architecture

Decision date: 2026-10-02. Status: approved future architecture, documentation
checkpoint only. Implementation baseline: main
`7c54596f59b2d43afda561cbad1b0d587d7407f6` (merged PR #52).

This is the detailed architecture reference for renderer and engine work.
[Core context](../context/CORE_CONTEXT.md),
[live session brief](../context/LIVE_SESSION_BRIEF.md), and
[project state](../execution/PROJECT_STATE.md) control execution; the
[validation spec](../validation/SYSTEM_VALIDATION_SPEC.md) controls proof.
Approval of this direction does not authorize implementation of later phases.

## 1. Product principle

Astronomy Hub is a unified, continuously navigable astronomy, Earth, and
planetary exploration workspace. The user should experience one application
across specialized renderers. Astronomy intelligence and the Above Me decision
layer remain part of that product.

The Hub owns the product shell, global navigation, universal time,
observer/location context, selected entity/body, camera intent, cross-engine
navigation, applicable layer state, product history/context, astronomy
intelligence, and ORAS capabilities. Each renderer owns its domain scene,
render loop, coordinates, camera execution, selection realization, and visual
math. Product intent must cross a qualified adapter boundary; it must not
reach into another renderer's internals.

Both structural models remain required:

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

Shared product selection does not change scientific data ownership. Preserve
`catalog + source_id + model`, string IDs including Gaia IDs, and source-backed
`ra`/`dec` fallback coordinates. Display names are cosmetic. No invented
coordinates, visibility, magnitudes, catalog availability, or horizon data.
Large astronomy data remains mounted, indexed, tiled, cached, or externally
served; it must not become Docker image bulk.

## 2. Current, planned, and open

These are architecture lifecycle labels, separate from the validation statuses
REAL/PARTIAL/FAKE/BLOCKED. A planned feature receives no runtime completion credit.

| Area | CURRENTLY IMPLEMENTED | APPROVED / PLANNED | OPEN / UNDECIDED |
| --- | --- | --- | --- |
| Public shell | PR #52: Home `/`, Observe `/observe`, Tonight `/tonight`, Sky host `/sky-engine` | Renderer-centered workspace with Hub application chrome; possible conceptual Home/Sky convergence | Final UX, mockups, rollout and route decisions |
| Sky | Contained SWE runtime `/oras-sky-engine/`, separate from its Hub host | Upgradeable SWE behind a qualified Sky adapter | Safe chrome suppression and real bridge capability |
| Earth | Legacy partial Earth-related code; no God's Eye integration | Complete applicable God's Eye Earth runtime plus additive astronomy layers | Consumption/build topology, provider qualification |
| Planet | Local-sky planetary identities/links; no approved body-surface runtime integrated | Body-aware Cesium planetary surface direction, first proof Mars | Qualified datasets, body/frame support, final runtime design |
| Solar-system scale | No qualified cross-body navigation runtime | Navigation between bodies and scales | SWE sufficiency versus a dedicated scene; renderer undecided |
| Universal state / handoffs | Existing route/context inputs; no universal multi-renderer state boundary | Small Hub-owned state and controlled renderer handoffs | Schema, adapter APIs, transition choreography |
| Satellites | Normalized TLE identity, release lifecycle, freshness/provenance and local propagation source paths | Shared ORAS data authority across Sky and Earth; qualified passes later | Provider reconciliation and Earth orbit/tracking integration |
| Flights | Small nearby-flight awareness path; immature product foundation | Study and likely adapt God's Eye provider/layer architecture; flight-to-sky projection | Provider terms, altitude/frame qualification, optional ORAS receiver |
| Astronomy Earth layers | No Hub Earth extension registry implemented | External additive extensions | Real extension API and registration points |

Existing SWE, Observe, observability, Tonight, catalog/identity, and public-shell
work through PR #52 remains valid foundation work. This checkpoint changes no
scientific or backend API contract. Existing shared-shell qualification remains
PARTIAL for the blanket console-clean gate because of documented dense-star
tile 404s; no fresh runtime qualification is claimed here.

Route/host and satellite/flight source excerpts were inspected to confirm the
foundation claims; this is supporting evidence, not a fresh runtime test.
Current code anchors are `frontend/src/routes/AppRouter.tsx`,
`frontend/src/features/sky-engine/SkyEnginePage.tsx`,
`vendor/stellarium-web-engine/apps/web-frontend`,
`vendor/stellarium-web-engine/src`, `frontend/public/oras-sky-engine`, and
`backend/app/services` / `backend/app/routes`.

## 3. Renderer and domain ownership

### Sky Mode — Stellarium Web Engine

SWE remains the primary renderer for observer-centered sky: stars, DSOs,
local-sky planets, constellations, atmosphere, surveys, sky projections,
navigation, and future sky overlays. It remains an upstream, upgradeable
rendering technology. The Hub must not move its rendering into React or
BabylonJS or extract a shared universal renderer from it.

The ORAS header plus Stellarium frontend header is a development/integration
state. The approved future interface has Hub-owned visible application chrome
around the embedded sky and SWE-owned sky rendering. The compatibility study
must establish how to achieve that safely. No chrome change occurs here.

### Earth Mode — God's Eye View

[God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) is the approved
Earth foundation, using its Cesium Earth capability. Integration has not started.
Preserve its complete applicable Earth feature set, subject to provider,
data, asset, and deployment terms. Do not strip non-astronomy features simply
to create an astronomy-only globe.

The preservation scope includes civil and military aircraft, satellites,
ships, CCTV, traffic, fires, earthquakes, launches, weather/environment layers,
imagery, terrain/photorealistic Earth, infrastructure, other applicable upstream
capabilities, and future qualified upstream improvements. This is a preservation
requirement, not a claim that all these layers are deployed or all feeds are live.

Upstream labels simulated traffic and estimated camera poses/launch trajectories.
Preserve capability with honest provenance and labels; simulation and estimates
must never be presented as measured truth or used as authoritative astronomy
inputs. Unavailable or unqualified providers stay explicitly unavailable, may
require configuration or replacement data, and do not justify deleting the
feature architecture. Provider credits must survive immersive UI.

### Planet Mode — body-aware Cesium direction

Other bodies use a planned body-aware Cesium planetary surface runtime, with
qualified body-specific data. Candidate bodies include Moon, Mars, Mercury,
Europa, Ganymede, Io, Callisto, Titan, and others when qualified data supports
them. This is an approved direction, not evidence that stock Cesium or the
current Hub supports every body.

Mars may combine imagery, terrain, geology, missions, rover/landing-site
context, and nomenclature. Moon may combine lunar imagery, terrain, landing
sites, missions, and nomenclature. Earth-only God's Eye layers never pretend
to apply to other worlds. Jupiter and Saturn may need atmospheric/globe
visualization rather than a fictitious solid terrain surface. Details require
technical and data qualification; the first proof targets Mars only.

### Solar-system scale — renderer undecided

Future navigation must permit movement between bodies. Whether SWE is sufficient
or a dedicated solar-system scene is justified is an open architectural question
for the compatibility study. No new renderer is selected by this checkpoint.

## 4. Universal application state

Keep the future Hub-owned state intentionally small. Conceptual fields are:

- mode;
- time;
- observer;
- selected entity;
- selected body;
- camera intent;
- active applicable layers;
- navigation/history context.

The exact implementation and schema remain open. This is product state, not a
copy of every engine scene object, camera matrix, provider cache, or render loop.
Renderer-local state may exist but must not become a competing product authority.
Adapters translate intents and report relevant selection/time/navigation changes
through qualified interfaces. Applicability prevents Earth layers from following
a user to Mars as if they were meaningful there.

For example, ISS selected on Earth can open Sky at the same relevant time with
the same satellite identity and the ORAS observer. Mars selected in Sky can open
Planet Mode with Mars still selected. These are planned acceptance concepts,
not implemented behavior.

## 5. Cross-engine navigation

Both interaction styles are approved. Controlled renderer handoffs are allowed;
visual and contextual continuity is the goal. Different coordinate/camera
models remain real boundaries. Do not promise mathematically perfect continuous
camera transforms or one renderer covering every scale.

**Explicit body exploration:** ORAS Sky → search/center/select Mars → Explore
Mars → controlled transition → Cesium Mars globe → approach the surface.
Reverse: Mars surface → zoom out / Leave Mars → planetary/solar-system context
→ View Mars from ORAS → SWE with Mars centered in the ORAS sky.

**Scale-driven aspiration:** ORAS local sky → apparent departure from the local
horizon → Earth → Earth–Moon scale → solar system → select/approach another body
→ planetary surface. This may resemble infinite zoom while using several
renderers. Scale triggers, animation, coordinate/frame translation, history,
loading/failure behavior, and renderer lifetime policy remain to be studied.

## 6. Upstream upgradeability

SWE and God's Eye are upstream software products. Astronomy Hub must not become
a deeply modified permanent fork of either. The desired boundary is:

```text
upstream → pinned/qualified version → adapter/compatibility boundary → Hub extensions
```

Hub functionality lives outside upstream source wherever practical. Treat
upstream source as immutable vendor software in normal development. This is the
future change discipline; it does not assert that existing SWE integration has
zero local divergence or authorize a runtime cleanup of historical changes.

Upgrade procedure: select a newer upstream revision, run compatibility and
qualification tests, repair adapters/bridges for changed APIs, then merge the
qualified upgrade. Reapplying hundreds of Hub edits is not an acceptable normal
upgrade process. Compatibility proof must cover capability preservation,
selection, time, observer, camera, layers, exact links, provider failure,
cleanup, and desktop/mobile memory/performance as applicable.

If a source modification is unavoidable: first seek an existing extension point;
then prefer a generic hook contributed upstream; only as a last resort use a
tiny explicit patch queue with architectural exception, rationale, revision,
qualification, and upgrade/removal plan. UI convenience alone is not an exception.
No implementation PR may silently edit either upstream tree.

The consumption mechanism remains open: pinned Git submodule, controlled
subtree/vendor mirror, separately built runtime with typed bridge, or imported
modules through stable package exports. The invariant is pinned, upgradeable,
testable, additive, and low-divergence. No submodule or dependency is added here.

## 7. God's Eye adapter and extension model

Create a future Hub compatibility/adapter layer using stable exported/public
boundaries where practical. Avoid arbitrary imports from dozens of upstream
internals. A layer/extension registry should make astronomy additions external
to God's Eye source rather than scattered local edits.

Conceptual additions include `EclipseLayer`, `FireballLayer`, `AuroraLayer`,
`LightPollutionLayer`, `ObservatoryLayer`, `AstronomySmokeLayer`, and `ORASSiteLayer`.
They may cover solar eclipse paths, useful lunar-eclipse geography, meteor/
fireball events, smoke/haze and observing clouds/weather, aurora/space weather,
light pollution, observatories, ORAS site context, satellite observing, and
astronomical events affecting Earth locations.

A future extension contract may own id, label, source/provider, initialization,
enable/disable, time updates, rendering primitives, selection, attribution, and
cleanup. No TypeScript/JavaScript API is frozen here. The compatibility study
must derive the actual boundary from upstream architecture and exports.

Conceptual Earth UI groups, without redesigning upstream UI in this checkpoint:

| Group | Example layers |
| --- | --- |
| Astronomy | Satellites, eclipse paths, fireballs, aurora, light pollution, observatories, ORAS context |
| Atmosphere / environment | Clouds, weather, radar, smoke, fires |
| Live Earth | Civil/military aircraft, ships, traffic, CCTV, earthquakes, launches; retain each layer's actual provenance label |
| Infrastructure / other | Remaining supported God's Eye layers |

## 8. Satellite and flight direction

Preserve ORAS satellite data authority: normalized identity, TLE release
lifecycle, freshness, provenance, and local propagation. Relevant current source
paths include `satellite_tle_catalog_service.py`, `satellite_feed_status_service.py`,
and `satellite_propagation_service.py` in `backend/app/services`, and
`scripts/skydata/build_oras_satellite_tle_release.py`.

Approved direction: ORAS satellite backend/data authority → Sky visualization
and Earth/Cesium visualization. God's Eye tracking/orbit rendering may be reused
through the adapter. Exact provider authority and identity/time/frame reconciliation
require later qualification. Legacy pass behavior is not production-grade;
qualified satellite passes remain future work. An upstream pass feature does not
prove ORAS pass accuracy.

Current Hub flight awareness is immature: `fetch_opensky_nearby` in
`backend/app/services/live_providers.py` fetches a bounded nearby list. Study and likely adapt God's Eye's
richer flight provider/layer direction: OpenSky, adsb.lol fallback, freshness,
rate-limit handling, tracks, enrichment, rendering/tracking, and optional local
receivers. Do not treat expansion of the small nearby fetch as the final system.
Future flight-to-sky capability must transform real aircraft geographic position
relative to ORAS into validated azimuth, elevation, and range with explicit time
and altitude/frame meaning. Local ORAS ADS-B is an optional future differentiator,
not installed or implemented capability.

## 9. Bounded upstream observation and provider boundaries

Observed on 2026-10-02: repository `bilawalsidhu/gods-eye-view`, default branch
`main`, revision [`e7707d9a0f34d9fbffc300023c319f95caa5be30`](https://github.com/bilawalsidhu/gods-eye-view/commit/e7707d9a0f34d9fbffc300023c319f95caa5be30),
commit timestamp 2026-09-29T00:33:34Z. This observation is not a selected integration
pin or a compatibility qualification. No clone, build, or architecture audit ran.

Only these upstream top-level files were inspected:

- [README](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/README.md): Cesium/Vite/JavaScript Earth foundation, modular layers and provider-dependent capabilities.
- [LICENSE](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/LICENSE): MIT source-code grant with explicit third-party data, runtime-provider, and visual-model exclusions.
- [DATA_SOURCES](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/DATA_SOURCES.md): separate per-source terms, attribution, fallback and local-receiver notes.
- [SECURITY](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/SECURITY.md): local-first deployment assumptions and credential boundaries; no hosted-production readiness implied.
- [package manifest](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/package.json): exported application/viewer, layer, UI, source, and server-provider paths exist; suitability/stability is unqualified. Declared Node range differs from Hub tooling and needs study.
- [THIRD_PARTY_NOTICES](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/THIRD_PARTY_NOTICES.md): dependencies retain their own licenses.

Distinguish source code, third-party data, third-party visual assets, and runtime
provider/API terms. Feature preservation grants no right to redistribute or
publicly host all upstream data unchanged. A preserved feature may require
credentials, attribution, alternative qualified data, configuration, or deployment
restrictions. Licensing material embedded in a source file remains data when it
is a derived third-party dataset. No legal or provider qualification is completed
by this checkpoint.

The future provider qualification matrix must record feature, provider,
license/terms, credentials, public-host suitability, redistribution, attribution,
and fallback. Outcomes remain open; required credits stay visible when chrome hides.

## 10. Workspace and UX direction

The renderer is the design center. The flagship is sky-centered, with a
full-viewport renderer and contextual floating controls. Supporting information
is progressively disclosed. Chrome should auto-hide during exploration, return
from relevant screen edges, support explicit pinning and immersive mode, and
show controls only when relevant. These are planned capabilities.

Home from PR #52 is a shared-shell foundation, not the final visual product.
Home and Sky may converge conceptually around the workspace; neither Home nor
any route changes in this checkpoint. Future UX begins with approved visual
concepts/mockups before coding, rather than improvised dashboard/card designs.

Observe and Tonight remain focused, direct-linkable, mobile/shareable pages and
independent fallback surfaces. Their capabilities should also become contextual
workspace modes/drawers: Tonight, Observe context, selected-object details, and
time controls. Existing `observability.v1` and `tonight.v1` remain unchanged.

`oras_horizon.v1` remains approved and important, but is not the immediate next
implementation task. Later integration spans Observe, Tonight, Sky, Earth/ORAS
site context, and panorama alignment. It requires measured/calibrated inputs;
no horizon profile is fabricated.

## 11. Revised roadmap and open questions

| Phase | Approved order and acceptance concept | Implementation state |
| --- | --- | --- |
| A | Unified Universe Architecture documentation checkpoint | This docs-only task; review/open PR, do not merge |
| B | God's Eye + SWE compatibility/upgradeability study | Next bounded task; not started |
| C | Unified runtime skeleton: Sky and Earth under the same ORAS shell, complete applicable upstream Earth capability, upstream source unmodified, basic shared state boundary | Planned; depends on B |
| D | ISS vertical slice: Sky select ISS → Show on Earth → same ISS/orbit context; Earth select ISS → View from ORAS → same relevant time/context, ISS centered | Planned; depends on qualified identity/time/propagation and C |
| E | Planetary proof: Sky search/select Mars → Explore Mars → Cesium Mars globe | Planned; qualify one body first |
| F | Astronomy extensions | Planned later |

Phase F includes `oras_horizon.v1`, eclipse visualization, meteor/fireball
events, smoke/haze, light pollution, qualified satellite passes, flight-to-sky
projection, aurora/space weather, real ORAS sensors/conditions, later equipment/FOV,
and later ORAS AI integration. This does not authorize WordPress, telescope
control, DESI promotion, or unrelated implementation.

Phase B must answer:

- Best upstream consumption mechanism; runtime isolation versus direct module
  integration; Git/build topology and build assumptions.
- God's Eye public/exported module boundaries, external-layer registration,
  Cesium viewer/camera access, selection/time models, camera tracking, provider
  architecture, Earth-specific assumptions, and licensing/provider boundaries.
- Safe SWE chrome suppression/rework, selection/time/observer/camera/layer bridge
  capability, and existing local divergence/upgrade implications.
- Solar-system-scale SWE sufficiency versus a justified dedicated scene;
  planetary data/body/frame limitations.
- Renderer memory/performance and mobile implications; lifetime policy and
  upgrade compatibility testing.
- Universal-state schema, extension API, renderer-handoff animation, and provider
  qualification outcomes. These remain open until evidence supports decisions.

The next task after this PR is **God's Eye + SWE compatibility/upgradeability
study**. Do not start integration or horizon work from an older roadmap.

## 12. Decision records and checkpoint validation

Accepted direction records (approval does not mean implemented):

- [ADR 0001: Universal application state](decisions/0001-universal-application-state.md)
- [ADR 0002: SWE Sky renderer](decisions/0002-swe-sky-renderer.md)
- [ADR 0003: Complete upgradeable God's Eye Earth runtime](decisions/0003-gods-eye-earth-runtime.md)
- [ADR 0004: Additive astronomy extensions](decisions/0004-additive-earth-extensions.md)
- [ADR 0005: Cesium planetary direction](decisions/0005-cesium-planetary-direction.md)
- [ADR 0006: Controlled renderer handoffs](decisions/0006-controlled-renderer-handoffs.md)
- [ADR 0007: Immutable upstream source](decisions/0007-immutable-upstream-source.md)
- [ADR 0008: Separate provider/data licensing](decisions/0008-provider-licensing-boundaries.md)

This checkpoint requires documentation/control-only diff proof, whitespace and
local-link/context-manifest validation, and one normal single-agent review cycle
against the supplied Category A blockers. No runtime implementation, application
build, Docker, or browser qualification is required or claimed. Later runtime
work must meet Docker/browser and science-contract proof requirements.
