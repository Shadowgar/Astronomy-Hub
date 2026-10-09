# C5.7-A aircraft recovery evidence

Owner authorized 2026-10-08, single agent. Starting main
`8270e782f73d4df58b16e762cdb4f0031a37ada3`; branch
`c5-7-a-aircraft-regional-recovery-1`. Bounded qualification completed on
2026-10-09; normal local development is restored. **TECHNICALLY QUALIFIED —
HUMAN QUALITY REVIEW PENDING. LIVE OPERATIONAL READINESS: BLOCKED.**
This is a reviewable fixture-qualified package, not operational/production or
merge approval. Only source availability/access/capacity and owner quality gates
remain; no requested local verification is skipped.

OD1 — APPROVED FOR B-FIRST REGIONAL RECOVERY. WORLDWIDE OPTION C CONDITIONAL / NOT AUTHORIZED FOR ACQUISITION.

Only A is authorized. OD2–OD6 remain unresolved; OD6 allows no new external
models/media in this package. No production, accounts, purchases or deployment.
Historical audits and their conclusions are unchanged.

## Context and execution ledger

Loaded CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST, SYSTEM_VALIDATION_SPEC,
DOCUMENT_INDEX, PROJECT_STATE, EARTH_CAPABILITY_PLAN, C5.7/C6 specs,
UNIFIED_UNIVERSE_ARCHITECTURE, STACK_OVERVIEW, ADR0009, canonical reconciliation,
divergence, traces, provider forensics, public export audit, workspace design spec,
Phase C, C5 expansion and C5.5 mapping evidence. Manifest packs plus explicitly
requested aircraft sections; no broad docs scan. New owner authorization overrides
older docs-only/no-C5.7 checkpoints for A only. Stale nested Babylon/v1-only rules
are superseded by current root runtime/architecture authority.

Ledger: verified baseline/preservation → upstream seams → deterministic red proof
→ bounded implementation → units/Docker/browser → two clean builds/attestation
→ final preservation/review/PR without merge. Evidence scratch directory:
`/tmp/oras-c57-a-qualification-20261008`. Only reversible local/disposable apps
may change; PostgreSQL/Redis identities and owner mounts/data remain preserved.

## Upstream seam decisions

Pin `e7707d9a0f34d9fbffc300023c319f95caa5be30`, unchanged and clean.

| Seam | Decision | Executed implementation and reason |
| --- | --- | --- |
| Public factory `createCivilFlightLayer` | EXCLUDE WITH DOCUMENTED REASON | `flights/lifecycle.js` unconditionally loads `/models/airplane.glb`; disabling model parameters does not suppress preload. App/cockpit/global handlers exceed this owned glyph-only scope. |
| ADSB normalization | REUSE EXACTLY | Public `sources/adsb-lol`: `normalizeAdsbLolPointResponse`; `sources/live`: `normalizeOpenSkyAircraft`. Strict raw position-age and geometric-height admission runs before coercion/fallback. No live OpenSky call. |
| Record lifecycle/altitude | WRAP EXISTING CODE | Public `layers/flights/records`: `FlightRecords.receive/forget`. No geoid/terrain enrichment, warming or model downloads. Only admitted real geometric altitude reaches Cartesian positions; upstream default/sticky barometric values are never exposed as source facts or render height. |
| Feed/ingestion | WRAP EXISTING CODE | Public `layers/flights/ingestion`: `createFlightFeed/createIngestion`. Injected bounded same-origin FastAPI source, region query, accepted IDs/status. Hub owns scheduling and abort lifetime. Worldwide default coverage immediately replaced with explicit 100 NM region. |
| Motion | PORT MINIMALLY | `flights/motion.js:_deadReckon` bracketing loop, five real fixes, 30-second display delay; `aircraftPolicy.bracket` clamps outside sample span. Exact public `lerpAngleDeg`; no backwards/forward dead reckoning, predictive trails or future observations. |
| Orientation | REUSE EXACTLY | Public `aircraft`: `screenProjectedRotation` and `lerpAngleDeg`; no deep imports or app state. |
| Glyph/point LOD and picking | KEEP JUSTIFIED HUB CODE / MINIMAL PORT | Existing qualified Hub glyph and Cesium Entity integration keep SelectionStore/picking. Upstream distance-aware representation policy motivates glyph below2Mm/point above, with horizon/frustum counting. Detailed cohort caps apply at every height; overview never increases source scope. |
| Provider/fallback | KEEP JUSTIFIED HUB CODE / EXCLUDE | FastAPI typed2MB/2,000-row/8s boundary; shared Redis coalescing and one dispatch/30s across all regions/workers. No unauthorized OpenSky/global/fallback provider. ADSB.lol ODbL retained; public capacity is not guaranteed. |
| Focus/follow/disposal | KEEP JUSTIFIED HUB CODE | One Hub Viewer, CameraController/SelectionStore/bridge/lifecycle. Single-aircraft follow shares existing track boundary; user interrupt/failure/disable/departure stops it. Camera coverage frozen during aircraft focus/follow, never global fanout. |
| Models/cockpit/terrain coasting/global app | EXCLUDE WITH DOCUMENTED REASON | OD6/source/ownership budgets prohibit model/media preload, new terrain per-contact calls, app UI/Viewer and extrapolated telemetry. |

## Scope, counts and known limits

Observer region is initial/default. Settled center-of-canvas ellipsoid intersection
selects a rounded0.1° query. Retain current100NM region within50NM of its center;
otherwise invalidate/abort old request and debounce1s. Eight browser cache entries,
30s receipt TTL; source time is never advanced by cache. Cross-worker Redis region
success/failure entries expire30s/at least60s (provider Retry-After honored) and a shared30s dispatch lease prevents client
fanout. Cache service unavailable means controlled source unavailable, no ungated
provider fallback. Other regions can receive429 while the shared budget is busy.

