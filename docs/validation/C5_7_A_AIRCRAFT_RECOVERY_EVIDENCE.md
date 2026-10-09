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


## PR #67 final correctness and performance qualification — 2026-10-09

This checkpoint supersedes the preceding aircraft qualification counts and
artifact only where fresh results are explicitly recorded below. Historical
runs, failed attempts and rollback payloads remain intact. Single agent; Default
Mode; worktree `.worktrees/c5-7-a-aircraft-regional-recovery-1`, branch
`c5-7-a-aircraft-regional-recovery-1`. No merge or later phase activation.

Loaded context: CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST; the authorized
review/reconciliation/aircraft context covers SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR 0009, PROJECT_STATE, EARTH_CAPABILITY_PLAN,
C5_7_EARTH_CORE_RECOVERY_SPEC and this aircraft evidence document. No full docs
scan or extra project documentation loaded. The active A authorization supersedes
the older no-C5.7 execution descriptions only for this bounded package.

### Original findings and deterministic red/green

GitHub and the isolated checkout both started at
`482f27ada78378f98f1337f06a82632a33703f17`; PR #67 was OPEN against main
`8270e782f73d4df58b16e762cdb4f0031a37ada3`, with eight successful check statuses.
Both original Codex P2s were present and unresolved: comments 4230961022 and
4230961035. No existing correction was reapplied. The earlier null-altitude P1
was already disproved/resolved against the actual pinned normalizer and remains
covered by the browser regression; no extra pre-normalization rewrite was added.

Private raw evidence is retained in `/tmp/oras-c57a-final-review-20261009` and
archived under the ignored worktree directory
`output/playwright/c57a-final-review-20261009`. It is local qualification evidence,
not committed media, actual provider data or physical hardware proof.

- `p2-red.log`: actual production display plus Cesium EntityCollection and pinned
  FlightRecords, **0 passed / 2 failed, exit 1**. After provider failure and five
  minutes, recovery assigned an intermediate old/new position. A successful
  omission removed the selected/followed entity before its same-ID return.
- `policy-red-direct.log`: **6 passed / 2 failed, exit 1**, tests "recovery after
  a five-minute outage holds the new observation instead of interpolating the
  gap" and "interpolation has a bounded 90-second gap and duplicate epochs
  never divide by zero". The earlier sandbox IPC attempt `policy-red.log` is
  retained and excluded as a product red reproduction.
- Subsequent measured optimization reds are retained separately:
  `orientation-red.log` (5/6 pass), `performance-red.log` (5/7 pass),
  `completeness-red.log` (7/8 pass), and `batching-red.log` (9/10 pass).
  Batching reproduced 100 collection notifications rather than one for 100
  genuinely changed positions.
- Final focused policy/display suite: **18 passed / 0 failed / 0 skipped**;
  full Earth/runtime suite: **101 passed / 0 failed / 0 skipped**.
  The full runner attempt during pinned npm replacement is retained as
  `earth-runtime-final.log`: a missing `urijs` dependency was observed while
  npm ci was replacing dependencies, and the sandbox child-process test also
  failed. After build completion, `earth-runtime-final-green.log` proves all
  101 with local test workers; no product change masked that attempt.

The first complete browser run retained **20 passed / 1 failed, exit 1, 20.8
minutes**. The new omission test's runtime assertions all passed (same entity,
follow, counts and old timestamp), then its disclosure assertion incorrectly
searched the compact Selected object header. The failure snapshot shows the
correct missing-contact detail/fact in the expanded `selection context` tabpanel.
Only the test locator changed to that actual user-facing panel; no runtime or
artifact changed. A fresh complete 21-case rerun is recorded below, rather than
adding a focused pass to the failed campaign's count.

### Small corrections and exact upstream reuse

`aircraftPolicy.mjs` permits delayed interpolation only across a positive gap
of at most **90 seconds**; an excessive/duplicate gap holds the genuine newer
observation. Thirty-second display delay, five real fixes, actual source epochs
and 120-second position expiry remain unchanged. No extrapolation or future
telemetry. Provider failure stops follow and hides the last-known selected
position; recovery keeps the same entity when that identity remains justified,
restores its genuine fix and does not restart follow automatically.

`aircraftDisplay.mjs` now calls the unchanged public-export
**FlightRecords.absence(id, {complete, likelyLanded})**. Its pinned record policy
keeps the first two complete missing polls and removes on the third. Incomplete
snapshots do not accrue those complete-missing strikes. Hub's stronger
**120-second actual position age** bound applies even though upstream's partial
receipt grace is five minutes. Fast landed culling uses confirmed prior-airborne
then reported onGround; no barometric/low-speed inference substitutes for known
geometric height. Missing contacts retain their real entity/history and source
times, disclose "Missing contact — held last observation", and clear missing
status on actual reappearance. Retained identities share the unchanged cap;
current admitted versus retained counts remain separate and capped stays
nonnegative. Explicit rejected IDs, expiry, abandoned coverage and budget removal
receive no omission grace. Exact 2,000-row or filtered feeds conservatively
cannot establish completeness. No ID-only candidate creates a new entity.

Other unchanged upstream public exports execute as before:
normalizeAdsbLolPointResponse, normalizeOpenSkyAircraft, FlightRecords.receive
and forget, createFlightFeed/createIngestion, lerpAngleDeg and
screenProjectedRotation. No God's Eye application/Viewer/factory/model preload,
coasting/trails or geoid/terrain enrichment imported. Hub continues to own one
Cesium Viewer, product state, camera, lifecycle and provider/security boundaries.

Measured narrow CPU corrections: cache unchanged heading work; skip rotation for
hidden overview billboards; publish source-age/count status at most once per
second while keeping actual source time and 200 ms motion; suspend/resume Cesium
collection events around the moving cohort with try/finally. Every changed
position is still assigned, and the 100-position regression verifies the same
Cartesian3 interpolation plus one event and stable follow. No scheduling-rate,
contact-cap, renderer rewrite or provider-poll increase.

### Controlled profiling and limits

Before/after cohorts are 0, 1, 10, 25, 50 and 100 at 390×844 mobile viewport;
0, 1, 10, 25, 50, 100 and 1,000 at 1440×900 desktop viewport. All run sequentially
on Docker compiled preview. The same pinned site/camera (516,179.559 m,
heading 0, pitch -pi/2), fixture ID/grid/altitude and sample duration are used.
Existing Natural Earth fallback is selected only by declared diagnostic HTTP
503 routes for GIBS/USGS, removing upstream tile variability without changing
product configuration/assets. Minimum six-second warmup, settled tiles and
one-metre camera invariant; then two seconds warmup and four seconds per state:
held first observation, moving two genuine declared historical fixture positions
30 seconds apart, and settled disabled-layer baseline. No extra provider dispatch
or fabricated production contacts. LOD diagnostic uses 3,000,000 m; follow is a
separate dynamic-camera case, not a matched-camera FPS ratio.

The disposable profiler exposes the already-created owned runtime only in a
routed test response. Production source/artifacts/upstream/protocol are unchanged.
Pure artifact acceptance campaigns and byte verification do not use this seam.
It captures rAF mean/p50/p95/max cadence, actual postRender frames, requestRender
calls, 200 ms callback totals/max, position assignments/time, collection events,
projection calls/time, status writes/time, WebGL draws, reported coarse heap,
parent DOM activity and V8 CPU profiles. Raw JSON and the 78-row CSV preserve all
three states and before/after values. JS method wall timings may include native
work/preemption; native `(program)` samples are not a GPU raster breakdown.
Reported heap is Chromium's coarse counter, not a heap snapshot/leak proof.
Parent profile/DOM counters and source inspection cover the unchanged 1 Hz
workspace subscription; this is not a formal React Profiler recording.

ANGLE Vulkan **SwiftShader Device (Subzero)** is the observed renderer. Held
contacts and a settled disabled layer stay near 60 rAF FPS with zero scene
renders. One moving contact already incurs the severe slow path, with only a few
milliseconds of aircraft callback work per four-second sample. Repeated native
scene rendering/compositing under this software backend dominates the small
cohorts; contact number alone does not explain the loss. At 1,000 contacts,
per-contact event fan-out and redundant diagnostics add measured JavaScript work.
The before mobile100 attempted globe-hidden diagnostic remained 7.27 versus
7.47 FPS; its measurement did not record the visibility flag and does not
isolate the globe as the cause. The final empty-scene forced-render control below directly supports native/
software render-path cost. There is no per-pass GPU timer or physical-hardware
comparison. No claim that the globe alone is proven expensive.

