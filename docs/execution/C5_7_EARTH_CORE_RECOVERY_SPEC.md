# C5.7 Earth core recovery — proposed execution specification

**PROPOSED — AWAITING OWNER APPROVAL. NOT AUTHORIZED FOR IMPLEMENTATION.**
Date: 2026-10-08. PROJECT_STATE/LIVE_SESSION_BRIEF govern activation. C5.6.75 is
documentation only; no package below is active. Only one bounded implementation
package may be active at a time; proposed order **A → B → C → D → E**.

## Authority, evidence and common entry gate

Read [Earth capability plan](EARTH_CAPABILITY_PLAN.md),
[audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md), [divergence](../audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md),
[ADR0009](../architecture/decisions/0009-owned-earth-feature-reuse.md),
[validation authority](../validation/SYSTEM_VALIDATION_SPEC.md) via context packs.
Audit recovery commit `09495238c2b5aebe358c66f9a09801382758f4f8`; runtime baseline `bb28aec7833d154c2f0b3b7fa7470d69a93c84b4`.
Frozen Sky `b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`; Earth `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`; God's Eye pin `e7707d9a0f34d9fbffc300023c319f95caa5be30`.
These are historical qualified identities, not permission to rebuild or upgrade.

Entry requires owner review of C5.6.75, explicit C5.7/package approval, relevant
decision-register resolutions, exact accepted source/head/artifact baseline,
clean isolated worktree and preservation baseline. No paid call/account change,
new pin, deployment or source bulk is authorized by this proposal. Agree device,
poll/source caps and selected-provider legal/use obligations before code.
A source outage is not a renderer reproduction; fixture proof is not live success.

## Common work-package contract

Before implementation record named source/function seams, REUSE/WRAP/PORT or
justified Hub rationale and why alternatives do not fit. Capture a failing red
case in the actual behavior: deterministic capped fixtures for data/policy,
Docker/browser for display/lifecycle. Label source-only hypotheses and upstream
availability separately. Keep Hub Viewer/state/bridge and SWE math/camera ownership.

Every package reports fetched/parsed/valid/unique/admitted/capped/visible counts
where applicable, scope/coverage, provider/source time/age, last successful read,
partial/stale/unavailable state and reason. Visible means actually renderable in
the camera frustum/occlusion/LOD policy, not merely total entities. No timestamp
advance from failure/cache retrieval; no simulated positions as observations.
Selection/focus/tracking carry canonical string identities, never display-name identity.

Wrappers must dispose timers/listeners/requests/controllers/entities/primitives/
imagery/credits and guard stale mount/generation replies. After disable/departure,
no new source request may be dispatched; late results cannot revive layers. Failure
in one source leaves other layers/navigation usable. Credits survive immersive UX.

### Artifact and regression rules (apply to A–E)

No existing artifact may be promoted by a version-string-only claim. For Earth
owned inputs/dependencies/protocol changes, use the repository pinned builder and
source attestation, regenerate approved identity metadata and verify installed/
served bytes; qualify rollback by artifact SHA. Sky-owned input change requires
separate scope justification and qualified Sky rebuild. Do not rebuild Sky for an
Earth-only source/controller change. Hub-only docs/tests that do not change renderer
inputs require no renderer rebuild. Shared protocol changes require both adapters'
validation. Preserve frozen native science and wheel behavior; no giant skydata
in images. Runtime tests are Docker-authoritative; unit/fixture tests support them.

## C5.7-A — Aircraft operational recovery