Source rows≤2,000, bytes≤2MB, whole backend acquisition≤8s. Active refresh≥30s
completion-scheduled. Desktop/mobile detailed and overview cohort≤1,000/100 (mobile reduced from the provisional 300 after measured low frame cadence),
stricter than the future overview5,000/1,500 ceilings. Labels only selected;
models0; followed contacts≤1. Source details separate raw/parsed/valid/unique,
filtered/outside/duplicates/admitted/cohort-capped/renderable/camera-visible.
Camera-visible counts use LOD/horizon/frustum policy; screenshots independently
prove drawn pixels for fixtures. No claim that regional data covers the world.

Motion is delayed display between actual source observations, or held real fixes.
Raw position/geometric height/time remain source facts, estimated display is labeled.
Provider failure clears current markers, preserves last-success source time, and
retains at most the selected hidden unavailable detail. No new successful timestamp.

## Red proof before promotion

Original Earth artifact
`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`.
`red-browser.log`:10tests,6passed/4failed. Valid aircraft count1 had6yellow pixels
at514,674m,0at2,222,089m and0at15,621,863m. The first threshold>8 was too strict
for the existing small glyph; corrected to>2 and moved fixture away from ORAS
marker overlap. The two high-altitude failures are true zero-pixel regressions.
Actual arrow-key camera movement produced only repeated observer-region requests.
503/429/timeout/malformed/stale remained unavailable with a healthy Viewer.
Empty-response assertion initially accepted loading via text matching; tightened to
require provider ready/count0 for final qualification.

`red-unit.log`: future-position assertion failed1versus0; refreshed direct run
3passed/1failed. `red-backend.log`:3different client regions caused3dispatches,
4passed/1failed. Green final results are recorded below after qualification.

## Exact loaded documents

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/DOCUMENT_INDEX.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/EARTH_CAPABILITY_PLAN.md`
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md`
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`
- `docs/architecture/STACK_OVERVIEW.md`
- `docs/architecture/decisions/0009-owned-earth-feature-reuse.md`
- `docs/audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md`
- `docs/audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md`
- `docs/audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md`
- `docs/audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md`
- `docs/audits/GODS_EYE_PUBLIC_EXPORT_AUDIT_2026-10-05.md`
- `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`
- `docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md`
- `docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md`
- `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md`

## Final artifact and preservation

Two independent clean pinned builds, `p2-a` and `p2-b`, matched every
payload plus release metadata: 513 identical files, 512 payload files.
Final Earth artifact: `bf1763b8aebe0ac7ce64df2e23772d29570d0c4e9631c525893a781400903f71`.
Cesium remains 1.138.0. Approved attestation tooling generated the lock/version
metadata; no hashes were hand-edited. Docker HTTP verification checked all512
Earth payload files and96 unchanged Sky installation files at port4183.

Sky artifact: `b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`.
Rollback Earth artifact: `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`;
owner installation retains all original payload bytes. Source pin, native/vendor
Sky files, shared protocol and historical audits remain unchanged.

Fresh preservation comparison verifies both existing PostgreSQL/Redis container
identities and mounts, the exact81-volume name set, owner branch/head, and owner
unstaged `.vscode/settings.json` hash
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
No data reset, reseed, migration, prune, production, SSH, Cloudflare, oras.org,
purchase, account, provider switch, global acquisition or new model/media work.

## Provider readiness

One bounded live regional request through the Docker FastAPI path returned
HTTP503, `{"detail":"Aircraft source unavailable"}`. Actual live count is
unknown. Deterministic fixture success does not prove live provider permission,
capacity or availability. **Live operational readiness: BLOCKED.**
ADSB.lol attribution/ODbL1.0 remains visible. OpenSky needs a written agreement;
no live OpenSky request was added. Worldwide Option C requires a separate owner
provider/access/cost/resource decision. OD2–OD6 remain unresolved.

## Verification commands and supporting results

All commands run from the isolated branch unless explicitly stated. Raw logs and
screenshots are in the evidence scratch directory. Browser suites use one worker
against Docker port4183 with `PLAYWRIGHT_SKIP_WEBSERVER=1` and
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4183`.

