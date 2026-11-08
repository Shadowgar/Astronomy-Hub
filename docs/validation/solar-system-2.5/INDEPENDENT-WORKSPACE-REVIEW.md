# Independent mission workspace review

Reviewer: separate asset/source agent; did not author or modify the mission
workspace, source-contract implementation, navigation implementation or renderer.
This review added test fixtures and regressions only. Initial branch HEAD was
`ea4d384af3aead949de7bec1947e8aff41465bca`; the reviewed implementation was an
uncommitted working-tree delta, bound below by exact file hashes.

## Corrected findings

| Priority | Original location | Cause / impact | Correction independently verified |
|---|---|---|---|
| P1 | `MissionWorkspace.tsx`, visibility listener originally line 59 | Listener retained the initial mission's `pause/persist` closure. Hiding a tab after changing spacecraft could navigate back to the first mission with the new mission's epoch. | Listener invokes the latest pause callback. Real React/browser mission switch and visibility event preserve Cassini. |
| P1 | `missionContracts.ts`, original state/catalog admission | Frontend expected object coverage while the backend supplies segment arrays, and rejected unavailable catalog entries with a null default epoch. Valid production-shaped catalog/state responses could not open missions. | Nullable entries remain visible/unavailable; qualified entries and segment arrays are admitted. |
| P1 | `missionContracts.ts`, sample admission and interpolation | UTC labels were checked without binding target TDB epochs to craft epochs or checking TDB interval duration. A target knot shifted by 100 seconds was admitted and changed Hermite tangents. | TDB drives tangent duration; adjacent UTC/TDB intervals agree within 3 ms; craft and target TDB knots must match. Both corrupt cases now reject. |
| P1 | `missionContracts.ts` / workspace trajectory action | State coverage could widen the catalog interval. Unrelated path segments and a trajectory response with a wrong mission/frame could be admitted after stripping its envelope. | Coverage and segment identity/quality/date limits are bound to catalog; full trajectory mission/frame/origin/units envelope and point count are checked. |
| P2 | `MissionWorkspace.tsx`, catalog request / unknown mission branch | Catalog outage Retry did not refetch. Unknown mission kept loading because catalog arrival did not change the effect dependencies. | Retry refetches; catalog-loaded dependency triggers an explicit unknown-mission error. |
| P2 | `MissionWorkspace.tsx`, event navigation | Date-only Cassini end at representative noon ignored the separately qualified pre-entry view epoch and was disabled. | Availability and seeking use `view_epoch` when supplied, preserving the date-only milestone. |

The root author also bound mission NAIF identity and target appearance/NAIF
identity to catalog records during this review. Negative contract regressions
confirm identity substitutions reject. Native Sky return was inspected through
`RuntimeHost`: URL date establishes time intent, while saved navigation state
restores only the applicable camera; stale saved UTC does not override mission
time there. Actual native/browser handoffs remain the coordinator's runtime
qualification, not a claim from this fixture test.

## Evidence

Commands from the recovery worktree:

```sh
node scripts/validation/verify_solar25_workspace.mjs http://127.0.0.1:4265 output/playwright/solar-system-2.5/workspace-review-secondary
cd frontend
npm test -- --run tests/missionReview.test.ts tests/missionContracts.test.ts
```

Browser result: **5/5 passed, zero page errors**. The browser executes real React,
MemoryRouter and workspace hooks; science HTTP responses and the heavy scene are
explicitly stubbed. It verifies unavailable-catalog entries, visibility after
mission switching, catalog-outage retry, unknown-route failure and Cassini's
separate pre-entry view anchor. It is not historical-source, GPU or visual proof.
Receipt: `output/playwright/solar-system-2.5/workspace-review-secondary/results.json`.
This repeat uses the refined 10:29:59 UTC Cassini view anchor, inside the
conservatively admitted final trajectory endpoint.

Contract tests: **18 passed across 2 files** (197 ms). Before correction, the new
independent file had **4 failures / 1 pass**, exposing TDB mismatch, widened
coverage and unrelated path admission. All now reject; a sixth independent test
checks full trajectory envelope identity/frame/units and point count.

Hashes were independently re-read after the passing browser run and matched its
receipt:

```text
MissionWorkspace.tsx  8f6508357aeaeaa561da7b2db2ab70dd01ac84ea8fb7a4438870273f0fc11993
missionContracts.ts  842f911748d78b1baa0f6f126337941978253aa7524ee299d824b556b92b4d7b
```

No open finding remains from these specific cases at those file hashes. Further
implementation changes require applicable rechecks. This is a bounded workspace
review, not approval of the whole PR, renderer, actual historical data release,
device behavior or owner visual result.
