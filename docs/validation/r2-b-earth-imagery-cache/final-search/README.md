# R2-B final search qualification

**Deterministic search integration QUALIFIED. Live Photon UNAVAILABLE. Owner review only — DO NOT MERGE.**

Continuation on `r2-b-earth-imagery-cache-1`, draft PR #79, baseline
`e5239e01ada05e058e4249ddf60981806881fe0e`, stacked on draft PR #78.
Owner live preview: <http://127.0.0.1:4204/earth>.
Recorded qualification uses isolated loopback4205; it is explicitly fixture-backed,
not a live-provider preview. No production implementation correction was needed.

## Demonstrated failure mechanism

One fresh isolated process in the actual R2-B backend container executes the
unchanged real FastAPI search route and actual `fetch_photon`, with server-side
observation only. [Trace](evidence/classify-live.json):

- TCP connects at174ms; TLS completes at954ms. Request headers/body are sent.
- Receiving response headers starts at956ms and fails at6962ms with
  **`httpx.ReadTimeout`**, approximately6006ms later. No upstream HTTP status or
  source payload was received. This is a transport response-header timeout,
  not observed Photon HTTP503, invalid source data or admission/backoff refusal.
- The actual application maps the fresh failure to generic503 in6948ms.
- Same-query cached retry returns the same generic503 in2ms; total upstream
  acquisitions remain1 and rate/backoff is inactive. This second response is
  cached unavailable, not a second upstream failure.

The separately measured normal live preview returns503 after7304ms and displays
its honest unavailable message; coordinate selection then reaches native0,0
without another provider request. Live availability is **UNAVAILABLE**.
Historical desktop/mobile503 requests lacked upstream tracing; their exact
exception cannot be reconstructed from normalized503 alone. The current server
reproduction establishes a concrete mechanism consistent with the old timing.
Why response headers did not arrive (provider/network path) remains unknown.

Only one fresh diagnostic acquisition and one separate normal-preview smoke were
made. The cached read does not retry the provider. Production limits, timeout6s/
outer7s, coalescing, caching, Retry-After handling and public errors are unchanged.
Diagnostics remain in qualification evidence; public clients retain the generic
unavailable response, without exception/connection details.

## Deterministic qualification and provenance