| Command | Result |
| --- | --- |
| `docker compose -p oras-c57a-qualification -f /tmp/oras-c57-a-qualification-20261008/compose.yml exec -T c57-backend python -m pytest backend/tests/test_earth_aircraft.py backend/tests/test_earth_events.py -q` | Final 46 passed, 0 skipped; six existing library deprecation warnings. Actual Redis coalescing/budget tested, unique test namespace only. |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` | 89passed,0failed/skip. Export-boundary subprocess needs unsandboxed local IPC; supporting sandbox attempt failed that test only, complete rerun passed. |
| `npm test -- --run` in frontend | 229passed across28files. |
| `npm run typecheck` and `npm run build` in frontend | TypeScript and Vite passed. |
| `python3 -m unittest tests.validation.test_reconciliation_docs` | 11passed; exact bounded OD1 state allowed, generic OD1/global approval and OD2–OD6 promotion rejected. |
| `python3 scripts/validation/validate_architecture_docs.py` | PASS:279doc entries,277task+2global,50checkpoint docs,1379relative links,9ADRs. |
| `python3 scripts/validation/validate_reconciliation_docs.py` | PASS:67capabilities,51entrypoint references,404links,58fragments; bounded OD1 only. |
| `ORAS_EARTH_OUT=/tmp/oras-c57-a-qualification-20261008/p2-a bash scripts/runtime/build_owned_earth.sh` and independently `p2-b` | Both clean builds passed; all513file hashes identical. |
| `python3 scripts/runtime/record_runtime_versions.py /tmp/oras-c57-a-qualification-20261008/p2-a` | VERIFIED final artifact; unchanged Sky lock. |
| `python3 scripts/runtime/earth_artifact.py verify --source /tmp/oras-c57-a-qualification-20261008/p2-a` | VERIFIED source inputs/dependencies/payload. |
| `python3 /tmp/oras-c57-a-qualification-20261008/verify-served.py` | PASS all512Earth/96Sky HTTP bytes. |
| `python3 /tmp/oras-c57-a-qualification-20261008/preserve.py` | PASS datastore/settings/81volumes/pin/nativeSky/rollback preservation. |

The provisional7ad3 artifact campaign passed13/14 in15minutes; lifecycle cache
assertion failed and was strengthened to await the actual settled home region.
The final reproducible artifact campaign includes that correction, device resize
admission and the100-contact mobile reduction. Its exact outcome is superseded by the final bf176 campaign recorded below.

## Historical acceptance evidence ledger

At the pre-cache-fix dae7 artifact, single-contact raw/parsed/valid/admitted/renderable/visible
counts were all1, filtered/capped0. Actual camera heights/pixel counts:
514,673.6m/74pixels (glyph), 2,222,088.9m/54pixels (point),
15,621,863.0m/57pixels (point). Each screenshot uses the actual Cesium canvas.
Camera exploration moved the acquisition center from41.3,-79.6 to41.0,-50.4;
all requested URLs remained regional `lat/lon` requests with100NM backend radius.
Fixture request interception intentionally bypasses provider access; only the
Docker/Redis dispatch tests prove cross-client upstream acquisition limits.

Dense desktop pre-cache-fix dae7 artifact fixture reconciles2,000 fetched/parsed/valid/admitted,
0filtered/duplicates/outside,1,000capped,1,000renderable/visible. Measured RAF
cadence2.277FPS, disabled baseline2.462FPS (ratio0.925), reported heap64.0MB,
acquisition1008.4ms, entity update18.0ms. Viewport shrink immediately reconciles
1,900capped/100renderable/visible without waiting for another source request.
This host uses Chromium software rendering; these are local measurements, not
validated hardware/mobile throughput promises.

Dense mobile pre-cache-fix dae7 fixture reconciles2,000 fetched/parsed/valid/admitted,
0filtered/duplicates/outside,1,900capped and100renderable/visible. RAF cadence
4.206FPS, disabled baseline60.446FPS (ratio0.0696), reported heap42.1MB,
acquisition968.7ms, entity update4.8ms. The earlier300-contact campaign measured
4.973FPS/60.434FPS disabled and50.4MB heap. Reducing mobile to100 reduced cohort
and reported heap, but **did not demonstrate a frame-cadence improvement**.
Desktop/software-renderer baseline is also slow. No60FPS or real-device
performance qualification is claimed. Dense mobile performance remains a
Category B limitation requiring human quality review; technical source/count
and lifecycle qualification does not accept this performance for deployment.

Pre-cache-fix dae7 artifact selection/Focus/follow passed: stable `aircraft:abc123`, actual
camera height below50km after Focus, before-follow update count3, final count7,
and at least three additional source observations while followed. Stop tracking
returned control; subsequent source503 stopped follow, hid current positions and
preserved last-success source metadata. Unit bracketing tests verify half-span
interpolation and clamps before/after real fixes; future/stale observations and
missing geometric heights are rejected. No predicted telemetry/trails are drawn.

The full pre-cache-fix dae7 artifact14-test campaign returned13passed/1failed in13.8minutes.
Its failing lifecycle assertion captured an earlier ready region before Cesium
finished delivering camera changes, then compared it during the remaining move.
The focused correction waits3seconds for camera settlement before releasing the
obsolete response; it also verifies source age below5seconds before testing a
30-second cache hit. No runtime/source/artifact change was made for this test
correction. A supplementary test verifies manual-input follow interruption,
tracked Viewer destruction on mode departure, and zero model request URLs.
Focused correction results are recorded below; the initial full-campaign failure
is retained here rather than reported as a green single campaign.

Direct actual-camera cache-return red proof on the dae7 artifact: a fresh initial
41.3,-79.6 region was acquired, camera exploration acquired41.0,-77.0, then the
home flight anchored41.8,-79.6 and dispatched a third request within18seconds.
The initial region still covered that nearby home anchor. The red test failed
41.8versus41.3 and cachedfalse. Correction stores each cached acquisition center
and selects the nearest fresh cache center within50NM of the settled anchor,
without changing its disclosed100NM coverage or source time. Expired/outside
caches are not used; the eight-entry/30second bounds remain. A focused unit proves
near/far/expired choices and nonmutation. Source change requires another complete
clean build pair and final served-byte verification.

The two focused dae7 corrections passed2/2 in3.2minutes: obsolete response rejection,
cache disable/re-enable with cachedtrue and unchanged request count, no calls during
31-second Sky departure, valid return; manual zoom stopped follow, mode switch
reported disposed/viewerDestroyedtrue, and model requests0. At that historical checkpoint, 230e source added the geographic cache-return fix.
The ensuing 16-test campaign was interrupted for the actual P2 review corrections
recorded below; its partial results are not final qualification.

Final230e direct-cache green proof:1passed in28.5seconds. Three requests acquired
the initial/explored regions; after actual return, request count remained3,
coverage center41.3,-79.6 and cachedtrue, with unchanged source time/17.45s age.
Both final cache-a/cache-b builds match513files; all512Earth and96Sky served
bytes verify. At that historical checkpoint, the 16-test campaign, existing regressions and
restoration were pending. Final qualification and restoration are recorded below.

## Exact changed files

- `backend/app/routes/earth.py`
- `backend/app/services/earth_aircraft_cache.py`
- `backend/tests/test_earth_aircraft.py`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md`
- `docs/execution/EARTH_CAPABILITY_PLAN.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/validation/C5_7_A_AIRCRAFT_RECOVERY_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/src/features/workspace/LayerPanel.tsx`
- `frontend/tests/e2e/aircraftRecovery.spec.ts`
- `frontend/tests/e2e/ownedEarth.spec.ts`
- `frontend/tests/e2e/workspaceLayerRestore.spec.ts`
- `integrations/renderers.lock.json`
- `runtimes/earth-runtime/core/CameraController.mjs`
- `runtimes/earth-runtime/core/EarthRuntime.mjs`
- `runtimes/earth-runtime/core/RuntimeBridge.mjs`
- `runtimes/earth-runtime/entry.mjs`
- `runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`
- `runtimes/earth-runtime/layers/PollingLayer.mjs`
- `runtimes/earth-runtime/layers/aircraftDisplay.mjs`
- `runtimes/earth-runtime/layers/aircraftPolicy.mjs`
- `runtimes/earth-runtime/layers/data.mjs`
- `runtimes/earth-runtime/layers/entities.mjs`
- `scripts/runtime/record_owned_earth.py`
- `scripts/validation/validate_reconciliation_docs.py`
- `tests/earth/admission.test.mjs`
- `tests/earth/aircraft-policy.test.mjs`
- `tests/validation/test_reconciliation_docs.py`

