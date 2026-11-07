# Independent mission science adapter review

Status: final source/numerical review passes for immutable `release-v3` as
qualified below. Reviewer did not author the science adapter or acquisition builder.
Review base is `ea4d384af3aead949de7bec1947e8aff41465bca` on
`recovery/reconcile-20261026`, existing draft PR107. This record does not approve the integrated application, owner visuals or whole PR.

Context: mandatory operating instructions, current CORE/LIVE and solar
reconstruction task pack, owner Solar 2.5 directive, focused existing recovery
review evidence, new mission schema/route/service/builder/tests, and retained
mission metadata/source receipts. No new source acquisition or broad docs scan
was performed by this reviewer.

## P2 SCI-01 — public catalog advertises unsupported boundary epochs (corrected)

Original location: `backend/app/services/mission_exploration.py`,
`mission_catalog()` construction of `segments` from raw manifest values.

The catalog returned microsecond source endpoints, but state selection admitted
only `_bounds()` endpoints rounded inward to milliseconds. All ten advertised
Voyager 1 segment endpoints in actual `preview-v1` consequently failed
`mission_state()` with `Epoch is outside supported mission source intervals`.
Catalog-derived boundary/default navigation could therefore reject an epoch the
same catalog advertised as supported. The old boundary regression exercised
private `_coverage(runtime)` rather than the public catalog.

The author added `_catalog_segment()` to publish identical inward-safe bounds
without loading trajectory arrays. The reviewer then repeated every actual
public-catalog endpoint and the available mission default through `mission_state`:
**PASS: 10 endpoints and the default**, with expected segment identity retained.
The author also added catalog-to-state regression coverage. This finding is
closed at the inspected source/preview scope; final-release boundaries still
require the same check after acquisition.

## P2 SCI-02 — excerpt transfers are absent from the acquisition budget counter

Original locations: `scripts/skydata/acquire_solar25_missions.py:125`,
`:249`–265, and final check `:413`–414.

`Acquisition.bytes` counts the source ledger but excludes transferred JUP230
range receipts. The excerpt uses a separate `ByteBudget`, without debiting the
parent acquisition counter. Subsequent downloads can therefore cross the shared
aggregate ceiling before the final manifest calculation rejects the release.
The existing retained excerpt accounts for **556,032 transferred bytes** absent
from the live counter.

An offline temporary-directory reproduction copies the actual ledger/receipt and
constructs `Acquisition(temp, ledger_bytes)`. It succeeds although the retained
source transfer total is `ledger_bytes + 556032`. At the recorded observation this
was 20,249,970 admitted bytes versus 20,806,002 actual counted transfer bytes. No
network transfer was made by this probe, and the current actual acquisition
remains well below the authorized 128 MiB maximum; no owner-budget overrun is
claimed.

Correction: include retained excerpt transfer receipts in initial admission and
debit newly transferred ranges before any following provider request. Add a test
that rejects aggregate exhaustion before network access, including resume from
an existing excerpt receipt. Author notified; correction/re-review pending.

## Source inspection and focused checks

The reviewed adapter keeps mission-specific historical positions separate from
current Solar packs. Spacecraft-relative Horizons targets are reconstructed from
compatible paired spacecraft/Sun and spacecraft/target requests, with strict
matching native source-chain headers. The author reported that this check rejected
an incompatible New Horizons/Jupiter chain and is acquiring a matching archived
source instead of weakening admission; that replacement is not yet reviewed.

The retained Voyager metadata supports separating early mission-design cruise,
tracking-fit intervals and outward predictions. Reconstructed encounter sources
are separately represented. The service evaluates position and the Hermite time
derivative using TDB tangent seconds, and does not bridge declared coverage gaps.
The sampled fitting errors are explicitly distinguished from physical uncertainty.
Known UTC leap transitions split ordinary-Unix client windows. Runtime files and
the manifest are hash pinned with stat-sensitive cache invalidation; public source
failures are bounded. Historical attitude is explicitly unavailable.

```sh
docker exec -e PYTHONDONTWRITEBYTECODE=1 -w /work pr107-solar25-preview-backend python3 -m pytest -p no:cacheprovider backend/tests/test_mission_exploration.py --basetemp=/tmp/solar25-independent-review-pytest -q
```

Initial run: **13 tests passed, 0.77 s**, with two dependency deprecation warnings
(Starlette/AnyIO alias and HTTPX app shortcut). The reviewer made no environment
installs or container changes. Current tested data is actual immutable preview
Voyager 1 reconstruction, not the unfinished full release.

Remaining: full release source/target quality and provenance, independent numerical
comparison against original kernels/provider records, all final public boundaries,
client/server interpolation precision (APP-03 in `REVIEW_APPLICATION.md`), final
hash pin, integrated browser journeys and owner acceptance.

## SCI-02 correction and candidate v2 checks

The author introduced a shared persisted range-transfer counter. Initialization
includes retained range receipts, and each new range reservation debits the
aggregate counter before network access. The focused regression rejects retained
7 bytes against a 6-byte cap and a further byte after a 3-byte reservation reaches
the 10-byte cap. Independent source re-review confirms the reported omitted-byte
path is closed. **SCI-02 corrected.**

```sh
docker exec -e PYTHONDONTWRITEBYTECODE=1 -w /work pr107-solar25-backend python3 -m pytest -p no:cacheprovider backend/tests/test_mission_exploration.py --basetemp=/tmp/solar25-independent-review-pytest -q
```

