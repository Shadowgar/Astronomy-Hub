# N1 satellite zoom reveal repair — PR #75

**BROWSER/BUILD QUALIFIED — PENDING OWNER RETEST. Entire N1 is NOT YET FINALIZED.**
Default Mode, single agent, existing `n1-sky-earth-navigation-1` / PR #75 → #74 → #73.
Owner preview: <http://127.0.0.1:4202/sky-engine>. No merge, production deployment,
R2/R3, provider/dependency/catalog changes, spending or new native C/WASM modification.
Scrolling `301f9eb3`, Pennsylvania panorama `53ac7478` and Adaptive Explorer direction
remain OWNER ACCEPTED. The owner rejected automatic satellite reveal at `9cb158e3`;
that rejection supersedes previous direct-FOV presentation qualification.
[Loaded manifest packs and documents](loaded-documents.txt), [plan](plan.md).

## What failed and what the evidence proves

The previous adapter enables `hints_visible` below 5° and widens past 7° to hide it,
but native `satellites.c` separately requires `vmag <= hints_limit_mag`, where
`hints_limit_mag = painter.hints_limit_mag + hints_mag_offset - 2.5`. Selection
bypasses this gate. Enabling the boolean therefore does not prove a visible symbol.
The previous browser driver assigned native FOV directly and asserted the boolean;
its bright satellite control did not exercise the point-only magnitude boundary.

Actual `page.mouse.wheel()` changes native and reactive FOV together. Bright
NORAD 28096 (native magnitude 2.6058) and moderate NORAD 43689 (5.4397) reveal normally
without selection on the old implementation. This repair does not claim scrolling
or reactivity is universally broken, or reproduce the owner's unidentified exact
satellite/device. The owner could not recall the original target/time/location.

A short initial faint-target capture was confounded by discovery/adaptation:
continuing at fixed FOV with original offset 2 could later reveal it. Those attempts
are retained and excluded from magnitude-causality proof. Native rendering discovers
32 objects/frame; the stable test waits 460 native frames for the existing 14281
record catalog at each tested view. Its native point/hidden pixel subtraction
separates real satellite points from background stars.

At a FOV of **4.7938838504° reached solely by wheel input**, real NORAD 14136 has native
magnitude 12.7705321362 and contributes 60 central RGB difference units with native
hints hidden. Offsets 2 and 3 each give **zero symbol pixels** after full discovery;
offset 4 gives **104 green native-symbol pixels**, with time/observer/magnitude and
selection unchanged. NORAD 31104 gives 600 point-difference units, zero symbol pixels
at 2, and 106 at 3. A fainter control NORAD 26045 (14.852) contributes no point and no
symbol at offset 4. These are simulated native photometric point eligibility tests,
not naked-eye visibility, current-orbit accuracy or a surveyed scientific claim.

The automated [actual-wheel RED](evidence/browser-red.json) fails specifically on
missing automatic glyph pixels: FOV 4.7939°, hints=true, offset 2, selection=null,
point difference 60, symbol pixels 0. [Failed full view](evidence/real-wheel-red.png).
[Stable gate measurements](evidence/stable-gate.json) and [exact probe](stable-gate-probe.mjs.txt)
retain the controlled comparisons. Original known TLE records are test fixtures;
no production entries, coordinates or magnitudes are generated or changed.

## Bounded correction

Only `satellite-presentation.mjs` changes production policy. At the existing 5°/7°
hysteresis, enabled close views temporarily use native offset **at least 4**, retaining
higher existing preferences. Widening restores the original offset and hides ordinary
symbols. Wide selected-only identification retains -30. An explicit applied-offset
record prevents the policy's own overrides from replacing the original value;
asynchronous native initialization, selection transitions and standalone release
restore the real native setting. User-disabled hints stay disabled.

This uses supported hint controls only; native photometry, SGP4, coordinates, object
identity, Focus/lock, native wheel normalization/gain and camera anchoring are unchanged.
The offset floor 4 is the smallest integer in the measured 2/3/4 sweep that reveals the
point-only boundary case; this is not an arbitrary threshold or wheel-notch change.

