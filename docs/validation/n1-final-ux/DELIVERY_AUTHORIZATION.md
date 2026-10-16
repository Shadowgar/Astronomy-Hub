# N1 delivery authorization and verification

**PARTIALLY QUALIFIED — OWNER-AUTHORIZED MERGE OF PR #75. N1 NOT FINALIZED.**

The owner [authorized review-only commit/push](https://github.com/Shadowgar/Astronomy-Hub/pull/75#issuecomment-6221730719)
with the exact status **PARTIALLY QUALIFIED — DO NOT MERGE**. The subsequent owner
chat instruction “merge and move on” authorizes PR75 merge despite the known gaps.
This later instruction supersedes the merge restriction for PR75 only. No other
PR merge, deployment or R2/R3 is authorized. The three original UX corrections are preserved. One genuine review finding is
corrected and separately qualified as detailed below.

## Unchanged qualification limits

- Desktop:5/22 groups completed; screenshot capture stalled after Earth readiness.
- Mobile:7/22 groups completed; iframe-count query stalled on second outward handoff.
- Both reached240-second outer caps. No functional assertion mismatch reproduced.
  Underlying cause UNKNOWN. No claim of all44 navigation groups passing.
- Seven earlier source-matched browser families,84 UX scenes,160 runtime/Earth and266
  frontend tests, typecheck and independent builds are retained historical evidence.
  They are not relabeled as fresh qualification. The stalled suites are not rerun.
- Later navigation/reversal/repeat/cancellation/history/lifecycle paths, physical
  devices and owner visual acceptance remain unqualified. Source preservation and
  simpler roundtrips do not remove that residual risk.

Scrolling and Pennsylvania scenery: OWNER ACCEPTED. Satellite zoom: PENDING FINAL
OWNER ACCEPTANCE. Selection/time: PENDING OWNER RETEST. FOV and branding/navigation:
PENDING OWNER ACCEPTANCE. Scientific data/math, source pins, settings and rollback
identities remain protected. Satellite Explorer remains documentation only.

## Delivery checks

Default Mode context is recorded in [context-review-delivery.json](context-review-delivery.json).
The current implementation hashes must match the pre-delivery candidate snapshot.
All nine source-bound proof records are retained: seven PASS, two FAIL with5/7
completed groups. The complete-qualification scripts remain unchanged; the separate
[partial-delivery verifier](review-delivery-verifier.py.txt) records the owner exception
and verifies current/committed source hashes, original proof/PNG identities,73
protected paths, seven preview mounts, original licenses, native outputs, exact
Docker-served entries and notices. Independent110-file Sky /129-file Hub build
inventories are rechecked without rebuilding unchanged implementation.

Commands (no full navigation rerun):

```sh
python3 output/n1/final-ux/reproduce-build.py
python3 output/n1/final-ux/review-only/verify-delivery.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
# after committing and pushing:
N1_COMMITTED=1 python3 output/n1/final-ux/review-only/verify-delivery.py
N1_SERVED_EVIDENCE=output/n1/final-ux/review-only/served-committed.json python3 scripts/validation/verify_n1_motion_served.py
python3 output/n1/final-ux/review-audit.py
```

Before merge, local/remote/PR head must agree on the reviewed SHA; full PR comments,
reviews, threads and checks must be inspected. Only genuine in-scope findings justify
implementation changes, with focused qualification and a new exact-head review.
PR75 is merged into its existing base; PR74/73 stay OPEN. Existing worktrees and
branches are retained; no owner checkout reset or deletion.

The post-commit [delivery receipt](http://127.0.0.1:4202/evidence/final-ux/review-only/delivery.json)
and [report](http://127.0.0.1:4202/evidence/final-ux/review-only/delivery.md) bind the
actual delivered/reviewed SHA and merge result without a self-referential doc commit.
Their absence means delivery verification is pending. They must say PARTIALLY
QUALIFIED even after merge. Exact files: [files-changed.txt](files-changed.txt).
Owner preview: <http://127.0.0.1:4202/sky-engine>. Stop after delivery/review/PR75 merge.

## Exact-head review correction

Codex review of97eacd2d found one genuine P2: Enter Sky here remained enabled while
a coordinate flight was pending, allowing an intermediate-center handoff. The
[review finding](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4297945509)
is corrected solely by `disabled={busy||pending}` on that button. Flight/camera math,
input gain, source pins, data and the three UX implementations remain unchanged.
Focused tests reproduce two failures then pass both success/failure completion paths;
fresh frontend suite268/268 in38 files and typecheck PASS. Two fresh129-file Hub
builds match. Focused desktop/mobile native-flight browser qualification holds only
the genuine completion acknowledgement, verifies disabled handoff/no snapshot while
pending, then releases it and verifies the correct observer/time on normal Sky entry.
No full stalled navigation suite is rerun. Original failed5/22 and7/22 records remain
FAIL with their original hashes. Seven earlier PASS families retain unchanged scoped
source hashes; the new pending-flight behavior is separately qualified. The Hub bundle
is rebuilt; native Sky/Earth artifacts remain unchanged.

An initial focused browser helper inspected `result.ok` instead of `result.payload.ok`;
that unsuccessful harness attempt is preserved, not called an application regression.
The genuine browser RED uses the97eacd2d served Hub bundle even though the working
component had already been patched; its recorded bundle hash binds the pre-fix bytes.
[Focused qualification](evidence/review-fix-qualification.json),
[actual browser GREEN](evidence/coordinate-flight-green.json),
[actual browser RED](evidence/coordinate-flight-red.json),
[retained envelope-assertion attempt](evidence/coordinate-flight-envelope-attempt.json),
[independent Hub builds](evidence/review-fix-builds.json).
