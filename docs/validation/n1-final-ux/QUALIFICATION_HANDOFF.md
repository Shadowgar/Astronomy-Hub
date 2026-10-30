# N1 bounded qualification handoff — 2026-10-16

**Historical bounded qualification: PARTIAL. Navigation results remain unchanged.**

The subsequent [delivery authorization](DELIVERY_AUTHORIZATION.md) records explicit
owner permission to commit/push this candidate and the latest chat authorization to
merge PR75 only. Delivery prohibitions below describe the earlier stop state; they
are superseded only to that stated extent. These failed test outcomes are preserved.

Default Mode: mandatory context and frontend/docs/validation/review/debug pack union;
[65-entry context ledger](qualification-context-refresh.json). Previously loaded
unchanged documents were hash-checked; the active execution documents were refreshed.
No broad docs scan. Existing branch `n1-sky-earth-navigation-1`, local/remote PR75
baseline `f3629f9a8e4b4ac7a158a1448912d75ca36574db`. No new commit or push.
PR75 → PR74 → PR73 remains OPEN and UNMERGED. No deployment or R2/R3.

## Exactly one new attempt per suite

| Suite | Result | Completed groups | Exact noncompleting operation |
| --- | --- | --- | --- |
| Desktop1440 |FAIL, exit1;240s outer-budget stop|5 of22|`page.screenshot` at `shot('oras-earth')`, driver:33, called from:74. Earth readiness, observer/time and height assertions ran before capture.|
| Mobile390 |FAIL, exit1;240s outer-budget stop|7 of22|`locator('iframe').count()` inside `ready('earth')`, driver:32; `outward`:59, second outward stage:77. First real wheel Sky→Earth→Sky roundtrip completed.|

[Exact commands, timestamps and exits](evidence/bounded-attempts.json),
[desktop log](evidence/bounded-desktop-run.txt), [mobile log](evidence/bounded-mobile-run.txt),
[owned-stop receipt](evidence/bounded-outer-budget-stops.json),
[classification receipt](evidence/bounded-qualification-handoff.json),
[copied-evidence identities](evidence/bounded-evidence-index.json).

Existing20s locator/page default,90s readiness,30s native/CDP limits and failure
capture/close limits were not increased. The pre-existing12-minute process ceiling
was reduced externally to240s per attempt. Only each owned test's timeout supervisor
was signalled. The sequential runner exited0 because it finished recording both
outcomes; **both actual suite processes exited1**, and neither is a PASS.

Desktop reported `Target crashed` and mobile `Target page, context or browser has
been closed` around the controlled outer-budget intervention. Those teardown-time
errors do not prove an independent crash occurred before intervention. No functional
assertion mismatch was returned. Browser/automation operations did not complete;
the underlying Chromium/renderer/driver/environment cause is **UNKNOWN**.

[Installed harness source inspection](evidence/bounded-harness-source-inspection.json)
confirms Playwright1.58.2 screenshot inherits the20s page default; it is not accurate
to call that screenshot timeout-free. The count query forwards no timeout, and the
driver has no independent per-call client deadline around either invocation. These
are deadline properties, not proof of which internal operation caused the stall.
The earlier strict-dialog selector failure was already fixed before this attempt.
Historical baseline failures and low-memory observations do not establish causation.
No application regression was reproduced well enough to justify a speculative fix.
No additional production code, timeout increase, skipped assertion or qualification
exception was introduced. The retry cycle is stopped as directed.

## Functionality successfully qualified and reused

All seven original passing browser proof families retain exact source hashes.
[Fresh reuse verification](evidence/bounded-reuse-verification.json) rechecks their
original records; **these are historical browser PASS results, not fresh runs**.

- Selection/time:84 native-rendered scenes, six selection cases per viewport,
  zero extra time commands per selection; stable fixed UTC/speed/observer/camera,
  atmosphere/Night Mode and sky illumination. Live time advances normally. The
  reproduced paused historical night/live-URL case stays at `2026-06-04T02:58:00Z`,
  speed0. Focus/clear/repeat and basic history/reload/handoff pass in that matrix.
- FOV: actual native FOV agrees with the visible readout within recorded rounding
  tolerance after wheel, trackpad, keyboard, Focus, programmatic zoom and restoration;
  native one arcsecond displays `FOV 0.00028°`. Desktop/mobile and reduced-motion
  observations are recorded; no threshold or magnitude policy changed.
- Product identity: both mode menus omit standalone escapes; About & Licenses,
  keyboard/Escape/focus restoration, original legal bytes, scientific/provider
  acknowledgments and source links pass. Native search, Tonight/Observe selection
  and Focus, and copied exact links stay in Astronomy Hub. Internal endpoints remain.
- Other retained families: seven satellite real-input journeys, independent icon
  pixel checks,30 native satellite scenes,44 woodland scenes, four observer/history
  variants and both product-path viewports. No page errors in those passing families;
  recorded missing-data/network events remain limitations.

Prior supporting runs:160 runtime/Earth assertions;266 frontend tests in37 files;
TypeScript PASS;3+3 source/promotion Python tests. Those source suites and builds
were not rerun during this continuation because production source stayed unchanged;
original outputs are retained, and fresh identity/reuse checks do not relabel them.

## Artifacts, data, settings and rollback

Fresh comparison confirms110 independently built Sky UI files and129 Hub files
remain byte-identical. [Build identity log](evidence/bounded-build-identity-run.txt),
[full identities](evidence/reproduction.json),
[Docker-served bytes](evidence/bounded-served-working.json),
[additional native/legal/rollback checks](evidence/bounded-additional-identities.json).
All73 protected paths and seven read-only preview mounts are unchanged.113 tracked
rollback files match `git show f3629f9a`. Accepted controller, Pennsylvania artwork,
satellite presentation, mounted TLE, owner settings, native JS/WASM and source pins
are preserved. No Docker pruning or unrelated workload/service changes.

Sky artifact: `b57c40ddceca090224ac58f4758fde9d2193a649c571e58cb0a618b289649c19`.
Earth artifact: `834fa48f8bc7cb0489c6c14be42a49c5fb6f9c224a6be9968e3c724ae152494c`.
Native WASM: `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942`.
Mounted TLE: `431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`.
Owner settings: `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`.

## Delivery boundary and remaining risk

[Exact candidate file list](files-changed.txt); [consolidated report](README.md).
No new SHA or committed-served certificate exists. Preview
<http://127.0.0.1:4202/sky-engine> serves the working correction. The [current baseline audit](evidence/bounded-review-end.json) confirms
PR75 review is completed with no unresolved findings; this is not a review of the
uncommitted candidate. CodeRabbit skips the stacked base; GitGuardian is NEUTRAL.
No separate security qualification is claimed. The dependency chain is unchanged.

Later geographic exploration, repeated near-surface/reversal transitions,
cancellation and complete history/lifecycle paths remain unqualified in these
full suites. Source preservation and simpler successful roundtrips do not waive
that residual regression risk. Physical-device/owner visual acceptance, current
orbit freshness/completeness and definitive legal certification are not claimed.

**Stop for owner review of the unresolved mandatory gate.** No qualification
exception is proposed or assumed. No merge of73/74/75, production deployment or
R2/R3. N1 remains NOT FINALIZED.