[Focused RED](evidence/policy-red.txt): 5 passed/4 failed. [GREEN](evidence/policy-green.txt): 9/9.
The prior direct-FOV driver is retained as supporting coverage with updated close
expectations; it is explicitly not the real-input acceptance test. Its wide native
point captures contain 12 white central pixels on desktop and 4 on mobile; advancing
native time changes the point position without hint symbols.

## Qualification

| Check | Result |
| --- | --- |
| Complete runtime/Earth suite |153 passed, 0 failed/skipped|
| Complete frontend suite |252 passed in 33 files|
| Python source/promotion regressions |3+3 passed|
| TypeScript |PASS|
| Independent UI builds |110 identical payload files; native JS/WASM unchanged|
| Independent Hub builds |125 identical files|
| Protected source/assets/settings/TLE hashes |72 unchanged|
| Real mouse/trackpad/mobile touch pixel journeys |7/7 PASS|
| Native selection/Focus/tracking and remount regression |30 scenes PASS|
| Complete navigation journeys |44/44 PASS, zero page errors|
| Same-renderer observer/history regression |4/4 variants PASS|
| Committed/served delivery and current-head review |Post-commit guard; final receipt below|

[Build reproduction and source identities](evidence/reproduction.json),
[offline UI replay](build-ui.sh.txt). Builds reuse existing pinned images/dependencies,
perform no native compilation or package installation, and keep large skydata mounted.
Original source pin `023e3b26babf7ffddf45f39293230b14cfe96993` is unchanged. Both native
build trees are freshly re-attested against default/genuine alternate pinned sources.

The existing preview/backend were stopped at task start (exit 255); only those two
existing containers were restarted. No cause is inferred. Original bind mounts and
volumes are preserved. Existing nginx duplicate-WASM MIME warning is retained;
its configuration test succeeds and runtime requests return 200. No config edit.
Existing matched rollback bundles are preserved; the `9cb158e3` frontend/Sky/admission
bundle is additionally saved at `output/n1/satellite-zoom-reveal/rollback/`.

## Limits and owner stop gate

Mounted TLE data is stale for the owner date; this is historical native-SGP4 rendering
and model-motion proof. No current-provider/current-orbit or proprietary 3D-model
qualification. Software Chromium and emulated mobile/touch are not physical-device
acceptance. Artistic landscape heights remain illustrative, never surveyed terrain.

Stop for owner physical mouse-wheel retest after qualified commit/push. Satellite
zoom reveal remains PENDING OWNER RETEST and entire N1 NOT YET FINALIZED. No merge,
deployment, R2/R3 or unrelated work is authorized.

## Retained unsuccessful qualification attempts

The first GREEN attempt captured 104 automatic glyph pixels and zero after widening,
but waited only 30 frames before return-click selection; the target had not yet been
rediscovered. It failed the unchanged 12000 ms click deadline. The final driver waits
for actual return-symbol pixels within the full 460-frame discovery budget before
clicking. No product change or selection assertion was needed for that driver fix.
The original attempt and exact RED driver are retained separately.

A subsequent matrix was interrupted after four passing desktop cases to investigate
mobile fixture eligibility. Another failed on mobile NORAD 31104: its symbol appeared,
but point-only subtraction was zero. Waiting 460 additional frames did not fix that
measurement. It is excluded from point qualification. The early mobile offset probe
was also unsuitable: its offset writes retriggered the policy watcher and contaminated
the purported point/hidden comparison with glyphs. It does not establish mobile point
eligibility or any new magnitude-gate result. The final mobile suite uses genuine
bright NORAD 28096; the desktop retains the separate point-only boundary NORAD 14136.
No test fabricates a point or lowers the point-pixel assertion to count these failures.