### Owner hardware and visual-quality checklist

All human acceptance/device result fields remain **PENDING OWNER REVIEW**.
Automated fixture proof does not sign them. Record device/OS/browser, GPU,
viewport, artifact SHA, data source class, count, enabled/disabled cadence and
qualitative pan/zoom responsiveness. Compare the same settled view and input.
Review with declared fixtures or an independently authorized regional source;
fixture identities are not live operational aircraft. Do not enable unauthorized
providers to fill this review.

| Owner check | Automated coverage | Hands-on result |
| --- | --- | --- |
| Disabled versus enabled; dense regional 100 mobile / 1,000 desktop | Controlled before/after cohorts and dense screenshots | PENDING |
| Pan/zoom and new settled region; source 100 NM disclosure | Camera anchoring, cache return and cross-worker tests | PENDING |
| High overview points and lower glyphs; legibility/overlap | Actual canvas pixels at three altitudes and LOD diagnostics | PENDING |
| Select details, true source/position time, count reconciliation | Actual canvas picking/detail assertions | PENDING |
| Focus and exactly one followed contact; stop on manual input | Focus/follow lifecycle cases | PENDING |
| One omission then same-ID return; grace and expiry | Permanent Node and browser regressions | PENDING |
| 503/429/timeout, prolonged outage and recovery | Controlled unavailable and five-minute recovery cases | PENDING |
| Earth → Sky → Earth, enabled/disabled and late cancellation | Serial lifetime and existing regression campaign | PENDING |
| Mobile tap targets, drawer, tracking visibility and scrolling | 390×844 viewport cases support only layout evidence | PENDING on physical phone |
| Authorized live availability/capacity and useful regional coverage | No new live probe; historical one-probe HTTP 503 only | UNKNOWN / access review required |

No physical iPhone/Android/GPU review or formal human visual acceptance was
performed. Keep the existing budgets until owner evidence justifies a separate
revision. No 60 FPS, general hardware suitability, safe dense mobile performance,
worldwide acquisition or production readiness claim.

### Fresh matched cohort results

These are rAF cadence samples, not a hardware frame-rate guarantee. Exact callback,
assignment, projection, request/draw/render, maximum-interval and heap values for
every state/cohort are in `cohort-measurements.csv` (78 rows) and the original JSON.
Profiler captures are retained. Baselines are measured after the enabled scene
settles. No overlapping GPU campaigns are included in the matched 13-pair table.

| View / contacts | Disabled before → after FPS | Moving before → after FPS | New moving / disabled | New p50 / p95 / max ms | Callback wall ms/update before → after | Heap MB before → after |
| --- | --- | --- | --- | --- | --- | --- |
| Mobile / 0 | 60.07 → 60.16 | 60.16 → 60.10 | 0.999 | 16.7 / 16.9 / 17.1 | 0.20 → 0.10 | 29.4 → 31.2 |
| Mobile / 1 | 60.08 → 60.07 | 8.16 → 29.17 | 0.486 | 16.8 / 136.9 / 165.3 | 0.34 → 0.23 | 31.2 → 31.2 |
| Mobile / 10 | 60.09 → 60.16 | 6.83 → 20.99 | 0.349 | 17.0 / 169.4 / 180.0 | 1.32 → 0.34 | 27.6 → 31.2 |
| Mobile / 25 | 60.03 → 60.01 | 4.74 → 16.94 | 0.282 | 17.0 / 188.7 / 222.2 | 1.64 → 0.59 | 31.2 → 31.2 |
| Mobile / 50 | 60.03 → 60.00 | 7.21 → 16.49 | 0.275 | 17.5 / 195.0 / 219.3 | 1.85 → 0.70 | 31.2 → 31.2 |
| Mobile / 100 | 60.22 → 60.08 | 7.47 → 18.75 | 0.312 | 18.0 / 175.8 / 221.7 | 2.59 → 1.10 | 31.2 → 31.2 |
| Desktop / 0 | 60.04 → 60.21 | 60.01 → 60.12 | 0.998 | 16.7 / 16.9 / 17.1 | 0.23 → 0.09 | 29.4 → 29.4 |
| Desktop / 1 | 60.03 → 60.05 | 4.19 → 8.17 | 0.136 | 201.9 / 281.9 / 296.1 | 0.59 → 0.14 | 29.4 → 31.2 |
| Desktop / 10 | 58.31 → 60.02 | 4.99 → 10.17 | 0.169 | 18.9 / 217.6 / 225.2 | 2.72 → 0.32 | 29.4 → 29.4 |
| Desktop / 25 | 60.02 → 60.10 | 3.72 → 9.73 | 0.162 | 16.7 / 242.0 / 267.9 | 3.54 → 0.51 | 26.0 → 31.2 |
| Desktop / 50 | 60.03 → 60.13 | 2.88 → 9.19 | 0.153 | 19.3 / 255.6 / 322.6 | 11.51 → 0.59 | 29.4 → 31.2 |
| Desktop / 100 | 60.16 → 60.18 | 3.92 → 9.46 | 0.157 | 17.6 / 275.7 / 328.6 | 7.00 → 0.89 | 29.4 → 31.2 |
| Desktop / 1000 | 60.08 → 60.01 | 2.57 → 8.03 | 0.134 | 18.3 / 266.3 / 341.6 | 114.33 → 7.07 | 29.4 → 31.2 |

Held-state cadence remains near 60 FPS without scene redraws. In the final
1,000-contact desktop moving sample: 16 callbacks, 16,000 changed-position
assignments, **16 collection events**, 16 explicit render requests, 17 native
scene frames; 113.1 ms total callback wall time (7.07/update) versus the earlier
914.6 ms (114.33/update). Position assignment/projection totals remain separately
reported; batching does not skip any interpolated position. The event count
regression and reduced status/heading work are direct proofs. Wall timings may
include native work/preemption; the full FPS gain cannot be attributed entirely
to these code corrections. Short-sample and software-backend variability remain.


### Isolated diagnostics, repeats and honest attribution

All eight post-correction diagnostic/repeat cases finished sequentially with
exit 0. Empty aircraft scene plus a diagnostic requestRender timer at 200 ms:
**33.20 mobile / 9.97 desktop rAF FPS**, approximately five actual scene frames
per second, **zero position assignments**, 20 requests, approximately 1.3 / 1.2 ms
combined callback work in four seconds. Settled disabled scenes remain near 60.
This isolates substantial native scene-render/compositor cost without aircraft
calculation or entity movement. The exact GPU pass/driver component is UNKNOWN;
there is no GPU timer or hardware comparison. Low cohort count alone does not
solve this software backend.

A separate routed diagnostic restores only old five-Hz status publication on the
new artifact: mobile1 **33.40 FPS**, 20 publications and 5.1 ms callback work,
versus four publications in the ordinary new run. This **does not** reproduce the
original 8.16 FPS loss. Publication reductions are directly proven CPU/workload
improvements, but they cannot explain the entire before/after FPS gain. Do not
attribute all of that gain to the patch; native backend/cache/system variance
remains a limitation. V8 profiles also expose dense per-entity event work, which
is independently reproduced and corrected by the real collection regression.

Diagnostic-only single-expression point LOD at the **same 516,179.559 m camera**:
100 mobile points **34.31 FPS**; 1,000 desktop points **8.97 FPS**, 1,000 visible,
5.83 ms callback wall/update. This avoids conflating representation with changed
camera height. Only the disposable fetched adapter response is altered; actual
source/artifacts/protocol and product LOD threshold remain untouched. Ordinary
3,000,000 m point diagnostics against the starting artifact are also preserved,
but camera-height differences prevent using them as an isolated glyph-speed
claim. One desktop diagnostic's final baseline may have overlapped the next
fixture setup and is excluded from the matched before/after table.

Fresh ordinary glyph repeats: mobile100 **17.49 FPS**, 18.4 ms callbacks total;
desktop1000 **6.59 FPS**, 8.48 ms/update, 14 collection events for 14,000 real
position assignments. Main samples were 18.75 / 8.03. Software movement is still
slow with long frame tails; no safe physical-device budget or 60 FPS claim.
Single-contact selection/follow: 31.15 FPS untracked at 516 km; **10.00 FPS**
tracked at approximately 9,215 m, 36 native renders, 3.5 ms callback work. That
changes camera/frustum and is reported separately, not as a same-view ratio.
The permanent acceptance suite, rather than the instrumentation seam, qualifies
actual picking, Focus, stable follow, manual-stop and source-error behavior.

