# Cinematic Solar — review candidate, 2026-10-21

**IMPLEMENTED AND FOCUSED-QUALIFIED; OWNER VISUAL ACCEPTANCE PENDING. DO NOT MERGE OR DEPLOY.**

Branch `r3-a-cinematic-solar-1`, stacked on documentation PR82 at
`7aaeeef4e4e9b6ad406752814270ea0970666104`, preserving scientific PR81
`a646960edda6968be2bf8453b7863ff0dba75d18` and the existing PR80→79→78→74→73 chain.
PR71 remains independent. Final SHA/review are recorded in the delivery receipt/PR.

[Working local preview](http://127.0.0.1:4211/solar-system?date=2026-02-28T00:00:00Z)
uses only task-owned Docker backend/preview containers, existing read-only native
artifacts and mounted DE442s. This is a local owner preview, not a production deployment.

## Context and design

Default Mode: CORE_CONTEXT and LIVE_SESSION_BRIEF followed by the union of
`docs_change`, `frontend_change`, `planning`, `reconciliation`, `validation`, `review`.
The exact 63-document loaded inventory and hashes are in the
[context record](../../design/cinematic-references-2026-10-21/context.json).
R1-A/ORA-6 original sketches, PR81 validation and the owner's attachment/archive were
explicit task-authorized additions. No full docs scan or unrelated documents loaded.
New documents in this package are supporting validation records, not new authority.

The [owner-approved original references](../../design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md)
are imported unchanged and linked directly. Four image hashes match both the original
ZIP manifest and prior committed approval ledger. The ZIP has no separate pre-existing
outer-file hash; its recorded SHA was measured at import. Stage1 commit `7aaeeef4` has
no runtime changes. The R1-A interaction model and contained renderer boundaries remain.

## Implemented behavior

The full viewport contains the interactive Three scene: textured NASA Earth/Mars,
illustrative Sun granulation/corona, directional Sun illumination, atmospheric rims,
a spatial illustrative starfield and toggled actual sampled trajectories. The renderer
owns camera/picking/materials. Compact body rail, responsive contextual detail card,
time capsule/dialog and source/help dialogs belong to the Hub. No permanent sidebar,
automatic rotation, extra bodies, mock science, live imagery provider or dependencies.

NASA's original Mars UV mesh is retained because its color texture is an atlas;
remapping that atlas onto a generic equirectangular sphere would be incorrect. Only
color imagery is used; no normal-map terrain or body-fixed orientation claim.
[Exact asset bytes, rights, source URLs and credits](../../../frontend/src/features/solar/assets/provenance.json).
[Implementation plan](PLAN.md), [fidelity comparison and screenshots](FIDELITY.md),
[exact executed commands](COMMANDS.md), [changed files](FILES_CHANGED.txt).

## Actual results

| Qualification | Result and evidence |
| --- | --- |
| Cinematic desktop1440×900 / mobile390×900 | **9/9 each**; source positions, textures, controls, camera focus/approach, direct geometry selection, UTC, keyboard, source dialog. [JSON](evidence/cinematic.json) |
| Native navigation desktop / emulated mobile | **14/14 each**; actual Cesium coordinate destination, Earth/Sky round trips, Pennsylvania landscape, observer/time, URL/history, single renderer. [JSON + 255 source hashes](evidence/navigation.json) |
| Failure/lifecycle | **7/7**; asset outage/recovery, preferences across time, real WebGL context loss/retry, responsive focus, idle renderer, delayed asset after disposal. [JSON](evidence/lifecycle.json) |
| Native identity / races | **3 + 1 + 1**; unchanged incoming Mars identity, controlled time, rejected-time return, concurrent history and delayed entry ACK. [Identity](evidence/identity.json), [history](evidence/history-race.json), [entry](evidence/entry-race.json) |
| Frontend | **305/305, 44 files**; TypeScript PASS. [Tests](evidence/frontend-tests.log), [typecheck](evidence/typecheck.log) |
| Runtime/Earth | **231/231**. [Log](evidence/runtime-tests-host.log) |
| Solar science | **7/7** host; authoritative Docker focused ephemeris **15 passed, 2 skipped**, two existing deprecation warnings. [Host](evidence/science-tests-host.log), [Docker](evidence/docker-ephemeris.log) |
| Builds | Two clean host builds plus independent offline pinned Node Docker build: identical **135 files**, artifact `c4ed5c48ca59057e20a5f896fd3da9d2347f84da89ab5bcd538f257569334115`. All135 Hub and514 native Earth served files match. |
| Assets/preservation | Four original approved PNGs, two NASA source files, unchanged source pins/native artifacts/kernel/settings/rollback;114 original container states/mounts and90 volumes exact. [Candidate receipt](evidence/candidate-preservation.json); exact committed receipt follows delivery. |

Science/API/contracts and physical radii are unchanged. Actual native scene positions
are asserted equal to Docker-returned JPL/Skyfield vectors at controlled UTC; new unit
tests prove display framing does not mutate those positions. Earlier independent
Horizons comparisons remain historical, source-matched PR81 evidence; they were not
requeried or relabeled as fresh. Mars remains target4 system barycenter, not499 center.

## Failures and limits retained honestly

- Initial browser readiness failure at12s was a preview startup race: task nginx logged
  HTTP502 / upstream connection refused at15:36:10UTC; first confirmed API200 at15:36:55.
  No timeout increase or application workaround. Final actual journeys passed.
- Initial runtime test sandbox failure was `spawnSync python3 EPERM` in the export
  fixture. Same231 tests passed with host permissions. The sandbox Python-only run
  stopped after5 checks and was terminated (only this task PID); cause not established.
  Same7 checks passed on host and focused15 passed in Docker. No broad retry cycle.
- A lifecycle harness initially demanded exact floating-point camera equality after
  OrbitControls; observed rounding ~5e-17. Corrected to1e-10 tolerance, no app correction.
- RED evidence: new scene-layout expectation fails against old PR81; framing helpers
  initially fail3 tests; portrait orientation regresses1 test before its bounded fix.
- Vite emits its unsuppressed >500kB chunk advisory: lazy Solar JS614.09kB /157.49kB gzip;
  original PR81 Solar chunk ~525kB. Source assets are1.51MB Earth and4.03MB Mars. No new
  runtime dependency, data bulk in images, provider/account or paid service.
- SwiftShader is software rendering, not physical GPU acceptance. The full-effect
  camera sample (1.1s,22 frames) measured median33.2ms and p95 166.6ms RAF intervals;
  effects/orbits off measured16.7ms /83.4ms in a separate sample. These short measurements
  show stutter on this host and do **not** establish a stable FPS promise or controlled
  causal comparison. No perpetual frame loop, <=1.5 pixel ratio and4000 point stars;
  immediate reduced-motion navigation and effects toggle remain available.
- Original PR81 broad backend sweep remains historically326passed/1baseline TTLfailure/
  294incomplete at180s. Not rerun. N1 historical desktop5/22 and mobile7/22 at240s,
  UNKNOWN cause, remain partial; N1 OWNER ACCEPTED is preserved, never fresh44/44.
- No owner visual acceptance, physical mobile/GPU matrix, full R3, R4 surface, accurate
  rotations/nightlights/live clouds or extra bodies. Real scientific geometry means
  scene composition varies with date and cannot copy the concept's invented positions.

Next proposed package: harmonize Earth/Sky chrome with the same approved visual family,
using existing contextual UI and untouched native renderers, after review of this Solar
candidate. This proposal does not activate Earth/Sky redesign, R3-B or R4.
