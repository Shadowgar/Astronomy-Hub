# Unified Universe Architecture

Current architecture reconciled 2026-10-08 under owner-authorized C5.6.75.
Historical Phase A/B dates and decisions remain in ADRs/study; they do not control
current implementation. [Validation](../validation/SYSTEM_VALIDATION_SPEC.md)
governs proof; CORE/LIVE/PROJECT_STATE govern execution. No future feature is
authorized by this document. [ADR0009](decisions/0009-owned-earth-feature-reuse.md)
supersedes full-app topology while preserving applicable capability scope.

## Current, planned and open

Architecture lifecycle labels are separate from REAL/PARTIAL/FAKE/BLOCKED feature
truth. A completed bounded package does not claim all user-facing feature parity.

| Area | Current implementation and evidence | Planned / open boundary |
| --- | --- | --- |
| Product shell | Unified Sky-first `/`, `/sky-engine`, `/earth`, contextual Tonight/Observe and focused routes; [workspace](../validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md) | Further immersive/navigation UX requires bounded approval. |
| Sky | Contained SWE `/oras-sky-engine/`; native wheel/search/selection/math and qualified source/artifact chain, PR65 merged | Deeper Gaia/DSO/media/survey coverage and physical performance remain limited; no BabylonJS replacement. |
| Earth | Independent Hub-owned Cesium `/earth-runtime/`, selective pinned feature modules, C0–C5.6 bounded packages; [Earth proof](../validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md), [audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) | Four critical divergence areas; broader applicable capabilities deferred, no complete parity/global weather/terrain. |
| State/lifecycle | Small Hub intent, versioned runtime bridge, canonical integration state, serial Sky/Earth lifetime | ISS/body/scale handoffs and future schema extensions unimplemented; no universal scene object graph. |
| Aircraft | Observer100NM source, typed geometric admission,30sstep entities; audit503 and altitude visibility gate | Approved scope/fallback/motion/follow decisions and C5.7 proof; global coverage unapproved. |
| Satellites | Stations-only/cap100, strict TLE/epoch/finite guards,15sposition Entity updates | Core group/LOD/cache/tracking expansion proposed; no proven count deficit; dense opt-in/budgets unresolved. |
| Weather | Modeled observer point, source/time facts; separate latest-CONUS radar snapshot | Point usability repair proposed; cloud/wind/lightning/cyclone/history remain separate products/approvals. |
| Mapping | C5.5 historical CONUS HD/coarse global fallback; ellipsoid; optional ion branches dormant | C6 global imagery/terrain/3D direction, provider/accounts/budgets not chosen; no free Google Earth claim. |
| Planet / scale | No qualified body-surface or solar-system runtime | E Mars first/body-specific providers; H renderer OPEN; no Earth data relabeling. |
| Astronomy additions | ORAS-site context and bounded external adapters/registry exist | Broad eclipse/aurora/light pollution/measured horizon/seeing extensions F, source/science qualified. |

## Ownership and reuse policy

Hub owns product shell/intent/canonical state, independently instantiated Cesium
Viewer, Earth layer/selection/credits/bridge/lifecycle and justified backend/security
boundaries. SWE owns Sky scene, projection/science/math and native camera/selection.
God's Eye is external pinned **feature code**, not the Hub's renderer-owner app.
Prefer function/module-level qualified REUSE EXACTLY or WRAP; investigate generic
hooks before minimal documented port. A justified Hub implementation needs specific
contract/science/security/license/product/performance evidence; questionable is not
proven unjustified. No broad rewrite prescribed; no full app/main/Viewer singleton.
Pinned `e7707d9a0f34d9fbffc300023c319f95caa5be30` stays immutable; no upstream update in C5.6.75.

Both structural models remain required:

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

The active Earth runtime owns its scene without turning React/the product shell
into a shared renderer. Reusable lifecycle/provider/normalization/records/motion/
visualization/tracking functions can receive Viewer/source/services and dispose
their resources. Retain typed altitude/TLE/time/payload/density/string-ID truth.
Preserve applicable non-astronomy capability scope in [Earth plan](../execution/EARTH_CAPABILITY_PLAN.md),
under provider/hook/phase decisions; absent today does not mean rejected forever.

## Product state, bridge and lifetime

Current small Sky/Earth integration state represents mode, observer/time intent,
canonical selection, camera intent and applicable layer/preferences/history as
implemented. `packages/runtime-protocol/index.mjs` validates bounded envelopes;
host/runtime adapters own generation/identity/command acknowledgement. This is not
every engine matrix/cache/object, every future body or a general science API.
Preserve `catalog + source_id + model`, string Gaia/NORAD/source IDs and real RA/Dec
fallbacks. Names are cosmetic; no fake visibility/coordinates/magnitudes/coverage.

Same-origin independently built frames have qualified serial active-only lifetime;
inactive renderer resources are released. Same-origin itself is not authentication
or abuse protection. Genuine bfcache is `pageshow.persisted`, not simulated navigation.
Future bridge changes require version/schema/stale-client/safety and Docker/browser
proof. Earth LIVE_ONLY source freshness stays separate from astronomical controlled
time and weather observation/history/forecast issue/valid clocks.

