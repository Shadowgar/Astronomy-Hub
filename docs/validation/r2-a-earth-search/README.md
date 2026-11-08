# R2-A Earth search — implementation and qualification

Owner-authorized Earth Search, Navigation and Location Context, on separate branch
`r2-a-earth-search-1`, stacked on PR74 `r1-b-adaptive-sky-implementation-1` at
`d1e3a75c4fa3b48a41fc5167786b3147bf763e71`. **N1 OWNER ACCEPTED.**
No merging PR73/74, deployment, paid services, dependency changes or R3.
Current candidate: desktop14/14 and mobile14/14 R2 journey groups PASS. Final
layout, license and working-source identity checks PASS. Draft delivery follows
this source-bound record; owner R2 review remains open.

Default Mode: CORE_CONTEXT → LIVE_SESSION_BRIEF → manifest union of
frontend_change/backend_change/docs_change/planning/validation/review. The complete
61-document load ledger is [loaded-documents.txt](loaded-documents.txt) and
[context.json](context.json); no broad docs scan. PR71 source/evidence inspection
is additionally owner-authorized. [Plan](plan.md), [PR71 reuse](PR71_REUSE.md),
[inspected PR71 identities](pr71-inspection.json).

## Delivered behavior

- Earth → Explore opens the existing Adaptive Explorer contextual dialog. Submitted
  search supports street addresses, cities, named places and coordinates. No
  autocomplete, permanent toolbar or upstream application is exposed.
- Photon/OpenStreetMap results retain multiple candidates and useful address/city/
  region/country descriptions. The user explicitly selects a result. The existing
  native Cesium `navigateLocation` command moves the actual Earth camera.
- The exact MIT-licensed pinned God's Eye coordinate parser is reused unchanged;
  decimal and supported hemisphere forms work without a place provider. Invalid
  ranges/malformed coordinate pairs are declined, never silently clamped or geocoded.
- Last searched location context is labeled as such; it does not claim to describe
  the center after free panning. Search supplies no elevation or scientific observer
  measurement. Existing imagery/terrain/source availability remains in Diagnostics.
- Native before/after camera bookmarks support Back/Forward/reload without changing
  astronomical time or overwriting observer URL intent. Sky return uses the actual
  native surface observer/time. Stale search URLs cannot override an N1 handoff.
- Empty results, busy/admission refusal and provider outage are different states;
  coordinates remain independent. Closing/editing the query cancels stale results.

## Provider and data limits