**Entry:** Resolve OD1 coverage/provider/fallback/use limits; preserve current
observer100NM scope unless explicitly expanded. Current503 does not prove rendering
failure. Current home15.62Mm gate independently hides aircraft even if a feed succeeds.
**Ownership:** FastAPI earth transport and owned adapter/registry/entity/camera; no
upstream app/Viewer. Evaluate `createCivilFlightLayer`, `FlightRecords`, ingestion/
motion/render/tracking and OpenSky→ADSB fallback seams. Keep geometric-height truth,
typed identity/finite/source-age/payload caps; do not accept barometric-only rows as
known ellipsoidal altitude just to increase counts.
**Red proof:** Valid synthetic contacts inside agreed scope/frustum at0.5Mm,2Mm and
the current home camera; prove actual glyph/point visibility at each admitted display
height. Separately reproduce unavailable/429/timeout/malformed/source-stale behavior.
Record whether camera/view anchor or observer determines fetch scope.
**Proposed quantitative acceptance:** At each agreed view,≥1 qualifying fixture is
visibly drawn, selectable and focusable; expected count equals known valid/capped
fixture count, with occluded/filtered exclusions explicit. Source valid time/age and
coverage are displayed. Poll cadence and operation timeout remain documented current
30s/8s transport budgets unless approved; no duplicate polling for a shared source.
If bounded moving-target follow is approved, prove stable ID through≥3updates with
no camera ownership conflict. Motion/render reuse must not fabricate future samples.
**Negative behavior:** No fake contacts on503; unavailable independently reported.
Allowed fallback reports its own source/coverage/time; no silent global claim.
**Regression:** Deterministic admission/motion/count/error tests, Docker actual canvas
altitude/selection/follow, disable/re-enable, observer change, late responses and
unified/standalone Sky wheel/search smoke; common artifact/cleanup rules apply.
**Stop:** Approved coverage usability proven with source success when feasible;
if provider cannot be accessed, mark live gate BLOCKED, retain fixture proof and
request provider decision rather than claim operational readiness or broaden scope.

## C5.7-B — Satellite population and tracking correctness

**Entry:** Resolve OD2 default groups/density/caps/device/follow budget. Current
stations-only/cap100/15s positions are intentional scope, not proof missing TLEs.
No fresh satellite population comparison passed in audit (six upstream groups502).
**Candidate scope:** Evaluate stations/visual/gps-ops/glo-ops/galileo/geo core groups;
dense Starlink disabled by proposed default. Owner must approve exact populations/
max admitted/rendered/label/LOD budgets; no uncontrolled global flood or AboveMe flood.
**Ownership/reuse:** Evaluate `createSatellitesLayer`, `createSatelliteSource`, cached
satrec/NORAD dedupe/SGP4/rings and tracking; shared allowlisted acquisition/cache if
needed. Keep strict69-character checksum/NORAD/finite/≤7day epoch guards until a
separate qualified science/format policy changes them. Source-age and propagation
time are different; provider refresh is not position update cadence.
**Red proof:** A fixture containing known duplicates, multiple allowed groups,
invalid checksums/epochs and partial group failure; compare expected unique admitted
NORADs with rendered/capped counts. Reproduce group URL ignored by stations transport.
**Proposed quantitative acceptance:** Every requested group is allowlisted and
actually acquired or individually unavailable; duplicates counted once. Counts
reconcile parsed→valid→unique→admitted→capped→visible. Position update candidate≤1s
for core and tracked target at each render opportunity; approve/capture actual
performance thresholds before activation. Track≥3position updates without jump to
another ID; orbital ring/follow if approved uses one consistent sample time. Unselected
dense work is disabled or bounded/chunked; clustering/LOD must disclose hidden counts.
**Negative behavior:** All-source failure retains only marked old source data or
unavailable, without new source time; partial groups stay partial; stale checksum
rejections never become invented coordinates. Shared acquisition follows provider
cache/update policy, not each browser reload. Destroy aborts loads/loops/primitives.
**Regression/stop:** Source/cache/dedupe/SGP4 finite/error fixtures, Docker count/LOD/
focus/follow/disable and source failure. Do not claim a count deficit without the
selected source and admission/cap accounting. Live/source gates and approved budgets
must pass; unresolved legal/performance/population decision blocks expansion.

## C5.7-C — Weather usability

