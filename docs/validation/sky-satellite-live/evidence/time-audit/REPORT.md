# Bounded time and navigation audit

Branch `sky-satellite-live-repair-1`; audited baseline `9ee6d85982edb3db276490706a82af83538e5e8d`. Actual desktop Chromium preview `http://127.0.0.1:4225`, 1440×900.

Context inherited from parent: `docs/validation/sky-satellite-live/loaded-documents.json`; CORE/LIVE top authority confirms PS1–PS3 preservation. Owner satellite directive authorizes this bounded audit and compact status repair. No additional document pack was loaded by this subtask.

| Case | Native UTC before → after | Speed | Hub UI | Same frame within sample |
|---|---|---|---|---|
| normal-no-date | 2026-10-24T07:56:41.490Z → 2026-10-24T07:56:43.320Z | 1 | LIVE | True |
| live-solar-return | 2026-10-24T07:56:45.759Z → 2026-10-24T07:56:45.759Z | 0 | SET TIME | True |
| explicit-historical | 2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z | 0 | SET TIME | True |
| now-resume | 2026-10-24T07:57:04.447Z → 2026-10-24T07:57:06.689Z | 1 | LIVE | True |
| fixed-solar-return | 2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z | 0 | SET TIME | True |
| earth-moon-system-return | 2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z | 0 | SET TIME | True |
| native-moon-return | 2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z | 0 | SET TIME | True |

No page errors; one iframe in every sampled Sky scene. Native selection/lock were null in navigation cases. `proof.json` retains exact request payloads, wall timestamps, stored intent, frame identity and native observer.

## Root-cause findings

- **Repeated/stale time intent not reproduced.** `workspaceRuntimeAdapter.ts:51` keys in-flight work by client and temporal URL intent. The source guard already existed in the audited committed baseline. Actual native selection of NORAD 28096 changed the URL in Live and historical scenes without adding any time command; Live kept speed 1 and advanced; historical kept speed 0 and exact UTC. See `selection-churn-proof.json`. Selection API calls are supporting lifecycle evidence, not visual interaction or orbit-accuracy qualification.
- **Historical pause is deliberate.** `entry.mjs:15` sets native observer UTC and live mode; `plugin.js:242` maps Live to speed 1 and controlled time to speed 0. Explicit historical links therefore freeze correctly.
- **Solar return freezes at its approved source epoch by existing contract.** `solarContracts.ts:30` always sets `date`; `planetContracts.ts:32` does likewise for system/Moon returns. A formerly Live Sky also returns paused after Solar. This is explicit source-epoch transfer, not stale-client application; the repair preserves it and makes the state and Resume Live choice explicit.
- **Confirmed interface gap:** baseline `TimeSurface.tsx:28` called frozen scenes SET TIME and hid their status below 1000px via inherited adaptive CSS. Compact status now says Paused, makes Resume Live direct, and preserves Tracking independently.

## Implemented frontend scope

- `frontend/src/features/workspace/TimeSurface.tsx`: compact two-line status; explicit Paused/Resume Live; independent Tracking/Stop tracking; current feed/selected TLE details in existing time panel.
- `frontend/src/features/workspace/WorkspaceShell.tsx`: wires native tracking and exact current-selected NORAD into the existing backend status path; no changes to native time intent/navigation contracts.
- `frontend/src/features/workspace/satelliteTimeStatus.ts`: GET `/api/sky/satellite-feed?norad=…` through existing API client, current UTC only, abort signal, 60s cached polling, no per-frame catalog scan; missing/failed source is Unavailable; fresh requires complete per-record counts; mixed/stale is Stale data.
- `frontend/src/features/workspace/workspace.css`: compact layout and visible mobile status badges using existing glass.
- `frontend/tests/workspaceTime.test.tsx`: real rendered-state/action assertions.

## Commands and results

- `node output/sky-satellite-live/time-audit/audit.mjs`: PASS seven navigation/time scenarios (six required plus Live→Solar→Sky), 15 observations, no page errors. First harness-only accessible-name mismatch retained in `harness-selector-failure.json`; corrected selector, no timeout inflation.
- `node output/sky-satellite-live/time-audit/selection-churn.mjs`: PASS Live and historical native-selection URL churn; no extra temporal commands.
- `npm --prefix frontend run test -- tests/workspaceTime.test.tsx`: initial RED 9 failed / 7 passed; extra per-record freshness RED 2 failed / 18 passed.
- `npm --prefix frontend run test -- tests/workspaceTime.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/runtimeProductState.test.ts tests/viewNavigation.test.ts tests/workspaceNavigation.test.ts tests/solarContracts.test.ts tests/planetContracts.test.ts`: final GREEN 7 files / 67 tests.
- `npm --prefix frontend run typecheck`: exit 0.
- `git diff --check`: clean.

No commits, pushes or PR operations from this agent. No Docker, scientific data, native source, renderer pins or build changes by this agent.

## Remaining qualification

Updated status browser qualification PASS on parent integrated preview 4226 at 1440×900, 390×900 and 667×390. Actual historical UTC remained frozen; Resume Live retained the same frame and resumed UTC; actual Hub Track/Stop tracking changed native lock independently of speed 1; unavailable-data route fixture preserved Live. All sampled status badges were visible and bars did not overflow; no page errors. See `status-browser-proof.json` and `status-*.png`. Actual mobile/short time panels reported NORAD 28096 epoch 2026-06-02T19:52:46Z, 143.5 days old at current UTC, stale; catalog 0 fresh / 14,281 stale, provenance unavailable. Desktop details were captured during pending source lookup, so selected age is qualified by mobile/short completed responses. Harness-only nested-region selector error retained before corrected mobile run; no application change or timeout increase. Root owns full runtime/scientific/pixel qualification, exact artifact identity, full test bundle and independent final-head review. Physical-device and owner acceptance remain separate. No current-orbit accuracy claim is made from stale elements.

Recommended next step: root completes native pixel/motion tests and final artifact/review qualification; then stop for owner functional acceptance.

- `node output/sky-satellite-live/time-audit/status-browser.mjs`: three-viewport integrated UI PASS, consolidated proof retains first desktop run and corrected two-viewport mobile/landscape run.
- `curl -s -w ... http://127.0.0.1:4226/api/sky/satellite-feed?norad=28096`: HTTP 200, actual selected TLE response, elapsed 0.005211 s (one request observation, not performance qualification).

## Independent review follow-up P2 — actual RED

`node output/sky-satellite-live/time-audit/tracking-selection-red.mjs` reproduced a separate native selection/tracking ownership defect on the retained 4226 preview at 2026-10-24T08:10 UTC. Existing public adapter canonical selection was used for both real NORAD identities; Track A was an actual Hub button click. No focus call or time change was applied to B.

1. Track A / ISS 25544: core selection 25544; core lock 25544; snapshot selection 25544 and tracking true; UI ISS, Stop tracking, LIVE/TRACKING.
2. Select B / HST 20580: core selection 20580; core lock remains 25544; snapshot selection 20580 and tracking true; UI HST, Stop tracking, LIVE/TRACKING. The camera still follows A while the UI associates tracking with B.
3. UTC advanced 08:10:14.604 → 08:10:17.564, speed remained 1. No page errors.

This is not a stale time-intent freeze. Root owns the narrow native tracking controller correction and final GREEN. Evidence: `tracking-selection-red-proof.json`, `review-track-A-25544.png`, `review-select-B-lock-A.png`, served build/version JSON. Native pointer selection of B was not additionally exercised; the public canonical adapter path reproduces the defect directly.