Raw attempts, original driver copies, screenshots and logs remain under
`output/n1/satellite-zoom-reveal/` and the preview's
`/evidence/satellite-zoom-reveal/`. The RED assertion precedes the later return-readiness
block; its exact source is retained in `evidence/real-input-red-driver.mjs.txt`.

## Reproduction commands and identities

Commands were run in the isolated N1 worktree; logs are retained under
`output/n1/satellite-zoom-reveal/`. The complete frontend build/test/type commands
run from its `frontend/` directory.

```bash
node --test tests/runtime/satellite-presentation.test.mjs
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs
python3 -m unittest tests/runtime/test_sky_source.py
python3 -m unittest tests/runtime/test_sky_promotion.py
# frontend directory:
npm test
npm run typecheck
npm run build
# repository root; exact two-source offline commands are in build-ui.sh.txt:
bash output/n1/satellite-zoom-reveal/build-ui.sh
N1_EVIDENCE_DIR=output/n1/satellite-zoom-reveal/native-regressions node scripts/validation/verify_n1_satellites.mjs
node scripts/validation/verify_n1_satellite_zoom.mjs
node scripts/validation/verify_n1_satellite_symbol_pixels.mjs
N1_WIDTHS=1440 N1_EVIDENCE_DIR=output/n1/satellite-zoom-reveal/journeys-desktop node scripts/validation/verify_n1_navigation.mjs
N1_WIDTHS=390 N1_EVIDENCE_DIR=output/n1/satellite-zoom-reveal/journeys-mobile node scripts/validation/verify_n1_navigation.mjs
N1_EVIDENCE_DIR=output/n1/satellite-zoom-reveal/observer-history node scripts/validation/verify_n1_observer_history.mjs
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
N1_SERVED_EVIDENCE=output/n1/satellite-zoom-reveal/served-working.json python3 scripts/validation/verify_n1_motion_served.py
python3 output/n1/satellite-zoom-reveal/qualify.py
# After commit, compare each proof input to git show HEAD:path:
N1_COMMITTED=1 python3 output/n1/satellite-zoom-reveal/qualify.py
N1_SERVED_EVIDENCE=output/n1/satellite-zoom-reveal/served-committed.json python3 scripts/validation/verify_n1_motion_served.py
git diff --check
git status --short
git log --oneline -5
```

Corrected Sky payload SHA-256:
`4f0cd37f0b555917ed46b906db84083c34c6f664ee47c38a694c81cc0f8f2448`.
Unchanged Earth:
`834fa48f8bc7cb0489c6c14be42a49c5fb6f9c224a6be9968e3c724ae152494c`.
Unchanged native JS:
`0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7`;
unchanged native WASM:
`d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942`.
Fresh attestation includes 564 input files; no native compiler is invoked here.
The existing `native_wasm_identical` and `native_vendor_chunks_identical` flags remain
false, preserving the earlier qualified native-horizon change identity across this
UI-only promotion. The earlier five P2 fixes are not reopened or relabelled.