**Entry:** Resolve OD3; proposed core is current modeled observer-point conditions
and the existing separate latest-CONUS radar snapshot. Broad weather maps are not
approved. The point actually passed200/one ready point in audit; expected field
behavior was not proved. Cloud% is not seeing/transparency or a global cloud mask.
**Ownership/reuse:** `createWeatherAdapter`, upstream `normalizeRegionalWeather` /
`weatherCodeLabel`; existing FastAPI radar `normalize_radar` and `createEventAdapter`.
Investigate weather source/clock/render export/hooks for separately approved future
products, without importing app internals. Preserve point UTC valid time, modeled
semantics and distinct radar exact timestamp/image lease/CONUS coverage.
**Red proof:** Observer-point control activation with one valid fixture; record UI
visibility/discovery/focus and facts. Reproduce absent wind facts despite requested
field, or specify an approved smaller request. Distinguish point, radar, unsupported
wind/cloud/lightning/cyclones and unavailable source.
**Proposed quantitative acceptance:** One valid point is discoverable/selectable
with location/source/valid time/temperature/clouds and supported wind facts; absent
fields remain unavailable.≤2h point valid-time admission and5min/12s polling/operation
budget preserved unless separately changed. Radar has exact advertised timestamp
and leased image,≤30min source age, CONUS-only coverage and snapshot disclosure;
coverage marker is not a weather event. No global visual/weather parity claim.
**Negative/regression:** Timeout/invalid/expired/current-provider outage, radar
timestamp/image mismatch/expired lease, layer isolation, observer changes, latest
command wins, point/raster selection/disable and credits. Weather history, forecast
issue/valid time and live aircraft/TLE wall clock cannot be collapsed into one clock.
**Stop:** Current supported products are visibly useful and honestly described;
additional weather products get separate owner scope/provider/hook approval.

## C5.7-D — Earth space background

**Entry:** Resolve OD4/OD6 starbox asset/credit/device budget. Confirm current
`ViewerController` explicit `skyBox.show=false`, standard upstream enabled.
**Ownership/reuse:** Owned Viewer/Cesium standard skybox/Sun/Moon; evaluate upstream
configuration only. No second Stellarium, Gaia catalog, shared science renderer or
claim of time-correct scientific stars. More sophisticated background stays F.
**Red proof:** Docker captured space-background views demonstrate disabled standard
skybox and compare approved enabled configuration at multiple camera orientations.
**Proposed quantitative acceptance:** Standard permitted textures load with0asset
404s/fatal page errors, stars visually present in appropriate outward views, credits
retained; exactly1owned Viewer/active renderer.≥5enable/switch/departure cycles show
no resource/listener accumulation; device FPS/memory budget agreed before approval.
**Negative/regression/stop:** Missing texture explicit fallback, Sun/atmosphere/globe
unchanged unless approved, disable/destroy, desktop/mobile space/ground views, Sky
wheel/search/selection. Stop at qualified basic presentation, not scientific catalog.

## C5.7-E — Integrated Earth/Sky qualification

**Entry:** A–D scoped acceptance and owner decisions closed, final candidate exact
head/artifacts/rollback frozen. Do not reuse historical passing counts as new proof.
**Ownership:** Product state/bridge/serial lifecycle, SWE native input/math, owned
Earth Viewer and bounded wrappers. No extra feature code during qualification.
**Red/negative reproduction:** Carry every named A–D red case plus source errors,
newer-user-command/late-client races and lifecycle cleanup; genuine cached-page
restoration requires `pageshow.persisted===true`, not merely Back navigation.
**Proposed quantitative acceptance:** All relevant unit/API/native-science and
Docker browser suites pass0failures/0unexpected skips. Desktop1440×900 and mobile
390×844: actual canvas wheel moves native FOV inward/outward at≥2scales on both Sky
surfaces; canonical search/selection/focus and string IDs; Earth count/scope/LOD/
selection/follow; C5quakes/perimeters/radar and C5.5CONUS HD/global fallback remain
usable.≥5serial Sky→Earth→Sky cycles leave exactly1active heavy renderer, no new
page exceptions/overflow/resource leaks; genuine Sky/Earth bfcache restores intent
without duplicate timers/viewers or dead interaction. Credits and failure states
remain accessible with expanded sheets/immersive. Capture source ages/coverage and
environment/device measurements; known unrelated limitations stay explicit.
**Artifact/stop:** Verify every rebuilt renderer's owned source inputs, installed/
served payload/metadata and shared protocol against final hashes. Review checks and
unresolved threads; no merge/release/production readiness inferred from green CI.
Stop with scoped technical proof and owner acceptance pending; do not begin C6.

