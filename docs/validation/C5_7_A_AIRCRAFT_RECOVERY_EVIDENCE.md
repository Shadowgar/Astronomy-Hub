# C5.7-A aircraft recovery evidence

Owner authorized 2026-10-08, single agent. Starting main
`8270e782f73d4df58b16e762cdb4f0031a37ada3`; branch
`c5-7-a-aircraft-regional-recovery-1`. Qualification is in progress; this record
will be finalized with exact final artifact and results before PR delivery.

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

Two independent clean pinned builds, `cache-a` and `cache-b`, matched every
payload plus release metadata: 513 identical files, 512 payload files.
Final Earth artifact: `230e778f4ab3d6038bdb01615ca21d15ed0c494fa4219cb591cd668ad388b529`.
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
| `docker compose -p oras-c57a-qualification -f /tmp/oras-c57-a-qualification-20261008/compose.yml exec -T c57-backend python -m pytest backend/tests/test_earth_aircraft.py backend/tests/test_earth_events.py -q` | 44passed,0skipped; six existing library deprecation warnings. Actual Redis coalescing/budget tested, unique test namespace only. |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` | 87passed,0failed/skip. Export-boundary subprocess needs unsandboxed local IPC; supporting sandbox attempt failed that test only, complete rerun passed. |
| `npm test -- --run` in frontend | 229passed across28files. |
| `npm run typecheck` and `npm run build` in frontend | TypeScript and Vite passed. |
| `python3 -m unittest tests.validation.test_reconciliation_docs` | 10passed; exact bounded OD1 state allowed, generic OD1/global approval and OD2–OD6 promotion rejected. |
| `python3 scripts/validation/validate_architecture_docs.py` | PASS:279doc entries,277task+2global,50checkpoint docs,1379relative links,9ADRs. |
| `python3 scripts/validation/validate_reconciliation_docs.py` | PASS:67capabilities,51entrypoint references,404links,58fragments; bounded OD1 only. |
| `ORAS_EARTH_OUT=/tmp/oras-c57-a-qualification-20261008/cache-a bash scripts/runtime/build_owned_earth.sh` and independently `cache-b` | Both clean builds passed; all513file hashes identical. |
| `python3 scripts/runtime/record_runtime_versions.py /tmp/oras-c57-a-qualification-20261008/cache-a` | VERIFIED final artifact; unchanged Sky lock. |
| `python3 scripts/runtime/earth_artifact.py verify --source /tmp/oras-c57-a-qualification-20261008/cache-a` | VERIFIED source inputs/dependencies/payload. |
| `python3 /tmp/oras-c57-a-qualification-20261008/verify-served.py` | PASS all512Earth/96Sky HTTP bytes. |
| `python3 /tmp/oras-c57-a-qualification-20261008/preserve.py` | PASS datastore/settings/81volumes/pin/nativeSky/rollback preservation. |

The provisional7ad3 artifact campaign passed13/14 in15minutes; lifecycle cache
assertion failed and was strengthened to await the actual settled home region.
The final reproducible artifact campaign includes that correction, device resize
admission and the100-contact mobile reduction. Its exact outcome follows below.

## Final acceptance evidence ledger

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
reported disposed/viewerDestroyedtrue, and model requests0. Final230e source only
adds the demonstrated geographic cache-return fix; the complete16-test aircraft
campaign and affected existing regressions are rerun for that final artifact.

Final230e direct-cache green proof:1passed in28.5seconds. Three requests acquired
the initial/explored regions; after actual return, request count remained3,
coverage center41.3,-79.6 and cachedtrue, with unchanged source time/17.45s age.
Both final cache-a/cache-b builds match513files; all512Earth and96Sky served
bytes verify. The full16-test campaign is running; existing regression campaign
and final normal-development restoration remain pending at this review checkpoint.