`tests/fixtures/earth/r2a-search-recording.json` is the exact original R2-A desktop
PASS proof, byte SHA256
`466515b1c87c217f909c9740981360a8ac3b77bd1a4fc7bbd5dd12738e3b517f`.
That hash matches the original desktop proof certified by the receipt committed
at R2-A27f34a94. Source/coordinate/OSM identity values are copied unchanged from
its four recorded API responses: Springfield, Eiffel Tower Paris, Essen and
221B Baker Street London. No places, coordinates or raw Photon features are
invented/reconstructed. [OSM attribution and ODbL](https://www.openstreetmap.org/copyright).
This is a test recording, not a production location catalog.

The opt-in qualification entrypoint `recorded_earth_search_app.py` substitutes
only the normalized search-service result seam in its own isolated process.
The actual unmodified FastAPI route supplies query validation, result contract,
source/attribution, error mapping and headers. Synthetic empty/unavailable/busy
conditions also traverse those real backend handlers. Unknown fixture queries
fail closed. There are no browser search-response routes, direct camera setters,
production fixture switch, new provider, dependency or credential.

The replay deliberately does **not** qualify raw Photon transport/normalization,
production admission timing or live reliability. Those unchanged service paths
retain earlier tests; new focused cases check private error/cached-failure and
429 backoff behavior separately. Fixtures never become a mocked live200 claim.

Both fresh full journeys ran at committed tooling source
`dae2a806087d3f85c00c35613e916c5a74b20ff4`, with existing180s caps:

| Evidence class | Desktop1440 | Emulated mobile390 |
| --- | --- | --- |
| Deterministic full journey |16/16 PASS|16/16 PASS|
| Explicit selected result / native acknowledgments |6 matching destinations|6 matching destinations|
| Coordinate search |0,0 without any provider call|0,0 without any provider call|
| Errors and recovery |empty,503,429, then recorded search succeeds|same|
| Native imagery/cache during search |auto,213 entries,59 hits|auto,166 entries,80 hits|
| Native time / history / Sky return |PASS|PASS|

Coverage includes ambiguous Springfield second-candidate choice; city/place/street
address; actual Cesium camera/acknowledgment; zoom and pan/anchoring; Back/Forward;
reload; invalid and zero coordinates; contextual details; errors and recovery;
Sky return and Back; one active renderer; native UTC/observer/canonical ORAS
context; accepted Pennsylvania panorama; automatic imagery, owned-cache worker
and actual cache reuse. Original native scheduling/camera/cache sources remain
unchanged. [Desktop proof](evidence/desktop-proof.json),
[mobile proof](evidence/mobile-proof.json), [live smoke](evidence/live-proof.json).
Screenshots are fresh screenshots of these declared evidence classes, not
historical images relabeled as new qualification. EOX2016 imagery carries its
existing linked attribution; no PEMA imagery pixels are redistributed here.

## Verification and preservation

New focused Docker tests: **9PASS**,7 existing anyio/httpx deprecation warnings.
Missing-helper RED and GREEN are retained. Cases cover recording integrity and
original committed receipt; exact route results; validation; real error handlers;
unknown-query fail-closed; test-server opt-in; production timeout/HTTP429/invalid
shape/invalid-coordinate errors remaining private and cached without retry.

Unchanged evidence is reused by source/artifact identity, **not rerun or renamed**:
223 runtime/Earth,135 Docker Earth,291 frontend,43 backend tests; matching
independent Earth and Hub builds; genuine imagery/cache/cold/warm/restart and
controlled-failure browser evidence. All production frontend/backend/runtime/
package/vendor/integration/data paths are unchanged from e5239e01. No rebuild was
needed for qualification-only scripts/fixtures/tests/documents.

The delivery verifier rechecks committed source for each new proof, including
source bytes at its recorded run-start commit, and all513 Earth/130 Hub served
files via the existing identity verifier. Both preview origins serve identical
Hub/native assets. Exact unchanged Earth artifact:
`e0a904a201b11b7c6202cc1467b2cd3c80c02beed58bb0956eab2372c37ac0bf`;
Sky artifact `b57c40ddceca090224ac58f4758fde9d2193a649c571e58cb0a618b289649c19`.
Original N1 rollback Earth662e6170…, source pins, read-only scientific mounts,
owner settings SHA6fd3157f… ,103 original container IDs/mounts and90 volumes
are preserved. Two additional task-owned recorded-qualification containers serve
loopback4205. Original services were not stopped/restarted/pruned. The prior
eight external state differences remain seven stopped and one later frontend
StartedAt; cause unknown, not attributed to this task.

Exact new commands:

```sh
docker exec -i -w /work oras-r2-b-backend python - < output/r2-b-final-search/classify-live.py
docker exec -w /work oras-r2-b-backend python -m pytest tests/validation/test_recorded_earth_search.py -q -p no:cacheprovider
python3 output/r2-b-final-search/start-recorded-preview.py
R2_WIDTHS=1440 R2_EVIDENCE=output/playwright/r2-b-recorded-search-desktop timeout 180s node scripts/validation/verify_r2b_recorded_search.mjs
R2_WIDTHS=390 R2_EVIDENCE=output/playwright/r2-b-recorded-search-mobile timeout 180s node scripts/validation/verify_r2b_recorded_search.mjs
timeout 120s node scripts/validation/verify_r2b_live_search.mjs
python3 scripts/validation/verify_r2b_final_search_delivery.py
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

The evidence directory includes the two setup/diagnostic scripts, raw new test
outputs, typed trace, browser proofs and selected licensed screenshots. Full
raw logs/receipts are in ignored `output/r2-b-final-search/`; original failures and
pilot evidence are retained separately. The unchanged prior identity checker
still labels its original failed live-search proofs as historical failed evidence.
The new delivery receipt records deterministic PASS and separate live UNAVAILABLE.

Independent exact source review of dae2a806 found no actionable findings; original
recording/receipt provenance, fixture isolation, Python syntax, both browser
syntax checks and diffcheck were independently verified. Final docs/evidence-only
exact-head follow-up is bound in the PR and served review receipt after commit.
No GitHub approval or live-provider qualification is inferred.

## Remaining gates and stop

N1 remains OWNER ACCEPTED. Original5/22desktop and7/22mobile navigation records
remain historical/UNKNOWN; not rerun. Recorded search fixtures do not measure
scientific observer elevation, imagery capture correctness or surveyed horizon.
Ellipsoid/unknown-elevation contracts and illustrative panorama remain intact.
PEMA public rights, complete aerial-detail browser availability, dated2016EOX
quality, terrain/buildings/provider entitlements, physical owner hardware and
visual acceptance remain unchanged open limits. No paid fallback/retries or new
provider was added. Live Photon is best effort and currently UNAVAILABLE.

Next task is owner review of this qualification handoff; separately authorize any
remaining provider/rights/hardware work. Do not merge79/78/74/73/71, deploy or startR3.

[Context](context.json), [loaded documents](loaded-documents.txt), [plan](plan.md),
[files changed in this follow-up](CHANGED_FILES.txt), [all PR files](ALL_PR_FILES.txt).