## Owner Decision Register

OD1 — APPROVED FOR B-FIRST REGIONAL RECOVERY. WORLDWIDE OPTION C CONDITIONAL / NOT AUTHORIZED FOR ACQUISITION.

Owner authorization: 2026-10-08 C5.7-A Aircraft Operational Recovery prompt.
Only C5.7-A is active: settled-camera 100 NM regional ADSB.lol access with ODbL
attribution, no guaranteed public capacity, 2 MB / 2,000 rows, no faster than
30 seconds shared provider dispatch, 8 seconds whole acquisition. Desktop/mobile
detailed glyph planning ceilings 1,000/300; the qualified implementation reduces
mobile to100 and uses the same stricter desktop/mobile cohort at overview height. No new external model/media assets (OD6), no OpenSky/global acquisition.
See [aircraft recovery evidence](../validation/C5_7_A_AIRCRAFT_RECOVERY_EVIDENCE.md).


OD2–OD6 remain **UNRESOLVED**. Proposed default is not owner approval. Record owner,
date, accepted scope/budgets/terms and evidence before unlocking dependent work.

| ID / decision | Status | Proposed default | Alternatives / trade-offs | Cost/license and approval block |
| --- | --- | --- | --- | --- |
| OD1 civil aircraft | APPROVED FOR B-FIRST REGIONAL RECOVERY. WORLDWIDE OPTION C CONDITIONAL / NOT AUTHORIZED FOR ACQUISITION. | Preserve current near-observer scope; fix usable display/status and evaluate bounded motion/follow | Regional view-anchored fallback or licensed global source; more coverage raises quotas/costs/data and rendering budgets | OpenSky intended-use/account agreement; ADSB.lol ODbL/service stewardship; exact fallback and paid calls blocked until choice. |
| OD2 satellite populations | UNRESOLVED | Evaluate six core groups; dense disabled; retain strict guards | Stations-only corrected experience or selected core subset; optional budgeted/clustering dense later | Exact admitted/render/label/LOD/propagation/device budgets unresolved; provider shared-cache policy; expansion blocked. |
| OD3 Weather products | UNRESOLVED | Point conditions plus existing CONUS snapshot radar, clear separate controls/facts | Regional clouds/wind/lightning/cyclones/history in later Earth phases | Open-Meteo free hosted endpoint noncommercial restriction separate from data license; visual product/service/hook/coverage terms; added products blocked. |
| OD4 skybox | UNRESOLVED | Standard Cesium stars as visual background | Keep disabled with explicit product rationale; science/time-aware background in F | Texture/dependency notice and performance budget; configuration change blocked until approval; no scientific catalog claim. |
| OD5 C6 providers/accounts/budget | UNRESOLVED | Ordered keyless/entitled-provider qualification, no purchase or new key | Approved Google/ion/commercial mix versus licensed/keyless global imagery/terrain; coverage/detail/device cost varies | Accounts, maximum spend, quota/cache/distribution/credits/security and service scale unresolved; provider-specific C6 code blocked. |
| OD6 media/assets | UNRESOLVED | No new upstream bundled models/media/restricted packs; glyphs/approved standard assets | Per-asset licensed models/imagery/CCTV where useful | Source MIT excludes data/media rights; NC/SA, privacy and attribution/distribution; downloads/bundles blocked until manifest/approval. |

## Exit / approval handoff

Report exact files/commits/artifacts/commands/failing-to-passing proof, actual live
versus fixture results, source/count/coverage/error/cleanup evidence, reviews and
known gaps. Completed bounded packages do not equal full God's Eye parity, global
weather, validated astronomical passes or production readiness. Owner approval
of this specification activates nothing by itself unless it explicitly authorizes
the named package and decisions. Current next action is owner review of the bounded C5.7-A PR, regional
provider/access/capacity qualification and real-device quality limitations.
Fixture proof and local restoration do not authorize merge, worldwide acquisition
or C5.7-B.