## Historical GitHub delivery checkpoint

PR [#67](https://github.com/Shadowgar/Astronomy-Hub/pull/67), OPEN/unmerged.
Logical commits: `95ea0c4f` backend, `8c8bf917` runtime/UI/tests,
`8f166827` artifact metadata, `286be990` OD1/docs guards/evidence.
Normal `@codex review` and `@coderabbitai review` requested. CodeRabbit initially
skipped automatic review under its OSS repository policy, so review was requested
explicitly; autopilot was not enabled. Copilot reported quota exhaustion and
supplied no code review. Exact head/reviews/threads/checks will be refreshed at
final handoff. No inference of approval from an empty review-thread list.

## Bounded actual review corrections

Codex reported two P2s on reviewed head286be990: initial enable after settled
camera exploration still used the observer; an alphabetical capped cohort could
remove a still-valid selected/followed contact when lower IDs arrived. Both were
verified, not accepted solely from review wording. Camera-enable browser red
confirmed observer coverage at the distinct explored view. The first cohort test
incorrectly assumed diagnostics selection contains an ID; corrected to read the
actual source-backed Identity fact. Its independent red showed selectedabc000
removed and trackingnull after100lower IDs arrived, despite abc000 remaining in
2,000valid/admitted rows. These are real scoped failures.

Correction: evaluate settled view against the existing50NM hysteresis before
first enable, then choose its applicable fresh cached or rounded regional anchor.
Observer default remains supported near home. Cap selection reserves only still-
admitted selected/followed identities, then fills deterministic alphabetical slots;
missing/invalid contacts are not synthesized.89runtime units and11document units
pass. The document validator now checks the OD1 authorization block itself for
all acquisition limits, including2,000rows, and rejects changes masked elsewhere.

CodeRabbit's generic ApiError/Retry-After suggestion does not affect the actual
bounded aircraft fetch consumer. Its30second source backoff matches the route's
fixed budget429 Retry-After30; upstream longer backoff is enforced by Redis.
This was explained with actual call-path evidence in the original thread. No
unrelated generic API-client changes or recursive audit/autopilot were started.
Its final-record comment requires complete campaigns and restoration; the final
qualification and restoration outcomes are recorded below.

The superseded230e full16-test campaign was stopped for these corrections after
12passed,1interrupted (follow),3not run; this is not a green full campaign. The
finalbf176 artifact receives a fresh complete18-test campaign and existing
regressions, plus a new independent clean build pair and served-byte proof.

P2 browser green:2passed in1.6minutes on bf176. Enable requested41.0,-72.7
instead of observer41.3,-79.6; the final suite additionally waits for the new
request before asserting ready. Selected/followedabc000 remained selected and
tracked after100lower-sorting IDs arrived, with2,000admitted/100renderable/
1,900capped. New P2 source commit `c71097e2`; authorization-limit guard commit
`fbf86fad`. Both independent final builds match513files, and all512Earth/96Sky
HTTP-served files verify. Those focused results were followed by the fresh complete 18-test campaign
recorded below; no merge approval is inferred from test results.

## Completed final aircraft campaign

On finalbf176, the complete18-test aircraft suite passed18/18,0failed/0skipped,
in16.4minutes. This is a fresh complete campaign after both reviewed source
corrections, not an aggregation of provisional runs. Command:

```sh
cd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4183 AIRCRAFT_EVIDENCE_DIR=/tmp/oras-c57-a-qualification-20261008/final-p2-screens npx playwright test tests/e2e/aircraftRecovery.spec.ts --workers=1 --output=/tmp/oras-c57-a-qualification-20261008/final-p2-browser
```

Final raw/parsed/valid/admitted/renderable/camera-visible counts all1 for the
single-contact fixtures, filtered/capped0. Actual camera/pixel evidence:
514,673.6m/76pixels glyph;2,222,088.9m/54pixels point;
15,621,863.0m/170pixels point. Actual canvas screenshots and serialized Cesium
LOD/horizon/frustum diagnostics support the rendering claim. Global view remains
100NM regional coverage, with no worldwide acquisition or claim.

| Final dense fixture | Source/admitted | Capped/renderable/visible | RAF enabled/disabled | Reported heap | Acquisition/entity update |
| --- | --- | --- | --- | --- | --- |
| Desktop | 2,000/2,000 | 1,000/1,000/1,000 | 2.989/3.569FPS, ratio0.837 | 76.6MB | 823.2/16.7ms |
| Mobile | 2,000/2,000 | 1,900/100/100 | 6.159/60.325FPS, ratio0.102 | 42.1MB | 435.7/2.3ms |

Source rows were valid/unique/within coverage; no filtered rows. Shrinking desktop
to390px immediately produced100renderable/visible and1,900capped. Mobile was
reduced from the provisional300 to100; the host's repeated4–7FPS mobile results
remain slow and variable. No causal performance improvement, hardware/device
throughput,60FPS or human-quality acceptance is claimed from these measurements.

The final follow case observed beforeFollow3/updates7, at least three added
observations while followed. Selection/Focus and single-follow identity remained
stable; failure/manual zoom stopped follow. Mode departure destroyed the tracked
Viewer; model network requests0. Obsolete responses were rejected, fresh cache
re-enable caused no duplicate call, and31seconds in Sky caused no aircraft request.
Actual camera return reused the original fresh41.3,-79.6 region with cachedtrue,
unchanged source time and no extra acquisition. Enabling after exploration
requested41.0,-72.7 and reached ready/count1. The valid selected/followedabc000
survived100new lower IDs with2,000admitted/100renderable/1,900capped.

The completed final regression qualification is recorded below: 43 tests across
eight files, including live opted-in HD/global imagery and genuine Sky/Earth
bfcache. No other phase features were implemented by that preservation campaign.

## Final reviewed backend deadline correction

Codex's normal review of `394f6e9414` supplied a third P2: the shared Redis
waiter polled only 80 × 50 ms, giving up around four seconds despite the route's
eight-second whole-call deadline. A fresh Docker regression with one five-second
provider acquisition and two independent worker paths reproduced the failure:
1 failed, `AircraftBudgetError('Shared acquisition pending')`, while the owning
worker completed. No live provider was called.

Commit `fd2163e6` removes only the waiter's shorter deadline. The existing
`read_and_cache` eight-second `asyncio.wait_for` owns acquisition and all Redis
I/O, including polling. Both workers now receive the same five-second result
with one dispatch; a never-completing provider cancels within the unchanged
eight-second deadline and yields controlled source-unavailable errors for both
workers. Complete scoped Docker backend rerun: **46 passed, 0 skipped**, six
existing library deprecation warnings, 15.72 seconds (`docker-backend-final.log`).
Only ephemeral, unique Redis test namespaces were used. Earth builder inputs,
artifact metadata, browser/runtime source and provider dispatch budgets did not
change. This is an actual bounded review correction, not a new review campaign.

## Historical interrupted development-server regression attempt

The first 43-test attempt used Vite development mode at Docker port 4183.
Before the user interruption stopped its process group, the list reporter
recorded **31 passed, 5 failed, 1 interrupted, 6 not run**. The interrupted
test emitted intermediate native search/Focus/wheel results but no completion;
it is not counted as passed. This partial attempt is not a completed campaign.
Its log remains `regressions-browser.log`; failure contexts/screenshots remain
under `regressions-browser`.

Failures were the Earth bfcache test, both Sky bfcache tests, and both native
deselection variants. The canonical native-deselection snapshot showed Earth
unavailable on the mode transition; the unfinished reporter did not provide
complete final assertion errors for the native-search variant. No cause is
inferred for those two failures from the partial output.

A separate bounded Chromium diagnostic proved why genuine bfcache was impossible
in that environment: version 145.0.7632.6 reported `WebSocket` from
`/@vite/client:createConnection` as the parent document's sole rejection reason.
The native Sky child reported no rejection reasons. Original and returned parent
documents had different identities and `pageshow.persisted` count zero. This is
recorded in `bfcache-diagnostic.json`. The served Sky adapter, Hub entry and Vite
config hashes matched branch source; no stale adapter mismatch was found.

Qualification was corrected to the existing compiled Vite preview workflow
inside the disposable Docker frontend, using the already verified current build
as a read-only mount. This removes development HMR without modifying runtime
source or weakening bfcache assertions. The disposable data mounts now use the
original normal-stack catalog, ephemeris and dense-star Source paths read-only.
All 512 Earth and 96 Sky HTTP payloads verified again (`served-preview.log`).
A fresh complete 43-test campaign follows; prior partial results are not combined
into a fabricated all-green campaign.

## Completed final existing regression campaign

The fresh compiled Docker preview campaign completed with exit 0:
**43 passed, 0 failed, 0 skipped in 18.7 minutes**, all eight requested files.
The previous interrupted development-server attempt is retained above; no partial
results are combined into this count. Command (from `frontend`):

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4183 ORAS_LIVE_EARTH=1 npx playwright test tests/e2e/skyUxRegressions.spec.ts tests/e2e/skyNativeDeselection.spec.ts tests/e2e/skyNativeSelectionUrl.spec.ts tests/e2e/skyBfcache.spec.ts tests/e2e/earthExpansion.spec.ts tests/e2e/earthHdMapping.spec.ts tests/e2e/ownedEarth.spec.ts tests/e2e/workspaceLayerRestore.spec.ts --workers=1 --output=/tmp/oras-c57-a-qualification-20261008/regressions-preview
```

Raw log: `regressions-preview.log`. Actual Sky/standalone wheel zoom, native
search/Focus, deselection, URL/reload/mode-cycle identity, observer/time links,
ORAS controls, mobile toolbar/time sheet geometry and independent Sky passed.
Both native-deselection variants recovered with zero page errors. Genuine
Earth bfcache preserved the same imagery runtime and usable bridge. Genuine
pinned and unpinned Sky bfcache preserved the same document; unpinned departure
reported `persisted:true`, 72.3 ms after interaction, recovered controls and
native UTC `2026-10-03T03:00:00.000Z` after the +1h bridge command.

Existing stations/satellites, point Weather, radar, earthquakes, fire perimeters,
source/credits/mobile controls, provider-failure isolation, serial five-switch
teardown and layer preference/departure barriers passed. Existing live opted-in
CONUS HD imagery, failed/stalled-tile fallbacks, explicit recovery, same-scale
global imagery fallback and HD return outside/inside CONUS passed. These are
preserved capabilities, not C5.7-B/C/D implementation.

Genuine bfcache proof applies to the compiled preview environment. Ordinary Vite
development HMR has the separately proven WebSocket caching limitation; runtime
source was not changed to hide or bypass it.

## Disproven null-altitude P1 and permanent guard

The final normal review supplied P1 comment `4230622975`, claiming pinned
`finiteNumber` coerces `alt_geom:null` to zero. Verification contradicted that
source assumption: the public export `./sources/adsb-lol` resolves to
`src/data/adsbLolFallback.js` at the unchanged pin; its helper explicitly returns
null for null, undefined and empty string before numeric conversion. Normalized
state slot 13 remains null, and Hub `admitAircraft` rejects it using
`Number.isFinite(row[13])` before record normalization/display.

Direct `node --input-type=module` proof using the actual public-export mapping:
null/omitted/empty geometric altitude with positive 30,000-foot barometric altitude
normalized to null and admitted zero. Genuine numeric geometric zero stayed
zero and admitted one; 30,000 feet became 9,144 metres and admitted one.
Raw log: `unknown-altitude-normalization.log`. No failing result was fabricated.

Permanent browser guard commit `4b4b324c`: **1 passed in 17.2 seconds** on the
unchanged qualified artifact served by restored Docker port 4173. Valid identity,
position and age with `alt_geom:null` and `alt_baro:30000` gave fetched/parsed 1,
valid/admitted/renderable/visible 0, filtered 1, healthy Viewer and explicit
"positions filtered" disclosure. No visible aircraft targets or geometric-height
facts were manufactured. Exact command (from `frontend`):

```sh
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 AIRCRAFT_EVIDENCE_DIR=/tmp/oras-c57-a-qualification-20261008/unknown-altitude-screens npx playwright test tests/e2e/aircraftRecovery.spec.ts --grep 'unknown geometric altitude' --workers=1 --output=/tmp/oras-c57-a-qualification-20261008/unknown-altitude-browser
```

The existing full 18-test aircraft campaign and this additional focused guard
are separate results, not a claimed full 19-test run. Runtime inputs did not
change; final Earth artifact remains bf176. The P1 thread received source and
browser evidence and was resolved as not reproduced.

## Normal development restoration and final preservation

After the full regression campaign, the three `oras-c57a-qualification` services
were stopped with `docker compose ... stop`; no down/prune/remove-orphans was
used. No Playwright browser roots remain. Existing owner auxiliary containers
were left untouched. A new ignored worktree `.env` was created privately with
mode 0600 from owner configuration, changing only the five data-host settings
to the exact original normal-stack mount Source paths. Owner `.env` fingerprint
remained identical; its contents were never printed.

The existing workflow **`npm run dev:local:build`** ran with **COMPOSE_BAKE=false**
and completed successfully: "Local Hub ready: http://localhost:4173 (startup 55s)."
No current Bake crash is claimed. All five ordinary services are running;
frontend and Earth are healthy. Datastores were retained with `--no-recreate`.
`npm run dev:local:status` confirms the final state. Three qualification services
are stopped (the npm preview container's stop exit code is 1; it was stopped
intentionally after the successful full campaign). Sanitized state record:
`normal-runtime-final.json`.

The newly rebuilt normal backend passed **46 tests, 0 skipped**, six existing
library deprecation warnings, in 14.07 seconds (`docker-backend-normal.log`):

```sh
docker compose --project-name astronomy-hub -f docker-compose.yml -f docker-compose.dev.yml exec -T backend python -m pytest backend/tests/test_earth_aircraft.py backend/tests/test_earth_events.py -q
python3 /tmp/oras-c57-a-qualification-20261008/verify-served.py http://127.0.0.1:4173
python3 /tmp/oras-c57-a-qualification-20261008/preserve.py
npm run dev:local:status
```

Normal HTTP proof verifies all **512 Earth / 96 unchanged Sky payloads**, plus
release/lock/runtime-version equality (`served-normal.log`). Final preservation
comparison (`preservation-final.json`) passes the exact 81-volume set, original
PostgreSQL/Redis identities and complete mounts, exact original astronomy data
mount Sources, unchanged owner branch/head/unstaged settings, owner environment,
clean pinned source, untouched native Sky/vendor/WASM/shared protocol/historical
audits, and every rollback payload byte. Owner root remains
`dev-wsl-performance-repair-1` at `1cb71b848a1ed46390945fe0fa636676b8b8f744`;
only `.vscode/settings.json` is dirty and unstaged, with the recorded unchanged
SHA-256. No owner data reset/reseed/migration/prune or unqualified asset install.

| Preserved datastore | Exact container ID | Exact data mount Source |
| --- | --- | --- |
| /astronomy-hub-postgres-1 | `d855704d450063119c2e268a016455a7249c38989a96031a4e33e4156115fa20` | `/var/lib/docker/volumes/27daeabc58edf44d2e9f90550fb31edb6845d6c4d857d11bb97237fe25e559cd/_data` |
| /astronomy-hub-redis-1 | `1dec6ebffeb9d01114a01e4f540780c2d7fed2b9dec2acaa01c27bb07e21279d` | `/var/lib/docker/volumes/48d5ceaa92624793af9f362e8fc5e5711287422878ffb2273aa53ddcb28d1c78/_data` |

Original catalog, ephemeris and dense-star mounts remain under the preserved
`integration-main-20261005/data/runtime-packs` worktree. Sky/TLE mounts remain
under the owner root `frontend/public/oras-sky-engine/skydata`. These paths are
referenced read-only, not copied, moved or repopulated.

## Historical screenshot namespace restoration

The final architecture validator initially failed because fresh browser output
reused an isolated worktree copy of the registered historical
`output/playwright/earth-expansion/desktop-layers.png` path. It correctly rejected
the changed screenshot hash. All 16 original owner historical files were read
only and still matched their registered hashes; no owner evidence was overwritten.
New campaign images were preserved separately under
`/tmp/oras-c57-a-qualification-20261008/regressions-preview-default-earth-expansion`.
Only this isolated worktree's historical copies were restored from independently
hash-verified owner bytes. `historical-private-evidence-final.json` records the
16 checks and hashes of the retained new images. No registry, historical document
or validator was changed. Final architecture validator rerun passed: 279 document
entries, 8 packs, 50 checkpoint documents, 1,379 references and 9 ADRs. Final
reconciliation validator and all 11 authorization/document units also passed.
Final TypeScript check after adding the focused browser guard passed.

## 35-field owner handoff

Delivery commit SHA and the final exact-head GitHub snapshot accompany this
committed qualification record; the qualification inputs/artifacts below are
fixed. PR #67 remains OPEN/unmerged.

| # | Required field | Outcome |
| --- | --- | --- |
| 1 | Starting/final Git SHAs | Starting 8270e782f73d4df58b16e762cdb4f0031a37ada3. Qualified Earth source c71097e2; final backend correction fd2163e6. Final evidence-only delivery SHA is reported in the final response and PR head. |
| 2 | PR/branch/commits | PR #67 OPEN/unmerged; branch c5-7-a-aircraft-regional-recovery-1. Logical commit ledger below. |
| 3 | Exact reuse | Unchanged public exports: normalizeAdsbLolPointResponse, normalizeOpenSkyAircraft, FlightRecords.receive/forget, createFlightFeed/createIngestion, lerpAngleDeg, screenProjectedRotation. |
| 4 | Hub retained | One Viewer, lifecycle, SelectionStore, CameraController, typed FastAPI DTOs, security/size/deadline guards, existing qualified glyph and attribution/bridge boundaries retained. |
| 5 | Ports/exclusions | Minimal real-fix bracketing/LOD policy; excluded factory/model preload, extrapolated coasting/trails, geoid/terrain enrichment, cockpit/full app and unauthorized providers. Reasons recorded in the seam table. |
| 6 | Acquisition | Same-origin FastAPI 100 NM endpoint; shared Redis dispatch/cache/coalescing; maximum 2 MB, 2,000 rows, 8 seconds. No browser credentials or unauthorized fallback. |
| 7 | Camera coverage | Settled center-canvas ellipsoid anchor, 0.1 degree rounding, 1-second debounce and 50 NM hysteresis; first enable uses a distant settled view; near-home observer default retained. |
| 8 | Provider access | One bounded live probe returned HTTP 503; actual live count UNKNOWN. ADSB.lol ODbL disclosed, capacity not guaranteed. No OpenSky acquisition without written agreement. |
| 9 | Altitude/LOD | Glyph below 2 Mm and point above. Strict real geometric altitude, finite position/time/identity and regional admission; cohort caps 1,000 desktop / 100 mobile at all heights. |
| 10 | Visible evidence | Final canvas evidence: 514,673.6 m / 76 pixels glyph; 2,222,088.9 m / 54 pixels point; home 15,621,863 m / 170 pixels point. Each fixture has one admitted/renderable/visible contact and 100 NM coverage. |
| 11 | Count reconciliation | Dense fixture: 2,000 raw/parsed/valid/admitted, zero filtered. Desktop 1,000 capped / 1,000 renderable/visible; mobile 1,900 capped / 100 renderable/visible. Actual live counts remain UNKNOWN. |
| 12 | Selection/Focus | Actual canvas picking; source-backed identity/provider/geometric height/source-time facts; Focus below 50 km. One owned Viewer. |
| 13 | Interpolation | Five actual fixes; 30-second delayed interpolation between observations, held observations outside the span. No extrapolated or predictive telemetry; estimated display disclosed. |
| 14 | Follow | Stable abc123 across at least three additional 30-second observations (before 3 / final 7); manual zoom and failure stop follow, departure destroys tracked Viewer. Still-valid followed abc000 retained under the 100-contact cap. |
| 15 | Errors/fallback | 503/429/timeout/malformed/stale produce unavailable status with healthy Viewer. Successful empty response is ready/count 0; last-success time preserved on failure; no unauthorized fallback. |
| 16 | Cache/source-load proof | Real Redis cross-worker proof: one dispatch per 30 seconds across regions/clients, same-region coalescing, fail-closed outage and 120-second Retry-After. Five-second owner/waiter success and unchanged eight-second cancellation proven. Eight browser cache entries / 30-second TTL; geographic reuse preserves source time. |
| 17 | Lifecycle | Full 18-test aircraft campaign plus full 43-test existing regression campaign prove disable/re-enable, late-work rejection, 31-second Sky departure, no duplicate requests, tracked Viewer disposal, desktop/mobile five-switch loops and preference/departure barriers. Zero new models. |
| 18 | Performance | Software renderer: desktop 2.989 FPS versus 3.569 disabled, 76.6 MB reported heap, 823.2 ms acquisition / 16.7 ms entity update; mobile 6.159 FPS versus 60.325 disabled, 42.1 MB heap, 435.7 / 2.3 ms. No real-device or 60 FPS qualification. |
| 19 | Budgets/reduction | 100 NM; 2 MB; 2,000 rows; refresh at least 30 seconds; backend whole-call 8 seconds. Desktop 1,000 / mobile 100 (reduced from 300); overview uses same caps, selected labels only, models 0 / follow 1. Future 5,000 / 1,500 overview ceilings authorize no global data. |
| 20 | Red/green | Initial reds and assertion corrections retained; real geographic-cache and three review P2 reds demonstrated. Fresh final aircraft campaign: 18 passed / 0 failed / 0 skipped, 16.4 minutes. Backend waiter red failed once; final backend 46 passed. |
| 21 | Docker/browser | Docker backend 46 passed on both disposable and restored normal runtime; Earth/runtime 89 passed; frontend 229 passed; TypeScript/build PASS; documentation units 11 passed; full aircraft campaign 18 passed plus one focused null-altitude guard. All 512 Earth / 96 Sky served bytes verified at disposable and normal ports. |
| 22 | Existing regressions | Fresh complete compiled Docker preview: 43 passed / 0 failed / 0 skipped in 18.7 minutes across all eight files, including live opted-in HD/global imagery, genuine Earth/Sky bfcache, native deselection/URL/time/wheel/search/Focus and existing Earth layers. Historical interrupted dev-server attempt retained separately. |
| 23 | Final Earth artifact | bf1763b8aebe0ac7ce64df2e23772d29570d0c4e9631c525893a781400903f71; two independent clean p2-a/p2-b builds, 513 identical files / 512 payloads. Approved tooling generated metadata; installed and served bytes verified. |
| 24 | Sky unchanged | b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d; 96 HTTP payloads verified. Frozen native/vendor/WASM, shared protocol and historical audits unchanged. |
| 25 | Pin unchanged | e7707d9a0f34d9fbffc300023c319f95caa5be30 unchanged; tracked source clean. |
| 26 | Owner preservation | Final restoration comparison PASS: exact 81-volume set; original PostgreSQL/Redis IDs and complete mounts; exact astronomy data mount Sources; owner branch/head/settings and environment unchanged; original ca124 rollback bytes preserved. Normal dev restored at localhost:4173; three qualification services stopped and no Playwright browsers remain. |
| 27 | OD1 decision | OD1 — APPROVED FOR B-FIRST REGIONAL RECOVERY. WORLDWIDE OPTION C CONDITIONAL / NOT AUTHORIZED FOR ACQUISITION. |
| 28 | Global blockers | Separate owner approval required for worldwide provider agreements/terms/accounts/costs and operating/rendering budgets. No worldwide acquisition implemented. |
| 29 | OD6 | OD6 remains UNRESOLVED; no new external models/media. Zero model requests proven; existing qualified glyph/Cesium primitives only. OD2–OD5 also unresolved. |
| 30 | Review/check state | Three demonstrated Codex P2s fixed in c71097e2/fd2163e6; scoped OD1 guard corrected in fbf86fad. Null-altitude P1 disproved against pinned source and actual browser, permanent guard in 4b4b324c. Generic API suggestion verified inapplicable and CodeRabbit resolved it. Qualification-code head fd2163e6: test, all four CodeQL analyses/summary and GitGuardian PASS; CodeRabbit status is review-skipped/manual-required, not approval. Copilot quota exhausted; no formal human approval. Final evidence-thread closure and exact delivery-head snapshot are reported in the accompanying final handoff. |
| 31 | Category A | Live source availability/access/capacity qualification remains BLOCKED by HTTP 503; actual live count UNKNOWN. All requested local/runtime/browser qualification completed, with no remaining demonstrated local code blocker. |
| 32 | Category B | Dense software-renderer/mobile cadence remains slow; real-hardware and human product-quality review outstanding. Strict geometric admission excludes unknown/barometric-only heights; global zoom still represents partial regional coverage. |
| 33 | No production/deploy | Local WSL/disposable Docker only. No SSH/Cloudflare/oras.org, accounts, purchases, reset/reseed/migration/prune, new provider/model/media, worldwide acquisition, C5.7-B/C/D/E/C6 activation, production deployment or merge. |
| 34 | Readiness | TECHNICALLY QUALIFIED — HUMAN QUALITY REVIEW PENDING. Fixture-qualified and reviewable; live operational readiness BLOCKED. Not an operational/production or merge-readiness approval. |
| 35 | Next owner decision | Qualify an authorized regional provider/access/capacity path and perform real-device visual/performance review. Keep worldwide acquisition conditional and other phases closed. |

## Logical commit ledger at qualification completion

```text
95ea0c4f C5.7-A: Bound regional aircraft acquisition across clients and workers
8c8bf917 C5.7-A: Reuse flight records for camera-centered regional display and follow
8f166827 C5.7-A: Attest reproducible owned Earth aircraft artifact
286be990 C5.7-A: Record bounded OD1 approval and aircraft qualification evidence
c71097e2 C5.7-A: Preserve viewed coverage and selected aircraft across capped refreshes
fbf86fad C5.7-A: Enforce resource limits within the OD1 authorization block
394f6e94 C5.7-A: Record reviewed corrections and final qualification checkpoint
fd2163e6 C5.7-A: Coalesce workers through the full acquisition deadline
4b4b324c C5.7-A: Verify unknown geometry through the pinned normalizer
```

The final evidence-only commit is the delivery PR head recorded at handoff.
No merge, production deployment, worldwide acquisition or later phase activation.
