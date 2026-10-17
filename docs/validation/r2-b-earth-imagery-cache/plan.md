# R2-B implementation plan

Owner's pasted R2-B directive is the binding spec and already defines the bounded
design: reuse PR71 imagery/cache with current R2-A navigation; no redesign or new
approval round. Inline execution; separate branch from27f34a94, draft stacked on78.

Global constraints: no merge/deploy/R3, spending/accounts/dependencies, upstream
source edits, new terrain/buildings, native scheduler replacement or tile throttle.
Preserve N1 accepted camera, observer/time/tracking/selection, Sky and all rollback
artifacts. Preserve R2-A search. PEMA release/redistribution and ion remain gated.

Task1 — native imagery integration and cache lifetime
- Reuse PR71 AdmittedMapSources, ImagerySelectionPolicy, imageryRequests/session,
  ImageryController, cache policy/store/worker and client. Tests reused first,
  observe missing-capability RED; qualify admitted native scheduling/fallback.
- Add focused RED/GREEN for scene/disposal invalidating asynchronous cache writes.
  Reuse public worker messaging; no foreground request queue or render loop.
- Merge only tile-progress listener into current ViewerController, worker startup
  and diagnostics into entry. Keep CameraController/RuntimeBridge/EarthRuntime
  navigation/provenance and pagehide logic. Add worker build/source manifests.
- Inspect provider permissions/edition metadata. Activate only eligible configured
  sources; fail closed and label PEMA as local-only with release rights unverified.

Task2 — Hub sources/cache interface
- Reuse ImageryCacheSection inside current DiagnosticsSurface composition.
  Expose provider/edition/coverage/loading/fallback facts via existing quality
  snapshot strings; remove stale fixed-resolution text. No provider toolbar.
- Tests first for current truthful source details and cache controls; preserve
  R2-A search and existing Sky About/navigation.

Task3 — artifacts, Docker/browser proof and draft delivery
- Complete frontend/runtime/Earth suites, typecheck, bounded backend regressions.
  Build Earth twice using existing pinned readonly dependencies; build Hub twice.
  Update only Earth artifact/admission metadata, preserve source pins/Sky bytes.
- Own new preview backend/nginx only. Keep originals, mounts/volumes/settings.
- Actual desktop/mobile imagery cases: ORAS, eligible US aerial, uncovered US,
  non-US, fast boundary moves, source failures/cooldown/recovery, search refinement.
- Fresh disk profile, cold/warm/restarted process measurements; genuine source
  response persistence plus declared fixtures for corrupt/expired/private/token/
  no-store, owned clear confirmation/cancel and unrelated saved work.
- Focused R2-A native search/history/zoom/pan/Sky return and repeated/cancelled
  lifecycle journeys. Do not rerun N1 stalled full suites or troubleshoot resources.
- Source-bound screenshots/receipts/builds, exact-file inventory and limitations.
  Commit/push, independent exact-head review, fix genuine in-scope findings with
  RED/GREEN and affected requalification, draft PR on r2-a-earth-search-1; STOP.

Pre-flight interfaces: ImageryController consumes current runtime.viewer/lifecycle/
attribution/timings without changing navigation. quality remains string map in the
existing bridge snapshot. Worker/client protocol is independent of astronomy bridge.
Build attestation must include packages/imagery-cache alongside runtime-protocol.

Review focus: original N1 code retention, metadata freshness/identity, blocked/late
provider completions, cache lifetime across scene/dispose/clear, source truth versus
visible coverage, eligible-source rights, owned-only deletion and source-bound proof.

Progress: baseline clean at27f34a94; prior context61 paths match; snapshot103 existing
containers/90 volumes. Implementation/qualification/delivery pending.

Progress update: Task1/2 integrated; initial feature RED, five cache lifetime/rights
REDs and terminal-generation RED retained. Current222 native/runtime tests,291
frontend tests/typecheck and43 backend tests pass. Phase1 Earth/Hub reproducible
builds and desktop/mobile14 search groups pass. Subsequent one-line terminal
cache guard requires new Earth builds and final current-source browser proof;
qualification remains pending. Paris debug established a startup waiter race:
local ready immediately precedes EOX loading;36 EOX tiles decoded and native
settlement within about10s. Driver now waits for remote decode first.