## Provider, science and assets

FastAPI remains canonical Hub science/data authority. Selected bounded Earth
provider compatibility is permitted under [stack](STACK_OVERVIEW.md); no arbitrary
Node backend or full inherited upstream services. Current aircraft/events use
FastAPI, satellites/point weather browser transport; neither proves unlimited
public provider availability/rights. Evaluate CORS/key/privacy/quota/stream/cache/
validation/abuse boundaries per service. Keep last-good fallback explicit with
old source time and partial/unavailable state; no refresh from failed acquisition.

Code license does not license imagery/models/data/media. Notices, credits,
commercial/NC/SA/cache/redistribution/account requirements and service coverage
must be qualified. Large sky/catalog/imagery data stays mounted/indexed/tiled/
cached/externally served; do not bake bulk into images. ORAS above-me curation is
not the count policy for global Earth exploration, and exploration does not grant
fake visibility/science. Provider success/fixtures/scene rendering are separate gates.

## Deferred product direction and handoffs

D ISS handoff must prove identity, same relevant UTC, observer/frame, propagation,
focus and actual science before Sky↔Earth claims. E Planet Mode uses body-aware
Cesium candidates with real body/radii/datum/imagery/terrain sources, Mars first;
gas giant views must not invent solid surfaces. F astronomy layers are external
source-backed extensions, including measured horizon, not current implementations.
G scene/cockpit/drawing/share/AR UX requires ownership/media/device qualification.
H solar-system scale remains renderer/open-coordinate study; controlled handoffs
do not promise mathematically perfect infinite zoom or one renderer for all scales.
No second SWE behind Earth or port of Sky scene into React/Babylon.

## Approved product scope retained — future acceptance concepts

The user should experience one continuously navigable product across specialized
renderers, including astronomy intelligence/Above Me, universal time, observer,
selection/body, camera intent, history and ORAS capabilities. Existing small state
is a bounded realization; complete future cross-body behavior is not implemented.
Observe/Tonight remain independent direct-linkable mobile/shareable fallback routes
and contextual drawers; `observability.v1`/`tonight.v1` science remains unchanged.

Both future navigation styles remain approved direction, separately qualified:
explicit Sky search/select Mars → Explore Mars → body globe → surface, and reverse
Leave Mars → View from ORAS with Mars centered; scale-driven local sky → Earth →
Earth–Moon → solar system → selected body/surface. Frame/camera models, loading,
history, transition triggers and lifetime remain real boundaries. No mathematically
perfect infinite zoom or one renderer at all scales is promised.

Body candidates include Moon, Mars, Mercury, Europa, Ganymede, Io, Callisto and
Titan when qualified datasets permit. Mars may add geology, missions, rover/landing
sites and nomenclature; Moon may add lunar sites/missions/nomenclature. First proof
is Mars only. Gas giants may require atmosphere/globe views, without fake terrain.

F retains eclipse paths/lunar-eclipse geography, meteor/fireball events, smoke/haze,
light pollution, qualified passes, flight-to-sky projection, aurora/space weather,
real ORAS sensors/conditions, later equipment/FOV and ORAS AI integration. Measured
`oras_horizon.v1` remains important across Observe/Tonight/Sky/Earth/ORAS and panorama
alignment; no fabricated horizon. These are future scope, not current modules or
permission for WordPress, telescope control, DESI or unrelated coding.

Retain applicable live Earth/infrastructure capabilities under provider/rights
and phase gates. Upstream simulated traffic, estimated camera poses and launch
trajectories need explicit provenance if separately approved; they cannot become
measured/scientific truth. Potential external layer groups remain Astronomy,
Atmosphere/environment, Live Earth and Infrastructure/other; no future switches
are enabled by this plan. Larger astronomy extension APIs still require qualification.

## Upgradeability and decision history

Upstream → immutable pin/qualified build → adapter → external Hub extensions.
Future upgrade selects candidate SHA in a separate bounded task, tests API/provider/
asset/camera/identity/time/lifecycle/performance compatibility and repairs adapters,
then owner review. Existing public seam first, generic upstream hook second,
tiny documented patch queue last with reason/revision/proof/removal plan. UI
convenience is not permission to edit SWE or God's Eye source.

Historical ADR0003 and Phase B full-app build recommendations remain research
history; superseding ADR0009 selects owned Viewer and preferential feature reuse.
ADRs0001/2/4–8 retain applicable state/SWE/additive/body/handoff/source/license rules;
their dated “planned” examples are not current feature proof. Exact source evidence
and dated upstream snapshot are in the preserved audit, not continuously current
remote assertions. Current execution/roadmap belongs to
[PROJECT_STATE](../execution/PROJECT_STATE.md), capability planning to Earth plan,
C5.7/C6 to their unapproved proposed specs. MASTER_PLAN remains product reference.
