# N1 final UX corrections — PR #75

PARTIALLY QUALIFIED — OWNER-AUTHORIZED MERGE OF PR #75. Default Mode, single agent; existing N1 branch and PR75 → PR74 → PR73.
Baseline f3629f9a. Owner-approved scrolling/scenery/Adaptive Explorer remain accepted;
satellite hint policy remains unchanged and pending owner acceptance. Entire N1 is
NOT YET FINALIZED. No merge of PR74/73, production deployment, R2/R3, Satellite Explorer
implementation, Earth imagery expansion, new dependency/provider/native C/WASM or spend.
[Context ledger](loaded-documents.txt), [implementation/qualification plan](plan.md).

## Confirmed baseline behavior

At ORAS, real Chromium pointer selection of native NORAD28096 is followed by the
Hub's native-selection URL replacement. The same-route synchronization effect
unconditionally issues `setTimeIntent` on every query change. A fixed-night URL
reissues the same date; a live URL with native historical night/paused clock rebases
the native clock to the wall clock, resumes speed1 and turns the rendered sky blue.

Controlled source-backed historical fixture: before `2026-06-04T02:58:00.000Z`,
speed0; after selection `2026-10-16T14:09:41.592Z`, speed1. Actual native selection
is NORAD28096; atmosphere remains ON, Night Mode stays OFF, observer/elevation and
camera yaw/pitch/FOV remain unchanged. Central sky mean RGB rises from 29.09 to
217.60, with blue pixels rising from1465 to313164. This reproduces a measured
failure class, not a claim about the owner's unspecified exact observing state.
The first short-wait attempt did not actually select a satellite and is excluded.

The actual baseline menu offers Open standalone Sky, while FOV is absent. Public
Copy link also exposes the native application route. Internal runtime routes must
remain available. Replacing public navigation does not remove upstream attribution.

## Contained changes

Time synchronization caches the actual fixed/live intent per exact runtime client
and shares its pending acknowledgement across query effects. Selection and observer
changes reuse that intent; explicit time changes and Back/Forward still synchronize.
No global clock freeze or atmosphere change. A superseded request cannot settle a
replacement session's time state.

The Sky-only `oras-sky-fov.v1` report samples one native FOV scalar at bounded10Hz
inside the active visible frame, publishes only changes and exact origin/frame/nonce/generation/sequence validation. It resets
across renderer replacement, survives cached departure/restoration and disposes its
listeners/timer. No new Hub command polling or shared Earth protocol change. The bounded sampler
also covers pinned `zoomTo(...,0)`, which changes native FOV without a reactive
notification. It pauses while hidden/cached and releases its timer on teardown. The glass readout
is keyboard focusable with live announcements OFF. Native minimum FOV is one arcsecond;
formatting never rounds a valid narrow view to zero. Baseline PageUp did not change
embedded FOV; contained PageUp/PageDown forwarding uses the existing native zoom API
at the canvas center, keeping wheel gain/damping and native camera math unchanged.

Public standalone Sky/Earth menu links are removed. Copy link translates native exact
identity to the existing Hub route. About & Licenses uses an accessible native dialog
with Escape/focus restoration, original AGPLv3/Cesium license copies, pinned upstream
and public modified-source/download links, and preserved catalog/imagery credits.
Original runtime endpoints, notices, package/API/source identities remain intact.