Photon is already used by pinned God's Eye. Its public demo server expressly permits
reasonable use, with throttling/no availability guarantee:
[primary permission](https://github.com/komoot/photon#demo-server).
[OpenStreetMap attribution/license](https://www.openstreetmap.org/copyright) is linked
in results and About & Licenses. The extracted parser's full upstream MIT notice is
retained in packages/earth-search and the served license page. No new package,
provider account, credential, Google fallback or Nominatim use is introduced.

The FastAPI adapter uses submit-only requests, one in-flight distinct query,
identical-query coalescing, at most one upstream start per1.1s, bounded64-entry LRU,
success1h / empty-or-error60s caching,6s transport/7s outer limits,250KB payload cap,
and429/503 backoff. Malformed source coordinates are rejected. Provider-derived
IDs remain strings. The fixture is a recorded public source response, not a
production place catalog. Public coverage/address precision and ranking vary.

**Preview is one backend worker.** Shared admission is required before multi-worker
or public deployment. `EARTH_PLACE_SEARCH_ENABLED=0` disables place search without
removing coordinate entry. No deployment qualification is claimed.

## Qualification and interpretation

The final reviewed source passes289 frontend tests across41 files and43 focused
Docker backend tests (search6 plus existing aircraft/events). TypeScript passes.
The161 runtime/Earth tests passed earlier in this R2 task; their native source
inputs remain unchanged after the search-only review corrections. They are not
N1 full-navigation proof. Docker pytest reports8 warnings: existing anyio/httpx
deprecations and cache-write refusal on the intentionally read-only /work mount;
no test is skipped or failed. The final two independent Hub builds match130 files.
Vite's outside-root output warning is expected for distinct evidence directories;
no existing output directory is emptied or original artifact overwritten.

| Command, run in the R2 worktree | Result |
| --- | --- |
| `npm --prefix frontend test` |289/289 PASS |
| `npm --prefix frontend run typecheck` | PASS |
| `docker exec -w /work oras-r2-a-backend python3 -m pytest backend/tests/test_earth_search.py backend/tests/test_earth_aircraft.py backend/tests/test_earth_events.py -q` |43 PASS,8 warnings |
| `node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs` |161/161 PASS; inputs unchanged |
| `npm --prefix frontend run build -- --outDir ../output/r2-a/hub-license-first` and same command with `hub-license-second` |130 matching file hashes |
| `R2_WIDTHS=1440 R2_EVIDENCE=output/playwright/r2-a-desktop-qualified timeout 180s node scripts/validation/verify_r2_earth_search.mjs` |14/14 PASS |
| Same command with `R2_WIDTHS=390` and `r2-a-mobile-qualified` |14/14 PASS |

The180s outer cap and existing stage timeouts were not increased. This is a focused
R2 journey, not a retry of the stalled N1 suites. Both source-bound proof files
record real source responses and screenshot hashes. The legal-asset-only rebuild
adds one omitted notice; every application JS/CSS byte is identical to those two
completed journey runs. This identity comparison is recorded in the build receipt;
the journey runs are reused with that precise limit, not relabeled as rerun.

| Final additional command | Result |
| --- | --- |
| `timeout 180s node scripts/validation/verify_r2_earth_search_layout.mjs` | Desktop and mobile text containment,16px input, real choices/native destinations PASS |
| `npm --prefix frontend test -- --run tests/licenseAssets.test.js tests/aboutLicenses.test.tsx` |3/3 PASS; followed by final full289/289 PASS |
| `timeout 90s node scripts/validation/verify_r2_earth_search_license.mjs` | Product About link, real popup, complete pinned MIT bytes/text/plain PASS |
| `python3 scripts/validation/verify_r2_earth_search_delivery.py --earth-artifact ../n1-sky-earth-navigation-1/output/n1/earth` | Working-source build/artifact/served-byte/preservation checks PASS |
| `python3 scripts/validation/validate_architecture_docs.py` |57 checkpoint docs,1543 references PASS |
| `python3 scripts/validation/validate_reconciliation_docs.py` |67 capability records/51 source entrypoints PASS |
| `git diff --check` and staged equivalent | PASS before commit |

[Desktop proof](evidence/desktop/proof.json), [mobile proof](evidence/mobile/proof.json),
[layout proof](evidence/layout/proof.json), [license proof](evidence/license-browser.json),
[reproducible build inventory](evidence/hub-builds.json),
[working-candidate receipt](evidence/working-candidate-receipt.json), and
[exact changed files](files-changed.txt). The working receipt correctly records
baseline Git HEAD with `committed:false`; source hashes bind the uncommitted candidate.
After commit, the same verifier with `--committed` compares each source to `git show`
and writes the exact-head receipt at the preview's `/evidence/delivery-committed.json`.

Actual screenshots: [desktop results](evidence/layout/1440-search-results.png),
[desktop address/context](evidence/layout/1440-address-context.png),
[mobile results](evidence/layout/390-search-results.png),
[mobile address/context](evidence/layout/390-address-context.png),
[native Earth zoom/pan](evidence/desktop/1440-native-earth.png),
[Sky return](evidence/mobile/390-sky-return.png).

The byte guard caught an omitted MIT asset in the explicit Vite allowlist: the
URL returned the SPA shell. The corrected allowlist and extended existing license
asset test now ship/verify the complete notice. Both the failed guard and successful
browser/license proof are retained. A separate preservation guard initially compared
Docker's unordered mount list in order; comparison by destination proves every
mount value, status and start time unchanged. That failed guard is retained too.
These are bounded packaging/harness corrections, not new renderer behavior.
Software Chromium desktop1440×844 and emulated touch mobile390×844 are representative
browser proof, not physical-device acceptance. Assertions compare native Cesium
observer/camera snapshots with actual provider coordinates, preserve fixed native
UTC, inspect history bookmarks, require one active renderer, and check the existing
Pennsylvania panorama on Sky return. No N1 full navigation suite is run.

Real source cases: ambiguous Springfield (explicit second result), Eiffel Tower
Paris, Essen,221B Baker Street London, plus provider-independent0,0 and existing
ORAS manual coordinates. Invalid91,0, controlled empty/503/429 transport cases,
and corrupt provider retry are distinguished. Controlled transport fixtures do not
invent locations and are not claims that the public provider emitted those errors.

Review reproduced two genuine R2 bugs before correction: Essen and numeric/postcode
addresses were mistaken for malformed coordinates; invalid nonempty provider data
was cached as an empty successful result. Focused RED/GREEN tests retain these
regressions. No N1 correction was reopened. The independent review found no further
proven P1/P2 in its bounded source review.

Earlier R2 attempts remain in ignored output/r2-a and output/playwright. A response
waiter was initially armed before Explore could be used under hidden controls;
then a history check ran before flight acknowledgement/bookmark completion.
Actual UI/history traces identified test-harness mistakes; the driver now waits
for usable controls and final navigation acknowledgement and compares the saved
native bookmark. A layout check also retained a RED on the prior served CSS when
an overly strict filename guard blocked build promotion; final cards use automatic
height/stacked text and16px search input. Incomplete sandbox TestClient attempts
are not counted as passing or as proven application failures; Docker tests are
recorded separately. Historical pre-review R2 PASS evidence is retained with its
original hashes; changed search inputs are requalified before delivery.

## Preservation and next task

Sky/Earth native sources, source pins, qualified artifacts, satellite presentation,
Pennsylvania panorama and accepted camera/scroll controller are untouched. The
identity verifier checks the complete Earth manifest, pinned Sky files, independently
reproducible Hub bytes, served entry/CSS/JS/WASM/license/runtime records, source-bound
browser screenshots, original container identities/start times/mounts, Docker
volume inventory and owner settings hash. Only task-owned R2 preview containers
are created/updated. Existing services/worktrees/data remain intact.

N1 acceptance is the owner's decision. Its historical full navigation remains
**desktop5/22, mobile7/22 at240s caps; cause UNKNOWN; no assertion mismatch
reproduced**. Those partial records are retained, never called a fresh44-group PASS.

The preview is `http://127.0.0.1:4203/earth`; preview-only, no production change.
Original101 container identities/states/start times/mounts,90-volume inventory and
owner settings SHA256 `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`
are preserved. Earth artifact: `662e617078a4448d8235a2c9925c339ea7126cd430ec38cca5426fe8b60345b5`;
Sky artifact: `b57c40ddceca090224ac58f4758fde9d2193a649c571e58cb0a618b289649c19`.

The native Earth screenshot shows existing US aerial coverage. Non-US close-up
imagery is limited; those native camera assertions do not establish new global
aerial detail. Provider request failures/cancellations are retained in proof JSON;
zero page exceptions is not a claim that every imagery request succeeded.

PR71 remains OPEN and unchanged. Its reusable imagery dispatch/cache/source-policy/
worker/diagnostics work requires narrow integration and new artifact/browser proof;
PEMA distribution, optional ion permission and owner hardware/speed qualification
remain separate limits. See [the exact assessment](PR71_REUSE.md). R2-A activates
none of that imagery/cache work. Recommended next task after owner review: bounded
R2 imagery/cache integration from inspected PR71, preserving accepted navigation.