Result: **14 passed in 0.70 s**, two existing dependency deprecation warnings.
Candidate `release-v2` SHA256
`67ce862e8f9b9a09e697847c57234fe3e70f8d5ce667408da40a18acf0b74712`
passes all **180 public-catalog endpoints and all 10 mission defaults** through
the actual Docker service with the expected segment IDs.

## P2 SCI-03 — off-quarter interpolation check exceeds the stated fitting limit

Location: `scripts/skydata/acquire_solar25_missions.py`, `adaptive()` acceptance
of quarter/midpoint residual samples; candidate `release-v2/voyager2.json`,
`uranus-encounter-2` craft interval containing JD TDB `2446467.3089999096`.

The independent reviewer evaluated original kernels with CSPICE `spkezr`,
J2000/NONE relative to Sun 10, and independently evaluated the fitted Hermite
position/derivative. At that epoch the position residual is **0.05286523120404043
km**, exceeding this reconstructed encounter's **0.05 km fitting threshold**.
Velocity error `0.000004249992318322343 km/s` passes. The source metadata already
distinguishes sampled errors from a continuous bound; nevertheless the fresh
independent sample fails the intended fitting qualification and must be refined.

The probe covers **1,368 non-quarter source comparisons across 38 body-segments**,
four fractions in up to nine distributed cells per segment, and found this one
miss. It is not exhaustive. Full failed receipt:
`evidence/independent-spice-release-v2.json`. Reproduction:

```sh
PYTHONPATH=output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026 /home/rocco/Astronomy-Hub/.venv/bin/python output/playwright/solar-system-2.5/review-missions/check-spice.py release-v2
```

Correction: refine the offending cell against its original kernel; preserve the
existing threshold and explicit quality class. The author is preparing an
immutable corrected release, also addressing his separate cruise-velocity
reference miss. Final source qualification awaits that pin and re-review.

## Final v3 correction re-review

Final source manifest SHA256:
`9b1bf0cde347536ae5d2c923684498c199444084458d72bdbccbe833c4055e94`.
The author preserved v2 and refined only the two independently failing Voyager
source cells in v3. The existing numerical thresholds were not relaxed.

The separate reviewer repeated **1,368 original-kernel CSPICE comparisons across
38 body-segments with zero failures**. The exact prior Uranus failure at JD TDB
`2446467.3089999096` now has **0.01412963474996044 km** position residual versus
the unchanged 0.05 km limit. **SCI-03 corrected and independently re-reviewed.**
The source author's separate 2,376 fresh native-source comparisons cover all 90
segments and pass; these are author validation, not mislabelled independent
review. Their seven UTC/TDB comparisons with CSPICE range from about 0.06 to
44.2 microseconds. Neither set of samples is a continuous error bound or physical
orbit covariance.

The independent reviewer rehashed **667 retained source files and their request
records**, plus all ten runtime files. All match the pinned manifest. Runtime
JSON totals **4,990,074 bytes**; manifest-recorded source transfer is 31,038,386
bytes, with the author's later validation counter 31,046,794 bytes, below the
128 MiB authorized maximum. The historical NH Jupiter chain uses the archived
reconstructed spacecraft plus compatible JUP260/DE413 coefficients and passes
the independent CSPICE checks; no contemporary JUP365 substitution was admitted.

Final Docker/API checks pass **180 public catalog endpoints and all ten mission
defaults**. The actual TypeScript contracts admit those ten states and all **90
full-trajectory segments**. Maximum exact-epoch server/client difference among
defaults is **0.266 mm**. The additional trajectory correction preserves admitted
UTC endpoint labels instead of a JD-to-UTC roundtrip that can land tens of
microseconds beyond them; its source/test correction was independently inspected.
The science adapter's focused Docker suite after that correction: **15 passed,
0.67 s**, three deprecation notices from two inherited dependency APIs.

Committed compact review receipts:

- `evidence/independent-spice-release-v2.json` — preserved failing review.
- `evidence/independent-spice-release-v3.json` — green and exact-epoch recheck.
- `evidence/final-api-client-review.json` — ten actual-source roundtrips.
- `evidence/final-source-integrity.json` — independent source/runtime hashes.

Remaining boundaries: frontend/GPU lifecycle and visual presentation require the
separate application/browser review; owner visual acceptance and physical iPhone
verification are not established by these scientific checks. No production data,
containers, source archive publication, commits, branches or PR state were changed
by this reviewer.

## Final metadata and retained-defect regressions

The reviewer read the original `nh_recon_e2j_v1.bsp` comments directly. The final
NH Jupiter metadata retains both published phase uncertainty estimates, explicitly
notes that the encounter window crosses their phase boundary, and does not assign
a per-epoch covariance. Other NH intervals remain unqualified for that estimate.
This corrects the initial narrower wording that mentioned only Cruise 1. The
application now renders the actual interval uncertainty field rather than a fixed
claim that no uncertainty is supplied. Source vectors and the v3 pin are unchanged.

The author added two compact original-source failing/corrected-cell fixtures for
the cruise velocity and Uranus position findings. Independent focused Docker
rerun: **17 passed in 0.73 s**, three notices from the same two dependency
deprecations. No new unresolved P1/P2 science finding remains in this reviewed
source/adapter scope. Final code/input binding is in
`evidence/final-science-reviewed-files.json`.