Source access was verified PUBLIC through GitHub. Pinned source headers identify
Stellarium Labs SRL copyright2022 and GNU AGPLv3 / alternative commercial terms.
No alternate commercial grant is established here. The served license is an unchanged
copy of the pinned file; source access includes the modified Hub/overlays/adapters and
pinned full upstream source. This is implementation evidence, not a definitive legal
compliance certification for every deployment or component. Original scientific and
provider/data acknowledgments remain available. Primary references:
[GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0-body.html),
[pinned upstream](https://github.com/Stellarium/stellarium-web-engine/tree/023e3b26babf7ffddf45f39293230b14cfe96993).

Satellite Explorer requirements are recorded in the existing MASTER_PLAN only.
The unchanged mounted snapshot has14281 records/unique NORAD IDs, including12029
with unspecified type metadata. It is not a current-catalog completeness or brightness
claim; stale mounted data and legacy five-digit TLE qualifications remain open.

## Qualification and delivery

**PARTIALLY QUALIFIED.** The owner explicitly authorized review-only commit/push in
[PR75](https://github.com/Shadowgar/Astronomy-Hub/pull/75#issuecomment-6221730719),
then authorized merging PR75 with the subsequent chat instruction “merge and move on”.
That latest authorization supersedes the earlier DO NOT MERGE restriction for PR75
only; it does not convert incomplete navigation into a pass or authorize merging
PR74/73, deployment or R2/R3. The existing implementation is preserved.

Desktop5/22 and mobile7/22 groups completed before240-second outer caps. Underlying
cause remains UNKNOWN; no functional assertion mismatch was reproduced. No stalled
suite is rerun for this delivery. Seven previously passing browser families are reused
only after source-hash verification. [Bounded handoff](QUALIFICATION_HANDOFF.md) preserves
all original outcomes. [Delivery authorization and checks](DELIVERY_AUTHORIZATION.md)
records the owner exception and post-commit identity/review procedure.

A separate post-commit receipt will bind the delivered SHA, remote head, committed
source and served preview bytes, Codex review, and eventual PR75 merge result. It
must retain PARTIALLY QUALIFIED status. It is not the old all-nine-families PASS
certificate or full-qualification receipt; those guards are not weakened.

Preview: <http://127.0.0.1:4202/sky-engine>.
Existing [PR #75](https://github.com/Shadowgar/Astronomy-Hub/pull/75), branch
`n1-sky-earth-navigation-1`; dependency chain #75 → #74 → #73 must remain open.

The exact changed-file list is [files-changed.txt](files-changed.txt). Changes cover
only the three corrections, focused regressions/browser drivers, emitted UI/legal
assets/admission metadata, and the scoped planning/governance/evidence documents.
No backend/data/provider/native C/WASM or accepted camera/landscape implementation
changes are part of this task.

### Validation commands

Commands run from `.worktrees/n1-sky-earth-navigation-1` unless a script changes
its working directory. Original logs and every unsuccessful attempt are retained
under `output/n1/final-ux/`; copied test logs normalize trailing whitespace and final blank lines,
with original byte hashes retained in the evidence inventory.

```sh
npm --prefix frontend test -- --run tests/workspaceRuntimeAdapter.test.ts
npm --prefix frontend test -- --run tests/selectionPublicLink.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/skyFov.test.tsx tests/aboutLicenses.test.tsx
npm --prefix frontend test -- --run tests/licenseAssets.test.js
node --test tests/runtime/sky-fov-report.test.mjs
node --test tests/runtime/sky-native-controls.test.mjs tests/runtime/sky-page-lifecycle.test.mjs
npm --prefix frontend test
npm --prefix frontend run typecheck
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
python3 tests/runtime/test_sky_source.py
python3 tests/runtime/test_sky_promotion.py
bash output/n1/final-ux/build-ui.sh
npm --prefix frontend run build
npm --prefix frontend run build -- --outDir ../output/n1/final-ux/hub-alternate --emptyOutDir
python3 output/n1/final-ux/reproduce-build.py
node scripts/validation/verify_n1_final_ux.mjs
bash output/n1/final-ux/final-browser-navigation.sh
N1_SERVED_EVIDENCE=output/n1/final-ux/served-working.json python3 scripts/validation/verify_n1_motion_served.py
```

The completed and unsuccessful historical browser invocations use:

```sh
N1_EVIDENCE_DIR=output/n1/final-ux/satellite-recheck/browser node scripts/validation/verify_n1_satellite_zoom.mjs
N1_EVIDENCE_ROOT=output/n1/final-ux/satellite-recheck node scripts/validation/verify_n1_satellite_symbol_pixels.mjs
N1_EVIDENCE_DIR=output/n1/final-ux/native-satellites node scripts/validation/verify_n1_satellites.mjs
N1_EVIDENCE_DIR=output/n1/final-ux/pennsylvania node scripts/validation/verify_n1_pennsylvania.mjs
N1_WIDTHS=1440 N1_EVIDENCE_DIR=output/n1/final-ux/journeys-desktop node scripts/validation/verify_n1_navigation.mjs
N1_WIDTHS=390 N1_EVIDENCE_DIR=output/n1/final-ux/journeys-mobile node scripts/validation/verify_n1_navigation.mjs
N1_EVIDENCE_DIR=output/n1/final-ux/observer-history node scripts/validation/verify_n1_observer_history.mjs
N1_EVIDENCE_DIR=output/n1/final-ux/product-paths node scripts/validation/verify_n1_final_ux_product_paths.mjs
```

The full combined qualifier `python3 output/n1/final-ux/qualify.py` was not run to
PASS because both required navigation families remain FAIL. The new one-attempt
commands and actual exits are in [the bounded handoff](QUALIFICATION_HANDOFF.md).

Build details: two independently selected pinned upstream checkouts, pre-existing
qualified native trees, the current contained UI overlay, pinned Node20 Docker
image, `--network none`, `ORAS_RUNTIME_COPY_SKYDATA=0`, and read-only installed
build dependencies. Only the UI is rebuilt; native outputs are attested and reused.
The final bridge-only keyboard-modifier guard does not change webpack inputs; it
is emitted as a raw module and included in the fresh Hub builds/admission metadata.
Both trees retain native source-input digest
`99b906b0cad478cfb6c19ec8c2212fd9a5c042c4241e01d588711ef85a1d73be`.

Docker is the runtime authority: `docker compose ps` reports no services in this
worktree's default project; `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'`
confirms the separately named `oras-n1-owner-preview` on127.0.0.1:4202 and
`oras-r1b-backend` are running. The owner preview/backend and their volumes were not recreated or restarted. A separate temporary baseline-control container was created read-only and removed, as described below.
The authoritative browser proofs use that preview, rather than a Vite dev server.
Original browser records capture the pre-commit HEAD and working-source hashes.
The post-commit certificate checks every recorded source hash against `git show`
at the delivery commit; original records are not rewritten to pretend they ran
after the commit. The separate served/remote/review receipt binds the final SHA.
The retained seven read-only mounts bind the compiled Hub, runtime/data and evidence.

### Source/artifact preservation

- Upstream Sky pin: `023e3b26babf7ffddf45f39293230b14cfe96993`.
- Sky payload: `b57c40ddceca090224ac58f4758fde9d2193a649c571e58cb0a618b289649c19`.
- Earth payload: `834fa48f8bc7cb0489c6c14be42a49c5fb6f9c224a6be9968e3c724ae152494c`.
- Native JS: `0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7`.
- Native WASM: `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942`.
- Mounted TLE: `431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`.
- Owner root `.vscode/settings.json`: `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

73 protected paths, source pins/native output hashes and all seven preview mounts
are compared against the pre-task baseline. The baseline includes the unchanged
`satellite-presentation.mjs`, Pennsylvania artwork and accepted navigation sources.
The earlier native-horizon nonidentity flags remain false as before; this task
does not mislabel the existing modified native engine as upstream-identical.
A matching `f3629f9a` rollback of Hub/Sky UI/metadata was copied before changes into
`output/n1/final-ux/rollback/`; earlier artifacts are retained. Large mounted data
are not copied into an image or new rollback package. Owner root checkout state
is separate and untouched.

### Unsuccessful attempts and evidence limits

The baseline's first short discovery wait did not select a satellite; that attempt
is retained and excluded. The successful baseline pointer reproduction and native
clock/illumination measurements establish the time-rebase failure class.

The time hook's genuine RED run has four failing and eight passing cases. After
the fix all12 pass. Additional genuine RED cases cover copied-link navigation,
legal build emission, native keyboard forwarding/modifiers, and silent programmatic
FOV changes. Missing-module startup failures are readiness evidence, not behavioral
RED tests. The source-VM FOV RED is reconstructed against the committed baseline;
current GREEN runs use the modified implementation.

Node test invocations inside the default sandbox emitted misleading file-level
passes without executing nested assertions. Those logs are explicitly invalid and
excluded. Qualified Node runs execute actual nested tests outside that restriction.
Automatic approval review timed out on some safe build invocations; retries or the
workspace-only offline fallback completed them. No denied unsafe action was bypassed.

A full runtime run initially exposed three VM fixtures missing the new FOV installer;
those test environments were corrected. A later artifact guard correctly rejected
stale bridge metadata before promotion. An alternate Hub outDir initially retained
one old JS chunk; the inventory is retained, common bytes matched, and the final
independent output was emptied before building. The initial Hub build lacked legal
assets because public bulk copying is disabled; an explicit four-file allowlist and
failing packaging regression established the correction without copying skydata.

Actual-browser attempts retained separately: hidden Copy link needed Details opened;
Vue-only FOV reporting missed native `zoomTo(...,0)` and was replaced by the bounded
sampler; keyboard assertions needed an explicit canvas focus target (the exact
prior complex-flow propagation cause is not asserted); deliberate prior Focus left
a native tracking lock during a live/no-Focus fixture (the fixture releases it,
production tracking is preserved); About close needed its documented animation-frame
focus restoration to finish before assertion; Earth return uses the existing
`Enter Sky here` label. The legacy navigation suite also used a global `dialog` selector that became
ambiguous when the new closed About dialog existed beside Explore. Its navigation
and observer-history selectors now name the existing `dialog.as-dialog`; assertions
and accepted production navigation are unchanged. The failed desktop run is retained;
the former remaining-family driver is retained as historical attempted infrastructure.
The current single-attempt commands are recorded in the bounded handoff.
A later desktop repeat stalled on an unbounded CDP wheel acknowledgement after
Back restoration. Its log and owned-process state were captured; only the identified
test/Chromium processes were stopped, leaving containers and unrelated browsers
running. The resulting browser-closed error follows that intervention and does not
establish the original stall cause. The driver now checkpoints repeated stages,
bounds CDP acknowledgements at30s and failure diagnostics/close, and saves the proof
before closing. Assertions, real input cadence, renderer and accepted production
controller are unchanged. The interrupted attempt remains excluded from PASS. A bundled-headless-shell retry
then stalled on Playwright `Frame.isVisible`; the owned Node inspector identified
that pending callback with no active timer. Its original renderer/browser cause is
not established. The identified owned retry was stopped and retained separately.
Alternative installed Chrome/headed Xvfb attempts also timed out. A four-sample
short-flow diagnostic passed with default styling and a FOV-only blur override;
computed default blur was already none, so this does not establish a blur cause.
No speculative production styling change was made. A Mesa experiment produced a
blank native canvas and is explicitly unsupported/failed, never acceptance evidence.
Drivers now require an actual native WebGL context and navigation additionally
requires varied sky screenshot pixels. A SwiftShader/compositor experiment and a
mobile default run also timed out under resource pressure.

The same bounded driver against a temporary, isolated, read-only baseline preview
also timed out at the native Landscape control. Four served baseline JavaScript
identities were checked against the original f362 delivery receipt. The temporary
container was removed; the owner preview/backend and original mounts were retained.
Host measurements included under 0.4 GB available RAM and all 4 GB swap in use.
These observations do not establish the precise cause of the stalls, and baseline
failure is not evidence that the new patch passes. The owner offered to release
resources. Final reruns use standard bundled headless Chromium, one browser at a
time, at the original 1440px desktop and 390px mobile widths. No experimental
channel, Mesa or compositor flags remain in the tracked drivers. All failed and
interrupted records and the exact attempted drivers remain preserved separately.

Native observer lat/lon readbacks in the UX proof are radians; product/API coordinates
are degrees. Native UTC/MJD, speed, camera, atmosphere, Night Mode, exact TLE identity,
Hub requested scene intent and issued time commands are recorded separately.
Fixed night uses actual pointer/touch selection; fixed day/live use the actual
source-backed native selection API, avoiding fabricated daytime observability.
Programmatic FOV is a separate path from real wheel/trackpad/pinch evidence.
Physical-device and owner visual acceptance remain outstanding. Historical mounted
TLE/native SGP4 tests do not qualify current orbits, feed freshness/completeness,
brightness estimates or the legacy five-digit TLE boundary. Unknown resource-failure
counts are recorded as null, never inferred as zero. No general provider/network
or legal-compliance certification is made.

### Owner acceptance gate

Scrolling: **OWNER ACCEPTED**. Pennsylvania landscape: **OWNER ACCEPTED**.
Prior five P2 findings: **RESOLVED**, with preservation checks required.
Satellite symbols: **PENDING FINAL OWNER ACCEPTANCE**.
Selection/time: **PENDING OWNER RETEST**. FOV: **PENDING OWNER VISUAL ACCEPTANCE**.
Product navigation/branding: **PENDING OWNER ACCEPTANCE**.
Entire N1: **NOT YET FINALIZED**. PR75: **OPEN, UNMERGED**.

Next task: owner reviews the unresolved qualification gate and the three corrections
at the preview. Full delivery and owner acceptance remain pending. Stop there. No merge of73/74, production deployment, R2/R3,
Satellite Explorer implementation, Earth imagery expansion or paid provider use.

## Measured desktop/mobile UX results

The original recorded UX matrix passes42 scenes and nine checks per viewport:84 scenes total,
zero page errors. Six satellite-selection scenarios per viewport issue **zero**
new time commands; fixed UTC/speed/location/camera/atmosphere/Night Mode and rendered
illumination remain stable. Live time advances normally at speed1; Focus changes
the camera while preserving time/settings. Clear/repeat, Night Mode ON, historical
paused-night/live-URL mismatch, copied-link follow/Focus, About/Escape/focus,
Sky/Earth roundtrip, Back/Forward and reload pass. Full measurements and command
records: [UX proof](evidence/browser.json).

| Width | Scenario | Native UTC before → after | Speed | Sky mean RGB before → after |
| --- | --- | --- | --- | --- |
|1440|fixed-night|2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z|0|25.558 → 26.069|
|1440|fixed-day|2026-06-04T17:00:00.000Z → 2026-06-04T17:00:00.000Z|0|220.438 → 220.438|
|1440|live|2026-10-16T16:18:44.469Z → 2026-10-16T16:18:46.259Z|1|62.905 → 62.905|
|1440|paused-native-night-live-url|2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z|0|25.558 → 26.069|
|390|fixed-night|2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z|0|25.106 → 26.962|
|390|fixed-day|2026-06-04T17:00:00.000Z → 2026-06-04T17:00:00.000Z|0|220.409 → 220.409|
|390|live|2026-10-16T16:21:07.195Z → 2026-10-16T16:21:08.379Z|1|90.160 → 90.160|
|390|paused-native-night-live-url|2026-06-04T02:58:00.000Z → 2026-06-04T02:58:00.000Z|0|25.106 → 26.962|

FOV comparison uses half one displayed decimal unit plus1e-7° to account for
native scalar serialization. The smallest view displays0.00028° rather than0°.
These values are read from native FOV, never derived from input counts.

| Width | Path | Actual native FOV° | Display | Tolerance° |
| --- | --- | --- | --- | --- |
|1440|fov-intermediate|18.7926437683|FOV 19°|0.5000001000|
|1440|fov-close|4.7938838504|FOV 4.8°|0.0500001000|
|1440|fov-outward|8.6091266390|FOV 8.6°|0.0500001000|
|1440|fov-trackpad|4.7938838504|FOV 4.8°|0.0500001000|
|1440|fov-keyboard|4.3481939686|FOV 4.3°|0.0500001000|
|1440|fov-one-arcsecond|0.0002777778|FOV 0.00028°|0.0000051000|
|390|fov-intermediate|18.7926437683|FOV 19°|0.5000001000|
|390|fov-close|4.7938838504|FOV 4.8°|0.0500001000|
|390|fov-outward|8.6091266390|FOV 8.6°|0.0500001000|
|390|fov-trackpad|4.7938838504|FOV 4.8°|0.0500001000|
|390|fov-keyboard|4.3481939686|FOV 4.3°|0.0500001000|
|390|fov-one-arcsecond|0.0002777778|FOV 0.00028°|0.0000051000|

Before: [native paused night](evidence/baseline-native-night-live-route-before.png)
→ [selection rebases to daylight](evidence/baseline-native-night-live-route-after.png).
After: [night before selection](evidence/1440-paused-native-night-live-url-before.png)
→ [night after selection](evidence/1440-paused-native-night-live-url-after.png).

FOV: [wide desktop](evidence/1440-fixed-night-before.png),
[intermediate](evidence/1440-fov-intermediate.png),
[close](evidence/1440-fov-close.png),
[mobile close](evidence/390-fov-close.png),
[native minimum](evidence/390-fov-one-arcsecond.png).
About & Licenses: [desktop Sky](evidence/1440-sky-about.png),
[mobile Sky](evidence/390-sky-about.png),
[Earth](evidence/1440-earth-about.png).
The About surface can scroll to its remaining notices on a narrow screen.

## Current verification results

| Check | Result |
| --- | --- |
| Runtime/Earth `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` |160 passed,0 failed,0 skipped|
| Frontend `npm --prefix frontend test` |266 passed in37 files|
| `npm --prefix frontend run typecheck` |PASS|
| Python source selection / promotion |3 +3 passed|
| Independent Sky UI / Hub builds |110 /129 files byte-identical|
| Protected paths / unchanged read-only preview mounts |73 /7|
| Docker-served Hub, Sky JavaScript, Earth entry and admission metadata |PASS for working bytes|
| Architecture / reconciliation document validators |PASS /PASS|
| Commit / push / new-head review |Authorized by explicit owner exception; final status in the separate delivery receipt|

| Browser family | Status | Runs | Recorded scenes | Checks/steps |
| --- | --- | --- | --- | --- |
|browser|PASS|2|84|18|
|satellite-recheck/browser|PASS|7|92|0|
|satellite-recheck/symbol-pixels|PASS|7|21|0|
|native-satellites|PASS|2|30|0|
|pennsylvania|PASS|2|44|0|
|observer-history|PASS|4|0|0|
|product-paths|PASS|2|0|6|
|journeys-desktop|FAIL|1|0|5|
|journeys-mobile|FAIL|1|0|7|

Counts in failed suites are partial progress only and do not qualify those suites.
All seven passing records bind the current production source hashes; no claim is
made that they ran after a new commit. Original JSON/PNG records, failed attempts
and raw log hashes are retained in [the inventory](evidence/proof-inventory.json).
[Independent artifact checks](evidence/reproduction.json),
[served working bytes](evidence/served-working.json),
[review/dependency audit](evidence/review-current-summary.json). The latter confirms
only the unchanged baseline head: completed Codex review, no unresolved findings,
CodeRabbit SUCCESS with its stacked-base skip, GitGuardian NEUTRAL. The preserved baseline audit is historical; exact delivered-head review is required in the delivery receipt. PR74/73 retain their original heads.

Zero JavaScript page errors in the passing families does not mean network-clean.
The UX matrix retains227 desktop and250 mobile resource-failure/cancellation events,
including missing local dense-star tiles. The proof JSON retains their exact URLs
and status codes. No missing-data, provider reliability, current orbital freshness,
catalog-completeness, physical-device or definitive legal-compliance qualification
is inferred.

Current task: deliver the preserved candidate and exact-head review under the owner
exception, then merge PR75 into its existing base and stop. No full qualification
or acceptance claim; no merge of74/73, deployment or R2/R3.

The current navigation evidence superseding earlier failed attempts is documented in
[QUALIFICATION_HANDOFF.md](QUALIFICATION_HANDOFF.md). Earlier measured PASS evidence
and failed logs retain their original provenance.