[Exact changed-file list](files-changed.txt). Tracked changes are the contained hint policy, focused tests and exact TLE fixtures,
real-input driver and supporting-driver expectations, generated Sky UI/admission
metadata, and scoped evidence/governance. The generated app chunk is replaced as a
unit. [Qualification checker](qualify.py.txt) verifies original proof hashes and
current/committed inputs without rewriting historical evidence. Exact committed file
list, final SHA, served identities and current-head review receipts will be recorded
in the preview's [guarded delivery receipt](http://127.0.0.1:4202/evidence/satellite-zoom-reveal/final-delivery.json) and
[final report](http://127.0.0.1:4202/evidence/satellite-zoom-reveal/final-report.md) after commit; those receipts bind the final SHA without requiring another commit.

## Actual-input pixel results

[Full real-input proof](evidence/browser.json) retains each trusted event, FOV group,
native/reactive state, native source record and all original screenshot names. All
seven cases have zero page errors, positive native point subtraction, automatic
reveal before selection, outward hiding, and native identification/Focus/tracking.

| Viewport / input | NORAD | Point RGB difference | Close identification pixels | Central icon pixels | Outward identification pixels |
| --- | --- | --- | --- | --- | --- |
|1440 / wheel|14136|60|104|104|0|
|1440 / wheel|28096|55312|164|0|0|
|1440 / trackpad|14136|60|104|104|0|
|1440 / trackpad|28096|55312|164|0|0|
|390 / wheel|28096|54104|219|55|0|
|390 / trackpad|28096|54104|219|55|0|
|390 / pinch|28096|55176|208|44|0|

[Desktop wide point](evidence/1440-wheel-28096-normal-full.png),
[automatic close symbol](evidence/1440-wheel-28096-automatic-close-full.png),
[outward symbol hiding](evidence/1440-wheel-28096-outward-hidden-full.png),
[mobile wheel](evidence/390-wheel-28096-automatic-close-full.png),
[mobile native pinch](evidence/390-pinch-28096-automatic-close-full.png).
The desktop boundary capture has [104 native symbol pixels](evidence/1440-wheel-14136-automatic-close.png).
Wheel and trackpad cases reach 4.7938838504°; native touch pinch reaches 2.7000000000°.
These input/pixel journeys never assign native FOV. Faint unselected discovery can
consume multiple frames; the driver waits for actual pixels within the unchanged
460-frame traversal budget and does not claim a physical-device latency limit.

[Independent central-icon check](evidence/symbol-pixels.json) masks the central 24px
region so labels above the satellite cannot satisfy the icon assertion. Actual
central icons pass desktop boundary wheel/trackpad and every mobile input method,
both on initial reveal and return. The very bright desktop control masks its icon
with its native point; that case qualifies labels/identity only. The complete
64px green counts include labels and are named identification pixels in the table.
The image check hashes every original PNG and the real-input proof it inspected.

The [final-delivery guard](finalize.py.txt) refuses to publish a passing receipt
unless the local and remote commit match, the worktree is clean, all original proof
inputs match that commit, served identities match, current-head Codex review is
completed with no findings, all review threads are resolved, and the stacked PRs
remain open with their original bases. CodeRabbit skips this non-default stacked
base; GitGuardian is neutral. These checks do not replace owner acceptance.

## Navigation environment limitations

The unchanged desktop navigation suite passes all 22 groups with zero page errors,
but records 619 resource failures/cancellations: 489 local 404 responses for mounted
`dense-star-tiles/profiles/visual-default` tiles, 128 aborted requests and two connection
resets. Its console records four native HiPS iterator warnings. The prior recorded
remediation navigation runs also retain resource failures (631 desktop, 818 mobile);
that historical comparison does not prove the cause of each current failure.
Astronomy/map requests and deliberate transition transports remain fully recorded
in the raw proof. This bounded satellite repair does not qualify data completeness,
current providers or general network reliability, and does not alter mounted data.

Mobile also passes all 22 navigation groups with zero page errors, while retaining
672 resource failures/cancellations: 95 net::ERR_ABORTED, 575 404, 2 net::ERR_CONNECTION_RESET.
Its console records 3051 native HiPS iterator warnings. The console summary is
retained verbatim in the proof; network-failure counts are
null for drivers that do not collect them, rather than inferred as zero.

[Combined qualification](evidence/qualification.json), [served working artifacts](evidence/served-working.json)
and [original proof inventory](evidence/proof-inventory.json) retain all six passing
records. Native pixel measurements and source hashes are checked independently;
72 protected files and seven preview mounts match the pre-task baseline. The working
receipt correctly records the pre-commit HEAD with runtime edits; it is not presented
as committed-head evidence. The post-commit guard creates a separate committed receipt.

Copied textual test logs normalize trailing whitespace for repository checks.
[Original raw log paths and hashes](evidence/text-log-originals.json) retain byte-level
provenance; raw logs in `output/` and all original browser JSON/pixel proofs remain
unchanged. No failing result is removed or relabelled.