The dense declared-grid desktop/mobile screenshots visibly overlap glyphs;
actual marker visibility is proven, legibility/product acceptance is pending.
No budget reduction or whole-renderer rewrite was made from these software-only
measurements. No expensive React/workspace path was identified in these captures;
parent DOM/message counters were zero and the source still polls workspace state
at 1 Hz. That is a bounded negative finding, not proof of zero React CPU cost.

### Failed measurement attempts preserved

Retained attempts include preview-not-ready ERR_CONNECTION_REFUSED, a hidden
immersive-parent `toBeVisible` wait, unsettled imagery/pilot inverse FPS ratios,
a missing serialized phase variable, an omitted camera argument producing an
approximately 100 m view, and one desktop1000 tile-settle timeout. These are
excluded from the matched campaign. The initial claim that a postMessage wrapper
caused sender failure was corrected: the verified failure was hidden-container
visibility, and wrapper causality was not proven. The wrapper was removed as a
precaution. Final profiles require attached-ready, settled tiles and a one-metre
camera invariant. No runtime fix was introduced for a harness-only failure.
A first compose start lacked the backend image for the new project; it was
corrected to the existing qualified image. The original attempt is retained.

Automatic approval review rejected an early request for full Docker configuration
inspection because it could expose environment credentials. That action did not
execute. The safe replacement reads only IDs, mounts and running state; preservation
uses those fields plus environment fingerprints. No blocked action remains.

### Fresh artifact and validation proof

Earth **f43a4b9081ebe9c67ea57afcdf3317c68b5d4199f53aa9e1f22a4cbe3040c254**:
two independent pinned Docker builds, **513 identical files / 512 payloads** and
**37 source-input rows**, all checked. Only repository tooling generated the lock
and runtime-version hashes. The first build is installed in this worktree at
`data/runtime-artifacts/earth`; the starting bf176 artifact is retained byte-for-byte
at `data/runtime-artifacts/earth-rollback-bf176-20261009` and the prior qualified
build copies. Owner-root ca124 rollback is untouched. Sky remains
**b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d**;
no Sky build or source/native/vendor/WASM/protocol modification.

Fresh results for the new artifact:

