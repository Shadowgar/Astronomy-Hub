# Independent review: source-offer About UI

Read-only review on `recovery/reconcile-20261026`, base HEAD `2093f06296d58f5030282b9663ef529a042b01d5`, covering only:

- `frontend/src/features/workspace/AboutLicenses.tsx`
- `frontend/src/features/workspace/sourceOffer.ts`
- `frontend/tests/aboutLicenses.test.tsx`
- `frontend/tests/sourceOffer.test.ts`

## Result

URL/text/cancellation/dialog review found no confirmed actionable P0/P1/P2 defect.17 focused tests pass across2files. Source/runtime binding is currently a release-sidecar qualification dependency, described below; the UI is not an independent digest verifier. This review does not certify actual publication, archive completeness, anonymous HTTPS retrieval or served identity.

`sourceOffer.ts:5-14` restricts archive retrieval to an exact same-origin revision-qualified tar.gz path under `/source-distribution/`;40hex revision,64hex archive/native/runtime digests, positive safe-integer size. No JavaScript URL, external URL, percent encoding, query, repeated slash or path-traversal segment is admitted. License links are local `/licenses/` paths; AGPL license entry is required; text/list sizes are bounded. Manifest-supplied text is rendered with normal React escaping. No raw HTML injection or open URL construction from unvalidated user text was introduced.

The old historical n1 branch archive offer is removed. A candidate says `Local, unpublished source candidate` and explicitly states public anonymous HTTPS retrieval is unqualified. A published status merely follows the trusted same-origin distribution manifest's declared state; public-site qualification is not performed by this component. Missing404, malformed/SPA bodies, unsupported manifest data and oversized text produce no offered archive; no fallback to an unrelated old branch is used.

`loadSourceOffer` uses `cache:no-store`, the caller AbortSignal, HTTP success and body/schema validation. Opening reloads and clears the prior offer. Closing/unmounting aborts and checks abort state before updating React state; stale response handlers cannot replace a later opening. Native `<dialog>` semantics, labeled close button, Escape behavior and existing Menu focus restoration remain. Initial/unavailable text uses role=status. Actual keyboard/touch/focus behavior requires the isolated browser run; static markup tests alone do not prove it.

## Source/runtime identity dependency

The runtime digest fields are format-validated but not compared with the currently served runtime marker or displayed. Any structurally valid same-origin manifest is accepted, even if its valid-looking digest strings refer to a stale runtime. `AboutLicenses.tsx:9` calls its revision `Matching source revision` on the strength of that manifest. This is an observable stale-sidecar risk if the distribution directory is mounted from an unrelated release. Review parent was asked whether release assembly/served-identity validation is the explicit authority or whether browser-side runtime comparison is required.

At minimum, the parent must bind actual distribution manifest+archive to actual served native/Sky artifacts and exact reviewed source snapshot before claiming source matching. Published state must be emitted only after actual publication authority and retrieval proof. The UI itself should not be represented as verifying archive bytes or cryptographic source/runtime equality. If this explicit release authority remains the intended design, the absence of another browser hash comparison is a limitation, not by itself a demonstrated implementation bug.

## Verification and preservation

```text
npm --prefix frontend test -- --run tests/sourceOffer.test.ts tests/aboutLicenses.test.tsx
git diff --check
```

Vitest4.1.2:2filesPASS,17testsPASS,0fail/skip,246ms reported duration. Whitespace check passes. Reviewer made no source/config/data/Git/runtime changes; only this /tmp receipt was written. No package installs, native rebuilds, provider calls, browser run or production operations. Same assigned user attachment and prior source-review context; no extra governing docs loaded. Parent's source package/toolchain and actual preview qualification require separate review/evidence.

## Independent re-review after identity correction

The runtime author corrected the stale-sidecar dependency. Current `sourceOffer.ts:18-30` requires a40hex compiled `VITE_SOURCE_REVISION`, fetches both descriptor and `/runtime-versions.json` with the same AbortSignal/no-store/bounded JSON checks, validates the descriptor, and compares exact source revision plus Sky artifact/native WASM digests before returning any offer. Missing compiled revision, missing metadata, mismatched runtime, stale revision or SPA metadata withhold the archive. The author reports8red failures before correction; independently rerun final focused tests report24PASS across2files,0fail/skip (257ms). No remaining actionable finding in these4UIfiles. The source UI's build-time revision must be identically supplied to expected and reconstructed Hub builds; actual archive bytes/deployment remain separate qualification gates.

A separately reviewed standalone static `source-offer.html` duplicated its guard and still admitted missing runtime fields by undefined equality during the precommit review. That is recorded as a confirmed P2 in the parent toolchain/static-page review and requires its own correction; it does not invalidate the corrected TS loader behavior above.
