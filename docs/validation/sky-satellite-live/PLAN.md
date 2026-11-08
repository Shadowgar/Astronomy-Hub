# Focused Sky satellite repair implementation plan

Owner directive: October24,2026; attachment0b000802-b699-4e00-9379-0ac835f0a65f.
BasePR95 `9ee6d85982edb3db276490706a82af83538e5e8d`; new isolated branch
`sky-satellite-live-repair-1`. Implementation detail under the canonical roadmap.

Goal: restore source-backed moving native light points in Live, automatic native
close identification, selectable/native tracking and understandable paused/stale
states without changing the approved satellite design or scientific math.
Architecture: Hub owns time/selection intent and small glass status; contained
Stellarium owns SGP4, photometry, scene, camera lock and rendering. Existing FastAPI
source status/propagation remains authoritative. No new engine, provider or dependency.

- [x] Record exact base/source/artifact/data identities, context and protected owner state.
- [x] Independently audit native catalog/freshness, Hub/native time restoration,
  light-point/hint magnitude gates/discovery and native tracking; root-cause matrix.
- [x] Reproduce each demonstrated regression in focused tests or real-browser red evidence.
- [x] Correct only proven causes using existing adapter/bridge/UI contracts. Keep
  5°entry/7°exit and minimumhintoffset4 unless evidence proves a defect. Preserve
  user-disabled rendering/hints, atmosphere/night/landscape/observer/time.
- [x] Qualify source-backed point pixels+motion, real-input close symbols, widening,
  independent time/tracking and navigation/recovery at1440×900,390×900,667×390.
- [x] Run targeted backend/runtime/frontend/type/source tests; repeat UI/Hub builds,
  compare committed/served artifacts and preserve native JS/WASM/pins/data/rollback.
- [x] Reconcile governance/evidence and push draftPR101 stacked onPR95.
- Final exactHEAD review is recorded in the PR101 conversation after commit/push,
  avoiding a self-referential review hash in this plan. Stop for owner functional
  acceptance; no merge/deploy.

Review focus: stale TLE cannot become live-accuracy evidence; advancing UI clock
cannot substitute native motion/pixels; focus lock and time are independent;
repeated/stale asynchronous intent must not pause Live; user-disabled preferences
must survive policy changes and remount; only one heavy renderer may survive.

Historical/native mechanics are qualified; current Live accuracy remains blocked by stale source.
Source retries stopped after two bounded timeouts separated by the environment restart.