| Command / proof | Result |
| --- | --- |
| node --test tests/earth/aircraft-policy.test.mjs tests/earth/aircraft-display.test.mjs | 18 passed, zero failed/skipped |
| node --test tests/earth/*.test.mjs tests/runtime/*.test.mjs | 101 passed, zero failed/skipped |
| Docker backend pytest test_earth_aircraft.py + test_earth_events.py -q | 46 passed, zero skipped, six existing library deprecation warnings |
| frontend npm test -- --run | 229 passed / 28 files |
| frontend npm run typecheck; npm run build | PASS; final metadata copied by a fresh Hub build |
| complete aircraftRecovery.spec.ts, Docker compiled preview 4183 | 21 passed / zero failed/skipped, 20.6 minutes |
| verify-served.py, Docker compiled preview 4183 | all 512 Earth / 96 unchanged Sky payload bytes PASS; release/lock/served version equality |
| independent build full-file comparison / earth_artifact.py verify + install | PASS; 513 identical files and current source-input/installed hashes |

The first failed 20/21 aircraft campaign and the subsequent complete 21/21 green
remain separate. The five-minute fixture advances the frame and declared feed
clock by 300 seconds; it is deterministic fixture proof, not five minutes of live
provider observations. No new regional provider probe was performed here.
Live availability/capacity and real live counts remain UNKNOWN; the historical
single authorized ADSB.lol probe returned HTTP 503. OpenSky remains blocked on
provider agreement. All 100 NM / 2,000-row / 2 MB / >=30-second shared dispatch /
eight-second whole-call / desktop1,000-mobile100 / follow1 / models0 limits remain.

Exact commands, logs, CSV, profiles, failed attempts and screenshots are in the
private archive's `QUALIFICATION_COMMANDS.md` and named evidence files. Docker
provides runtime authority; host unit/type/build commands are supporting evidence.

Fresh complete existing Earth/Sky campaign on the corrected Docker compiled
preview: **43 passed / zero failed / zero skipped, 16.3 minutes**, all eight
requested files. It covers native Sky wheel/search/selection/deselection/URL,
Earth/Sky serial lifetime, existing satellites/Weather/radar/fire/earthquakes,
CONUS HD/global fallback and actual persisted bfcache documents/bridges. The
registered 16 historical private files were backed up and hash-verified first;
fresh regression images were copied to `regressions-fresh-earth-expansion`, then
only the worktree's registered copies were restored. Every owner-original hash
still matches. No historical registry/document/validator was weakened.

### Exact files changed by this final review

- `runtimes/earth-runtime/layers/aircraftPolicy.mjs`
- `runtimes/earth-runtime/layers/aircraftDisplay.mjs`
- `runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`
- `tests/earth/aircraft-policy.test.mjs`
- `tests/earth/aircraft-display.test.mjs`
- `tests/earth/fixtures/pinned-earth-loader.mjs`
- `frontend/tests/e2e/aircraftRecovery.spec.ts`
- `integrations/renderers.lock.json` (generated Earth metadata only)
- `frontend/public/runtime-versions.json` (generated Earth metadata only)
- this qualification evidence; active A checkpoints in LIVE_SESSION_BRIEF,
  PROJECT_STATE and EARTH_CAPABILITY_PLAN.

No backend, dependency, Sky/vendor/WASM, shared protocol, upstream tracked source,
owner settings/data or historical audit changes. No commit of private captures.

### 28-field owner handoff

The exact delivery head, post-push checks/thread state and clickable private
screenshots are recorded in the accompanying `FINAL_HANDOFF.md` and final GitHub
snapshot. The final delivery documentation commit changes no runtime inputs.

| # | Requested field | Final qualification outcome |
| --- | --- | --- |
| 1 | Original/final PR head | Original 482f27ada78378f98f1337f06a82632a33703f17; final delivery HEAD in accompanying exact-head handoff/GitHub snapshot. |
| 2 | Original P2s still present? | Both were present/unresolved at starting head; reproduced before correction. |
| 3 | Exact reds | p2-red.log: two assertion failures; policy-red-direct.log: 6 pass / 2 fail; optimization reds listed above. |
| 4 | Outage interpolation | Positive <=90 s gaps only; excessive/duplicate gaps hold genuine newer fix; no coasting or invented epochs. |
| 5 | Omission lifecycle | Actual FlightRecords.absence; third complete missing poll removes; partial snapshots limited by 120 s actual fix age; explicit rejection/region/budget removal excluded. |
| 6 | Exact upstream reuse | Normalizers, receive/absence/forget, feed/ingestion, angle interpolation and projected rotation execute unchanged at e770. |
| 7 | Hub differences | Stricter 120 s fix freshness, conservative row/filter completeness, actual landing flags, fixed device caps, bounded delay/no coast; one owned Viewer/camera/lifecycle/security. |
| 8 | Profiling method | Sequential 13 paired cohorts, same camera/fixture/duration, settled tiles, real postRender/CPU/assignment/event/projection/status/heap/V8 capture; eight bounded controls/repeats. |
| 9 | Measured root cause | Native software scene render/compositor cost isolated in zero-aircraft forced-render control; dense event fan-out and redundant diagnostics separately measured. Exact GPU pass UNKNOWN. |
| 10 | Cohorts | Full table above and 78-row CSV; six mobile and seven desktop sizes, all completed before/after. |
| 11 | Improvements/limits | One collection event per update, status <=1 Hz, cached/hidden-glyph heading work; dense callback reduction demonstrated. Main/repeat FPS improved but software tails remain, full gain attribution unproven. |
| 12 | Screenshots | Pristine aircraft-qualified-screens: dense desktop/mobile, three altitudes, omission-held/return and five-minute recovery; diagnostic captures separately labeled. |
| 13 | Source/count/status | Dense 2,000 admitted → 1,000 desktop / 100 mobile; capped 1,000 / 1,900. Omission current admitted0/renderable1/retained1/capped0, old fix disclosed. Real live count UNKNOWN. |
| 14 | Select/Focus/follow | Actual canvas picking, Focus, stable entity/follow through normal polls and one omission; cap reservation; manual input/error/departure stop follow. |
| 15 | Outage/recovery | 503/429/timeout/malformed/stale controlled; Viewer healthy; five-minute logical fixture recovery holds true new fix and does not restart follow. |
| 16 | Coverage/cache/coalescing | 100 NM settled-view anchoring, distant first enable, fresh geographic cache source-time reuse, late cancellation; 46 Docker tests include real Redis cross-worker dispatch/coalescing/deadline proof. |
| 17 | Existing regressions | Fresh 43/43 complete eight-file compiled-preview suite, including genuine bfcache/native Sky and existing Earth layers/imagery. |
| 18 | Earth SHA | f43a4b9081ebe9c67ea57afcdf3317c68b5d4199f53aa9e1f22a4cbe3040c254; independent 513-file reproduction, 37 inputs, installed/served payload proof. |
| 19 | Sky SHA | b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d, unchanged; 96 payload bytes verified. |
| 20 | Pin/owner preservation | Pin e7707d9a0f34d9fbffc300023c319f95caa5be30; final preservation/restoration proof recorded below. |
| 21 | Checks/open threads | Exact final-head GitHub snapshot accompanies delivery; original two threads replied/resolved only after passing proof. CI is separate from the local full campaigns and human acceptance. |
| 22 | Human visual quality | PENDING OWNER REVIEW; dense glyph overlap is visible; no formal human acceptance manufactured. |
| 23 | Physical device | NOT TESTED; 390×844 viewport plus SwiftShader does not qualify a physical phone. |
| 24 | Live provider | UNKNOWN availability/capacity; historical one-probe 503 only, no new probe; OpenSky agreement still required. |
| 25 | Category A blockers | Live regional operational availability/access/capacity proof blocked; no remaining demonstrated local P2/runtime qualification blocker after the passing campaigns. |
| 26 | Category B limits | Software dense/follow cadence and long tails; coarse heap/no GPU pass timer; real-device/human quality pending; glyph crowding; strict geometric-only admission; regional coverage at global zoom. |
| 27 | Technical owner merge review | Bounded correction and fixture artifact are technically qualified for owner review, subject to actual final-head checks/threads. Human quality/live operational acceptance remain pending; no merge authorization. |
| 28 | Exact next owner action | Review PR67 source/qualification and test f43 on physical hardware using declared fixtures or an independently authorized regional source; record the checklist, qualify provider access/capacity, then decide acceptance. Hold worldwide/B/C/D/E/C6. |

### Final normal restoration and preservation

`COMPOSE_BAKE=false npm run dev:local:build` completed in **23 seconds**:
"Local Hub ready: http://localhost:4173" and served release f43 verified. All five
ordinary services are running, frontend/Earth healthy. Only the three new
`oras-c57a-final-review` qualification services were stopped; no down/prune/
remove-orphans or volume removal. Earlier qualification services remain stopped;
owner auxiliary containers were untouched.

The restored normal backend again passed **46 tests / zero skipped**, six existing
deprecation warnings, **14.34 seconds**. Normal HTTP verifies all **512 Earth /
96 unchanged Sky payloads**, release/lock/served-version equality. Final sanitized
preservation helper PASS: exact original **81-volume name set**; PostgreSQL/Redis
IDs, full mounts and running state; exact original astronomy data mount Sources;
owner `.env` fingerprint; owner branch/head and byte-identical unstaged settings;
clean e770 pin; unchanged Sky/vendor/native/WASM/protocol/audits; every retained
owner ca124 and starting bf176 rollback payload. No datastore reset/reseed/
migration/prune or external deployment.

Owner root remains `dev-wsl-performance-repair-1` at
`1cb71b848a1ed46390945fe0fa636676b8b8f744`, only `.vscode/settings.json` dirty and
unstaged, SHA256 `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.
PostgreSQL ID `d855704d450063119c2e268a016455a7249c38989a96031a4e33e4156115fa20`;
Redis ID `1dec6ebffeb9d01114a01e4f540780c2d7fed2b9dec2acaa01c27bb07e21279d`.
Their exact original volume mount Sources are retained in the sanitized comparison.
The original catalog/ephemeris/dense-star paths stay under integration-main-20261005;
Sky/TLE stay under the owner-root skydata path. Preservation proves these identities,
read-only references and guarded operations; it does not claim a byte hash of a live
database. No owner branch/worktree was removed or reset.

PR #67 is the existing delivery target, remains OPEN/unmerged, and its head was
rechecked at the original 482f27 SHA immediately before delivery. The source/test/
attestation and qualification-document commits are listed in the accompanying
exact-head handoff. Original P2 replies include actual red roots, small fixes,
pinned reuse and fresh final validation; resolution follows passing proof. No
recursive review campaign, merge, production/SSH/Cloudflare/oras.org, provider
account/purchase, new model/media, worldwide acquisition or C5.7-B/C/D/E/C6 work.

## Post-push current-contact priority correction — 2026-10-09

This checkpoint supersedes the f43/72aa final-artifact readiness checkpoint above.
Its earlier measurements, failed attempts, captures and original two-P2 red/green
proof remain historical evidence. No previous result is counted as fresh proof
for the changed artifact below. PR #67 remains OPEN/unmerged on the same branch.

Automatic review of delivery head `72aa2bc96996c313d06bb7b9579f958e6e3e05f5`
found one additional valid P2: current contacts could be excluded by lower-sorting
unselected missing placeholders. Review thread `PRRT_kwDORt_rys6q7Bbb`, comment
`4233899663`. At mobile cap 100, 100 old missing IDs could displace all 100 fresh
higher-sorting IDs; the same problem occurred during desktop-to-mobile resize.

### Reproduction and minimal correction

The actual pinned Cesium/FlightRecords display tests reproduced both paths before
the correction: **12 display tests, 10 passed / 2 failed**, exit 1. The failures are
`current higher-sorting contacts fill the cap before unselected missing contacts`
and `resizing prioritizes current contacts while reserving a qualifying missing
follow within the cap`. Each tests both no-follow and qualifying retained follow.
The raw red log uses declared fixture contacts and actual pinned record/display code.

`aircraftCohort` now orders qualifying selected/followed identities first, current
accepted observations next, and other grace contacts last, with deterministic ID
ordering inside each group. Replacement and resize use the same function. Missing
contacts remain eligible only under the previously qualified upstream grace and
Hub expiry; budget removal still clears their record/history. Without a retained
follow, all 100 slots contain current observations. With one qualifying missing
follow, that same entity occupies one slot and 99 current contacts occupy the rest.
No cap, grace, freshness, source-time, acquisition, camera or motion-cadence change.
The shared ordering runs at snapshot replacement or necessary resize trimming,
not on every ordinary animation tick.

Focused green: **20 passed / zero failed / zero skipped**. Full final-source bundle:
**103 passed / zero failed / zero skipped**. The new browser case acquires a second
declared 2,000-row snapshot with higher-sorting identities on the actual scheduled
provider poll; all visible aircraft are from the current cohort, retainedMissing 0,
admitted 2,000 / renderable 100 / capped 1,900. The previous unknown-geometric-altitude
fixture and guard remain intact; an accidental local fixture edit was restored
before qualification and never committed or treated as evidence.

God's Eye source remains pinned/clean at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`. No upstream feature edits, whole-app
import, alternate Viewer, new models/media, provider fallback, or renderer rewrite.
The original FlightRecords/normalizer/feed/orientation reuse and justified Hub
differences documented above are unchanged.

### Fresh final-artifact profiling

The same sequential 13-cohort controlled harness completed on the final artifact:
six mobile sizes (0/1/10/25/50/100) and seven desktop sizes (plus 1,000). Same camera,
declared fixtures, settled existing fallback imagery, warmup and four-second sample
per state. Full rAF distributions, real postRender cadence, callback/assignment/
collection/projection/status/render-request/draw/heap counters and V8 captures are
retained. The combined **117-row CSV** distinguishes original bf176, corrected f43
and current 4429 source/artifact checkpoints, with disabled/held/moving states.
The f43 diagnostic controls and repeats above remain historical diagnosis;
final-artifact measurements are a separate complete run. It does not repeat
those eight controls. Profiling seams are confined to routed disposable responses;
pristine acceptance and HTTP byte verification use the unmodified artifact.

| Viewport | Contacts | Original moving rAF FPS | Final disabled rAF FPS | Final moving rAF FPS | Final moving p50/p95 ms | Callback ms/update | Assignments/events | Ratio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile | 0 | 60.16 | 60.00 | 60.06 | 16.7/16.9 | 0.10 | 0/0 | 1.001 |
| Mobile | 1 | 8.16 | 60.03 | 36.16 | 16.7/107.7 | 0.23 | 20/20 | 0.602 |
| Mobile | 10 | 6.83 | 60.20 | 37.49 | 16.7/101.9 | 0.36 | 200/20 | 0.623 |
| Mobile | 25 | 4.74 | 60.01 | 25.15 | 16.8/151.4 | 0.64 | 550/22 | 0.419 |
| Mobile | 50 | 7.21 | 60.10 | 29.97 | 16.8/132.8 | 0.60 | 1050/21 | 0.499 |
| Mobile | 100 | 7.47 | 60.11 | 26.92 | 16.8/155.2 | 0.98 | 2100/21 | 0.448 |
| Desktop | 0 | 60.01 | 60.18 | 60.14 | 16.7/16.9 | 0.11 | 0/0 | 0.999 |
| Desktop | 1 | 4.19 | 60.05 | 11.13 | 18.2/199.7 | 0.20 | 21/21 | 0.185 |
| Desktop | 10 | 4.99 | 60.04 | 9.52 | 19.5/253.5 | 0.31 | 190/19 | 0.159 |
| Desktop | 25 | 3.72 | 60.23 | 8.91 | 171.7/278.6 | 0.51 | 450/18 | 0.148 |
| Desktop | 50 | 2.88 | 60.12 | 8.80 | 16.0/269.7 | 0.64 | 900/18 | 0.146 |
| Desktop | 100 | 3.92 | 60.24 | 8.64 | 19.1/306.1 | 1.03 | 1800/18 | 0.143 |
| Desktop | 1000 | 2.57 | 60.09 | 7.14 | 198.4/375.8 | 7.81 | 15000/15 | 0.119 |

At desktop 1,000 the final sample has 15 animation updates, 15,000 position
assignments and **15 collection events**; callback total 117.1 ms (**7.81 ms/update**),
assignment 60.8 ms, projection 9.1 ms, four status writes / 0.3 ms, 15 explicit render
requests and 16 actual scene frames. Original callback average 114.33 ms/update.
This confirms the existing measured batching/caching/publication improvements;
the new cohort-order correction is not claimed to cause an FPS improvement.

Actual final scene-render cadence is **5.23 FPS mobile 100 / 3.81 FPS desktop 1,000**;
rAF counts UI frame callbacks and is not interchangeable with Cesium postRender.

Final moving mobile 100 is 26.92 rAF FPS (p95 interval 155.2 ms) and desktop 1,000 is 7.14
(p95 interval 375.8 ms), versus disabled 60.11 / 60.09. All held/disabled cohorts are
near 60 with zero scene renders. The software/native render-path cost found in the
earlier zero-aircraft forced-render control remains the bounded diagnosis; exact
GPU pass, full gain attribution, heap leak freedom and physical hardware performance
are UNKNOWN. SwiftShader is the observed renderer. Parent DOM/message counters
remain zero during controlled samples; this is bounded negative evidence, not a
formal React Profiler or hardware qualification. Glyph crowding remains visible.

The interrupted unsharded pristine attempt retains its short default-imagery samples:
desktop enabled **3.57** versus disabled **3.85** rAF FPS; mobile enabled **8.79**
versus disabled **60.44**. These two-second samples have different warmup, imagery
and scene state from the settled controlled profiler and are not interchangeable
with its FPS ratios. They continue to show a severe software-renderer mobile loss.
Pristine desktop/mobile captures were inspected: glyphs are actually visible, with
heavy overlap in the declared dense fixture. Visibility does not establish human
legibility, responsiveness or acceptance; no new decluttering feature is added.

The first fourth-shard mobile sample (a passed case inside that failed shard)
was 5.28 enabled / 60.05 disabled rAF FPS. It remains separate failed-shard
measurement evidence; the final complete campaign sample is recorded below.

The clean final campaign's own two-second default-imagery samples are
**3.40 enabled / 3.43 disabled desktop** and
**8.08 enabled / 60.05 disabled mobile**. They are separate
from interrupted/failed attempts and the settled profiler. Severe software cadence
remains unresolved despite the CPU reduction; no hardware/visual acceptance or
FPS guarantee is claimed.

### Fresh artifact and complete regression proof

Final Earth artifact:
`4429c803d33bdf2718809ab2275af211e248f415c2769b328a1f7ac6db4399f3`.
Two independent pinned builds reproduce all **513 files including release.json**;
all **37 source inputs** match current source. Generated lock and runtime-version
metadata use the repository recorder; no hand-edited hashes. Installed artifact
and all **512 served Earth payloads** verify on Docker compiled preview 4183 and
normal localhost:4173. Sky remains
`b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`, all 96 served
payloads verified, no Sky rebuild/native/vendor/WASM/protocol change.

Fresh complete pristine Docker browser campaigns, run in sequential case-level
shards with one worker: **22 aircraft + 43 existing
Earth/Sky cases, zero failed / zero skipped**. Fresh --list collection exactly matches the unique passed case IDs across all
six aircraft and eight existing-feature shards, with zero retries. No interrupted
attempt results are included and no prior-artifact test results are reused. Coverage includes new current-cohort turnover, unknown
altitude, real canvas pixels/caps, stable selection/Focus/follow, missing disclosure
and same-ID return, five-minute outage recovery, source failure/coverage/cache/late
cancellation, native Sky wheel/search/selection/deselection/URL, genuine compiled
preview bfcache, satellites/Weather/radar/fire/quakes/HD/global fallback and lifetime.
Final Docker backend tests: **46 passed**, both disposable and restored normal
runtime, zero skipped and six existing deprecation warnings. Frontend: **229 tests
in 28 files**, TypeScript/build PASS. Documentation units/architecture/reconciliation
validators pass after the final checkpoint update; exact output is archived.

The initial unsharded aircraft runner terminated with SIGTERM/exit 143 after 13
passed cases and no assertion failure; termination cause UNKNOWN. That incomplete
attempt and its default-imagery captures/short cadence samples remain separate.
The first proposed shard used default file-level granularity, grouping all 22 tests;
it was intentionally stopped with exit 130 before qualifying the setup. The final
shard commands add --fully-parallel solely to distribute individual cases, retaining
--workers=1 and sequential shard invocation. A subsequent first-shard run produced four passed browser results but wrapper
exit 2: adding exit logging to the helper while its shell was reading the file
caused an EOF parse error after Playwright completed. That avoidable harness
error was retained, the helper syntax-checked and frozen, and the shard repeated
with a clean exit. None of these attempts contributes to final campaign counts. No assertion, budget, provider behavior or product source was relaxed.

The first fourth-shard attempt was **3 passed / 1 failed**, exit 1: its existing
camera-cache case expected longitude -79.6 from the deliberately aborted initial
request; the accepted returned region was -79.5. The documented/source-authoritative
policy retains a covering centre within 50 NM, and an aborted request has no accepted
cache entry. This was an invalid exact-centre test assumption, not an aircraft
cohort/runtime failure. The corrected test executes the actual distanceM/radius
policy, checks the qualified inner coverage, asserts the returned centre equals
its actual accepted request, and requires exact centre/source-time preservation
and unchanged request count on cached re-enable. No runtime, provider, cap, expiry
or timeout change. The entire shard is repeated; failed-shard results/captures are
retained separately and excluded from the completed six-shard count.

One existing-feature fifth-shard attempt returned **4 passed / 1 failed**, exit 1:
configured global GIBS acquisition reached state failed instead of ready. Outage,
fallback and genuine Earth bfcache cases passed. ImageryController source is byte
identical to original 482f27; transport/provider failure cause UNKNOWN, not inferred
as a remote outage or aircraft/Cesium regression. The complete unchanged shard was
repeated once and passed all five cases with the same live-provider opt-in,
assertions and source. The initial failure cause remains UNKNOWN. Raw failed
report/capture remains separate; it is not counted in the final accepted campaign.
No mapping/runtime/test change or weakened validator is made for this attempt.

Exact final commands and outputs are in the private checkpoint's
`QUALIFICATION_COMMANDS.md`, logs and manifest; the earlier command ledger remains
historical. This delivery adds only policy/display ordering, two display tests, one
browser turnover case, generated Earth metadata and the four approved documents.
The original final review's full changed-file list above still applies cumulatively.

### Final preservation and owner readiness

The previous installed f43 artifact was verified payload-by-payload and atomically
preserved at `data/runtime-artifacts/earth-rollback-f43-20261009`; original bf176
rollback and owner ca124 artifacts remain verified and untouched. All 16 registered
historical Earth-expansion captures were hash-checked against owner originals,
backed up before the campaign, restored after preserving fresh output separately,
and reverified. Historical evidence registries and owner originals are unchanged.

Normal localhost:4173 serves the final artifact with five services running, Earth/
frontend healthy; only the same three disposable qualification services stopped.
`COMPOSE_BAKE=false npm run dev:local:build` restored the stack without datastore
recreation; the warning about existing orphan services was not acted on. Sanitized
final checks confirm exactly the original 81-volume set, unchanged PostgreSQL/Redis
IDs/full mounts/running state, original astronomy-data mount Sources, owner branch/
head/environment/settings fingerprint, clean source pin and every retained rollback
payload. No reset/reseed/migration/prune or owner worktree/history mutation.

The exact original/final commit heads, final-head checks and review-thread state,
all 28 requested handoff fields, command ledger and desktop/mobile screenshots are
recorded in the new private `c57a-cohort-priority-20261009/FINAL_HANDOFF.md` and final
GitHub snapshots. The new P2 thread is replied/resolved only after passing proof;
the original two remain resolved with their original red/green replies. No manual
recursive review requests. Automated success does not record human approval.

**TECHNICALLY QUALIFIED FOR OWNER REVIEW — HUMAN QUALITY REVIEW PENDING; LIVE
OPERATIONAL READINESS BLOCKED**, subject to the accompanying actual final-head
checks/thread snapshot. Category A: authorized regional live availability/capacity/
access proof remains blocked; live count UNKNOWN, historical one-probe 503 only,
no new live probe, OpenSky agreement still required. Category B: software cadence/
tails, dense glyph overlap, coarse heap/no GPU-pass timers, strict geometric-only
admission, regional coverage at global zoom, physical-device/human acceptance
pending. All owner checklist result fields above remain PENDING.

Exact next owner action: inspect PR67 and the current 28-field handoff, exercise
artifact 4429 on physical hardware with declared fixtures or an independently
authorized regional source, fill the existing visual/device checklist and qualify
regional provider access/availability/capacity before operational acceptance.
Limits stay 100 NM  / 2,000 rows  / 2 MB  / shared dispatch >= 30 s  / whole acquisition 8 s /
desktop 1,000  / mobile 100  / follow 1  / models 0. No merge, replacement PR, worldwide/
OpenSky acquisition, production/SSH/Cloudflare/oras.org/accounts/purchases,
new model/media, C5.7-B/C/D/E/C6 activation or broader audit.

## Final automatic-review shared retry-header correction — 2026-10-09

Automatic Codex review completed on `35f6f052c14bcfba5719bd156d8bcb31c6bf3e63`
at 21:28:51Z and found a valid transport P2:
[return the actual shared retry delay](https://github.com/Shadowgar/Astronomy-Hub/pull/67#discussion_r4234694825).
The Redis global dispatch lease correctly retained a provider's 120-second retry
window, but another region's HTTP 429 advertised a fixed 30 seconds. It also
advertised 30 seconds when only seven or one seconds remained in the normal lease.

Permanent parametrized red:
`test_busy_http_retry_after_reports_remaining_shared_lease[False]` and `[True]`.
Both failed in Docker before the correction: **2 failed / 13 deselected**, exit 1,
with actual header 30 against remaining seven seconds or the provider's 120-second
lease. Provider traffic is mocked; actual Redis uses a unique guarded
`oras:test:c57a:<uuid>:` namespace. No live provider dispatch or production mutation.

Minimal correction: the existing atomic CLAIM Lua operation returns the remaining
Redis PTTL, rounded up to positive whole seconds, for a limited region. The existing
AircraftBudgetError carries that value unchanged through coalescing/read-and-cache
to the HTTP `Retry-After` header. No second Redis lookup/race, new acquisition,
changed lease duration, provider fallback or disclosure of private transport errors.
Cached and same-region wait behavior, failed-cache closure and whole-call deadline
remain unchanged. This is Hub transport policy; no additional upstream feature or
whole app/Viewer is imported. Hub client cadence remains unchanged.

Fresh Docker results after this backend-only correction:

- Focused HTTP/Redis regressions: **2 passed / 13 deselected**, zero skipped, exit 0.
- Complete aircraft/cache/event bundle on disposable backend: **48 passed**, zero
  failed/skipped, six existing dependency deprecation warnings, 13.97 seconds.
- Same complete bundle on rebuilt normal backend: **48 passed**, zero failed/skipped,
  six existing dependency deprecation warnings, 14.00 seconds.
- All 512 installed Earth and 96 Sky HTTP payloads reverified on normal localhost:4173.

The qualified Earth source, lock/runtime metadata and artifact remain exactly
4429c803d33bdf2718809ab2275af211e248f415c2769b328a1f7ac6db4399f3; Sky and its pin
are unchanged. The complete 22 + 43 browser campaigns and 103 runtime/229 frontend
results above apply to those unchanged sources/artifacts and were completed before
this HTTP-header-only patch; they were not rerun and are not presented as new
post-header-patch campaigns. No Earth/Sky rebuild or repeated profiling is needed.
Normal backend alone was rebuilt/recreated with COMPOSE_BAKE=false and exact original
astronomy mount Sources; datastores were not recreated. The orphan warning was not
acted on. The previously qualified renderer artifacts and rollbacks remain intact.

Raw red/green/full logs, the backend restoration command and final preservation,
source/served checks, docs validators and actual final-head GitHub snapshot are
retained in the same private c57a-cohort-priority-20261009 archive. This final patch
changes only backend route/cache/test plus these four authorized control/evidence
documents. Resolve this thread only after passing proof. PR #67 remains OPEN and
unmerged; current-head checks/threads are recorded in the full 28-field handoff.
Human visual and physical-device acceptance remain PENDING. Authorized regional
availability/capacity/access proof remains BLOCKED/UNKNOWN; no new live probe,
worldwide/OpenSky acquisition or later-package work. All fixed limits remain intact.

## Current missing-unavailable correction — 2026-10-09

**TECHNICALLY QUALIFIED FOR OWNER REVIEW — HUMAN QUALITY REVIEW PENDING; LIVE OPERATIONAL READINESS BLOCKED**, subject to the actual final-head GitHub snapshot. This checkpoint supersedes the earlier
4429 checkpoint for current readiness. Automatic review of
`300f8a788a8662122904ef369f56e38a709f9fa0` found a valid
[missing-unavailable expiry P2](https://github.com/Shadowgar/Astronomy-Hub/pull/67#discussion_r4234756061).
A selected/followed contact omitted in a successful snapshot entered missing grace;
a subsequent outage made it unavailable. Both resumed omission bookkeeping and
animation expiry skipped unavailable entities, leaving the hidden selection/missing
count/cohort reservation indefinitely after recovery.

Actual pinned Cesium/FlightRecords direct red: **14 tests / 12 pass / 2 fail**, exit1:
“unavailable missing selection still advances complete-snapshot grace after recovery”
and “unavailable missing selection expires at actual fix age even without a successful
poll”. Initial sandbox child-runner opaque top-level failure (cause UNKNOWN) and unsupported Node22 isolation
option are retained separately and excluded from product-red claims. No test code is
changed to hide the failures.

Minimal display correction: continue FlightRecords.absence for missing identities
on successful snapshots even when unavailable; during continued failures, unavailable
missing identities still receive the existing 120-second actual-fix-age expiry.
Removal uses the existing erase path for entity/history/missing/orientation/upstream
records/selection/follow cleanup. Ordinary non-missing unavailable selections retain
their previously qualified recovery behavior. No new TTL/grace/cap/cadence or upstream
source patch. No new feature import, whole app/Viewer or model/media acquisition.
The new actual-browser case covers omission -> outage -> logical age expiry -> fresh
same-ID return, without restoring selection/follow. Official human fields remain
PENDING; no physical-device or live-source qualification is inferred.

Current artifact: `da1408642156fd3483d510e33c45425d994490c3bb81543de4318fff7a4d7113`.
Two independent pinned builds match all **513 files / 37 source inputs**; generated
lock/runtime metadata, installed payloads and all **512 Earth + 96 unchanged Sky**
HTTP bytes verified on preview4183 and normal4173. No hash hand-edit or Sky rebuild.
Before installation, every 4429 payload was verified then its directory atomically
preserved at data/runtime-artifacts/earth-rollback-4429-20261009. Normal Earth alone
was recreated to remount the new installed directory; backend/frontend/datastores
were not recreated for this source correction. Only the same three disposable
qualification services started; owner auxiliary/orphan services untouched.

Fresh focused **22** and full Earth/runtime **105** tests pass with zero skipped;
frontend **229 / 28 files**, TypeScript/build pass. Backend aircraft/cache/events:
**48 passed**, zero skipped, six existing dependency deprecation warnings on both
disposable (13.98s) and normal (13.95s) Docker runtimes. Thirteen controlled profiles
completed; raw samples, four-checkpoint CSV and current table accompany the handoff.
Complete new-artifact **23 aircraft + 43 existing-feature** campaigns PASS, zero
failed/skipped/retries. Six aircraft / eight existing-feature sequential single-worker
shards match the exact unique IDs from fresh --list collection. Earlier artifacts
remain historical. Final source/served/preservation and docs/GitHub snapshots
accompany the 28-field owner handoff.

All provider/resource limits and live blockers remain unchanged. No new aircraft live
probe, production/SSH/Cloudflare/oras.org, account/purchase, worldwide/OpenSky,
new external models/media, replacement PR, merge or C5.7-B/C/D/E/C6 activation.

### Final controlled measurement and preservation checkpoint

Final desktop 1,000: 19,000 position assignments / 19 collection events, 6.62 ms/update versus original 114.33. Settled mobile 100 rAF 41.23 / actual scene 5.25 FPS, p95 87.8 ms; desktop 1,000 rAF 9.25 / scene 4.75 FPS, p95 280.3 ms. Software cadence/tails and dense glyph overlap remain; clean default-imagery acceptance samples are reported separately. Clean short default-imagery samples: desktop 4.46/4.84, mobile 9.40/60.44 enabled/disabled rAF FPS. Dense desktop/mobile screenshots visibly contain overlapping glyphs; human acceptance remains PENDING.

| Viewport | Aircraft | Original moving rAF FPS | Final disabled rAF FPS | Final moving rAF FPS | Final scene FPS | p50 / p95 ms | CPU ms/update | Position assignments / events | Render requests | Reported heap MB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 0 | 60.16 | 60.01 | 60.07 | 0.00 | 16.7 / 16.9 | 0.06 | 0 / 0 | 0 | 31.2 |
| Mobile | 1 | 8.16 | 60.20 | 41.18 | 4.99 | 16.7 / 82.8 | 0.18 | 20 / 20 | 20 | 31.2 |
| Mobile | 10 | 6.83 | 60.10 | 41.84 | 5.23 | 16.7 / 87.1 | 0.27 | 210 / 21 | 21 | 31.2 |
| Mobile | 25 | 4.74 | 60.13 | 41.71 | 5.24 | 16.7 / 85.2 | 0.53 | 525 / 21 | 21 | 31.2 |
| Mobile | 50 | 7.21 | 60.15 | 39.72 | 5.25 | 16.7 / 91.0 | 0.55 | 1050 / 21 | 21 | 31.2 |
| Mobile | 100 | 7.47 | 60.23 | 41.23 | 5.25 | 16.7 / 87.8 | 0.80 | 2100 / 21 | 21 | 31.2 |
| Desktop | 0 | 60.01 | 60.03 | 60.06 | 0.00 | 16.7 / 16.9 | 0.04 | 0 / 0 | 0 | 31.2 |
| Desktop | 1 | 4.19 | 60.23 | 16.65 | 5.22 | 18.1 / 179.1 | 0.13 | 21 / 21 | 21 | 29.4 |
| Desktop | 10 | 4.99 | 60.13 | 16.51 | 5.34 | 18.0 / 177.3 | 0.28 | 210 / 21 | 21 | 31.2 |
| Desktop | 25 | 3.72 | 60.16 | 19.17 | 5.23 | 16.8 / 178.4 | 0.50 | 525 / 21 | 21 | 31.2 |
| Desktop | 50 | 2.88 | 60.23 | 17.23 | 5.25 | 17.4 / 185.7 | 0.57 | 1050 / 21 | 21 | 31.2 |
| Desktop | 100 | 3.92 | 60.17 | 16.91 | 5.22 | 18.0 / 180.7 | 0.85 | 2100 / 21 | 21 | 31.2 |
| Desktop | 1000 | 2.57 | 60.09 | 9.25 | 4.75 | 17.7 / 280.3 | 6.62 | 19000 / 19 | 19 | 33.1 |

Four-checkpoint CSV retains **156 rows**; current da140 samples cover every declared cohort and disabled/held/moving state. Original bf176/f43/4429 diagnoses and failed attempts remain historical, including the earlier unchanged GIBS repeat; none is counted as a fresh da140 case. Exact GPU pass, full FPS gain attribution, formal React profiling and heap-leak proof remain UNKNOWN/unqualified. Physical hardware and official human visual acceptance remain PENDING.

Fresh historical Earth captures are archived before restoring only the 16 registered originals from verified backups. Owner root originals and evidence registries remain unchanged. All 512 Earth / 96 Sky HTTP payloads are verified again on preview and normal runtime; current installed source-input verifier passes. Original 81-volume set, PostgreSQL/Redis identities/full mounts/running state, astronomy mount Sources, owner head/settings/environment, clean e770 pin, native Sky/vendor/WASM/shared protocol and durable bf176/f43/4429 plus owner ca124 rollback payloads are preserved. Normal five services running; only the three owned qualification services stopped. No reset/reseed/migration/prune or removal of existing auxiliary/orphan services.

Exact final commit/checks/review-thread state, all 28 requested fields, files/commands, failed attempts and desktop/mobile/expiry captures are in the private c57a-unavailable-missing-20261009/FINAL_HANDOFF.md and accompanying hash manifest. Resolve the new thread only after passing proof. Existing original/priority/retry-header replies remain historical and resolved; no manual recursive review requests. Human acceptance is not recorded by automation.

Category A: authorized regional live access/availability/capacity proof remains BLOCKED/UNKNOWN; historical single 503 probe only, no new live aircraft probe, OpenSky agreement missing. Category B: software cadence/tails and glyph overlap, coarse heap/no exact GPU timer, geometric-only admission, global-zoom regional coverage, physical-device/human acceptance pending. Next owner: inspect exact final PR head/source/evidence/screens, exercise da140 on physical hardware with declared fixtures or independently authorized regional source, fill the existing pending checklist, and qualify access/availability/capacity before operational acceptance. Limits remain 100 NM / 2,000 rows / 2 MB / shared dispatch >=30 s / whole acquisition 8 s / desktop1,000 / mobile100 / follow1 / models0. PR67 OPEN/unmerged; no replacement PR, worldwide/OpenSky activation, production/SSH/Cloudflare/oras.org/accounts/purchases/new model/media or C5.7-B/C/D/E/C6.

## Final client Retry-After correction — 2026-10-09

Automatic review of fe8ca979 found the route's Retry-After unused by the adapter.
Actual pinned Cesium/createFlightFeed/createIngestion integration red: 3 tests,
2 pass / 1 fail (premature acquisition during the 120-second lease); residual one
second and invalid-header fallback already preserve ordinary 30-second cadence.
The minimal adapter correction passes valid bounded numeric route delta seconds
to unchanged upstream ingestion, then schedules PollingLayer from its existing
feed._retryAt deadline, never below the approved 30 seconds. Long timers are
chunked within signed 32-bit browser timer limits; upstream deadline continues
to block acquisition. Success restores 30 seconds. Generic PollingLayer and
upstream source stay unchanged. Green: all 3 tests, including recovery/disable.

No faster provider/client polling, new TTL, grace, cap, global source or probe.
The previous da140 checkpoint, measurements and 23+43 browsers remain historical.
At the in-progress entry, the new source required independent artifact and
complete fresh runtime qualification. The passed proof below supersedes that
state; actual final-head thread resolution is reported in the owner handoff. Human/device acceptance stays
PENDING; authorized regional live access/availability/capacity/count UNKNOWN.

### Final client-backoff artifact qualification

The in-progress statement above is superseded by this checkpoint. Final artifact
5a3bc34ca345fe83f8c93dc11ad9675e224cac2ec45fb4ddda01d9598a9950d5 independently
reproduces all 513 files / 37 current inputs. Installed and all 512 Earth / 96
unchanged Sky served payloads pass compiled-preview4183 and normal4173 checks.
Fresh tests: 25 focused, 108 runtime (zero skipped), 229 frontend / 28 files,
TypeScript/build, 48 backend on each Docker environment (six existing dependency
warnings), 24 aircraft + 43 existing-feature browser cases, zero failures/skips/
retries, six/eight sequential one-worker shards and exact fresh unique listing
IDs. Genuine bfcache, native Sky and all requested existing layers/imagery covered.
The new 120-second browser case sees no premature request, timed recovery and
a healthy Viewer. A separate bounded UI follow-up confirms the Hub Regional
snapshot/renderable1 state and captures it after the existing1Hz workspace poll;
the original immediate capture still showed the preceding unavailable state and
is retained with that label. This follow-up changes no source/test/artifact. Residual1/invalid-header integration cases keep >=30-second
active refresh as required by this document; server Retry-After is a minimum,
not permission to accelerate the approved client cadence. Generic PollingLayer
and upstream source remain unchanged; existing ingestion owns _retryAt.

Fresh final-artifact cap profiles: desktop 1,000 assigns 21,000 positions / 21 collection events at 6.74 ms/update, compared with historical original 114.33 ms/update. Mobile 100 moving rAF 42.24 / actual scene 5.25 FPS, p95 81.2 ms; desktop 1,000 moving rAF 10.24 / scene 5.37 FPS, p95 220.9 ms. Previous four complete 13-cohort campaigns remain historical (156 rows); these two fresh cap profiles add six rows (162 total). Final backoff change is not credited with an FPS improvement; software tails, dense overlap, exact GPU pass/full gain attribution, heap-leak proof and physical hardware remain unqualified. Clean short pristine default-imagery acceptance samples are separate: desktop enabled/disabled 4.23/4.31 rAF FPS; mobile 9.14/60.41. Dense canvas captures contain overlapping glyphs; human visual and physical-device acceptance remain PENDING.

| Viewport | Contacts | Disabled rAF FPS | Moving rAF FPS | Actual scene FPS | p50 / p95 ms | CPU ms/update | Assignments / events | Render requests | Heap MB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | 100 | 60.21 | 42.24 | 5.25 | 16.7 / 81.2 | 0.84 | 2100 / 21 | 21 | 31.2 |
| Desktop | 1000 | 60.07 | 10.24 | 5.37 | 19.9 / 220.9 | 6.74 | 21000 / 21 | 21 | 31.2 |

Four earlier complete 13-cohort campaigns are historical; the 162-row CSV
contains their 156 rows plus six final-artifact two-cap/three-state rows. No old
sample/test is claimed fresh for this modified artifact. Original failed reds,
helper/locator/interruption/cache/GIBS attempts remain preserved in their separate
archives, including the genuine new client-backoff red (3 tests, 2 pass / 1 fail).
MockTimers emits a test-only experimental warning. Existing build chunk warnings
and six dependency warnings remain disclosed. Physical device, formal React
profiling, exact GPU timer/gain attribution and heap-leak proof remain unqualified.

Fresh historical Earth captures are archived before restoring only the 16
registered original files; root originals unchanged. Original 81-volume set,
PostgreSQL/Redis IDs/full mounts/running state, astronomy mount sources, owner
settings/environment/head/branch, clean e770 pin and Sky/native/vendor/WASM/
shared protocol preserved. Verified owner ca124 and durable bf176/f43/4429/da140
rollback payloads retained. Normal five services running; only three owned
qualification services stopped; no reset/reseed/migration/prune/orphan cleanup.

Actual final GitHub head/checks/review threads, complete 28-field owner handoff,
files/commands/screens/profile/failed attempts and SHA manifest accompany private
c57a-client-backoff-20261009/FINAL_HANDOFF.md. Client finding4235170212 is resolved
only with completed passing evidence; other demonstrated findings remain resolved.
TECHNICALLY QUALIFIED FOR OWNER REVIEW, subject to actual GitHub snapshot; no
human quality or physical-device acceptance recorded. Category A: authorized live
regional access/availability/capacity/count BLOCKED/UNKNOWN, historical single503
probe only, no new live aircraft probe, OpenSky agreement required. Category B:
software cadence/tails, dense glyph overlap, coarse heap/GPU limits, geometric-only
admission and regional/global-zoom coverage, human/device acceptance pending.
Next owner: exact-head review, existing pending physical-device checklist with
declared fixtures or separately authorized regional source, and provider capacity/
availability/access qualification before operational acceptance. Unchanged limits:
100 NM / 2,000 rows / 2 MB / shared upstream dispatch >=30 seconds / whole acquisition
8 seconds / desktop1,000 / mobile100 / follow1 / models0. PR67 remains OPEN/unmerged;
no worldwide/OpenSky, production/SSH/Cloudflare/oras.org/accounts/purchases/new
model/media or C5.7-B/C/D/E/C6 activation.

## Final outer acquisition timeout retention correction

Automatic review of 720458b6, comment4235417143, identified the outer
wait_for(8) cancelling the owned fetch with CancelledError before its inner timeout,
bypassing ordinary HTTPError/ValueError/TimeoutError shared failure retention.
The enhanced existing actual-Redis owner/waiter deadline regression genuinely
failed: 1 failed / 14 deselected (8.70s), stored unavailable entry was None.
After the five-line owned-fetch cancellation handler, the same regression passes:
1 passed / 14 deselected (8.67s). It asserts one cancelled dispatch, both workers
unavailable, shared {'unavailable': True}, >=59s remaining failure dispatch lease
and a different-region claim still limited by that lease. Waiter cancellation does
not publish a failure. Existing eight-second acquisition wait_for and <9s wall-time
scheduler/transport tolerance are unchanged; no claim of an exact 8.000s HTTP
wall-time bound. Fixtures only, UUID Redis namespace, no live aircraft request.

Fresh final-backend Docker qualification: 48 passed / six existing dependency
warnings on disposable (14.04s) and correctly restored normal runtime (14.05s).
Normal backend image rebuilt from owned worktree. Initial recreation omitted the
original catalog/ephemeris overrides; preservation correctly failed. The 48-pass
wrong-mount attempt is retained as excluded proof, then original mounted astronomy
paths restored explicitly, preservation passed, and all48 normal tests rerun.
No owner data/datastore/volume deletion, reset, migration or prune. Original81
volume names, datastore IDs/full mounts/running, owner settings/environment/head,
astronomy mount sources, clean source pin and rollback payloads verified unchanged.
Normal five services remain running; owned qualification backend stopped again.

Earth source/frontend/artifact5a3bc and unchanged Sky are untouched by this final
backend correction. Their completed108 runtime/229 frontend/24 aircraft +43 existing
browser checkpoint is applicable to the same renderer artifact, not a rerun after
this backend-only change. Fresh normal HTTP verification passes all512 Earth and96
Sky payload bytes. No new artifact/hash edit or unnecessary renderer/browser campaign.
Documentation11 units and both validators rerun before delivery; actual final-head
checks/thread snapshot accompanies the 28-field private handoff. Evidence, commands,
red/green, excluded mount attempt and final GitHub snapshots are retained under
c57a-outer-deadline-20261009; complete renderer profiles/screens/commands remain in
c57a-client-backoff-20261009. Final handoff is provided in both private archives.

Technical fixture qualification is ready for owner review subject to accompanying
actual GitHub snapshot. Human visual-quality and physical-device acceptance PENDING;
live authorized availability/access/capacity/count UNKNOWN/BLOCKED, historical one503
probe only. No new live aircraft probe or OpenSky acquisition; all approved limits
unchanged. PR67 OPEN/unmerged; stop after handoff, no later package activation.
