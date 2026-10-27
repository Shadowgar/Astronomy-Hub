# Source-offer UI implementation receipt

Branch recovery/reconcile-20261026; verified initial and final HEAD2093f06296d58f5030282b9663ef529a042b01d5; existing worktree .worktrees/repository-recovery-20261026. No commit/push by this subagent.

User attachment read: /home/rocco/.codex/attachments/49a71e4f-a22e-44b4-87ca-9276c2bc31c4/Pasted text.txt. Current LIVE refreshed; root/frontend AGENTS and review context were already loaded in this session. No architecture/runtime/satellite investigation reopened.

Own files changed:
- frontend/src/features/workspace/AboutLicenses.tsx
- frontend/src/features/workspace/sourceOffer.ts (new)
- frontend/tests/aboutLicenses.test.tsx
- frontend/tests/sourceOffer.test.ts (new)

About & Licenses replaces the historical N1 branch download with validated manifest-driven source details. On opening the existing dialog it loads /source-distribution/manifest.json with cache:no-store; closing aborts pending work. The existing showModal, close listener, Escape propagation guard, close button and menu focus restoration are unchanged. Loading/unavailable/invalid descriptors never generate the old download link.

The descriptor must have schema1, candidate/published status,40lowercasehex source revision,64hex archive/sky/native digests, positive safe-integer byte count, bounded license and limitation text, safe same-origin /licenses paths and the AGPL license entry. Archive retrieval is additionally bound to the exact revision filename /source-distribution/astronomy-hub-source-{source_revision}.tar.gz. No revision/archive hash is hardcoded into the source. Candidate text clearly states local/unpublished and that public anonymous HTTPS retrieval has not been qualified. The ready details show full revision, digest,bytes, dynamic license list, limitations and archive download; a repository tree link uses the exact manifest revision. Code redistribution is distinguished from imagery/data rights.

Focused RED/GREEN commands (cwd frontend):
1. npm test -- tests/aboutLicenses.test.tsx > /tmp/pr107-source-offer-red.txt 2>&1
   Before implementation:2passed1failed. Failure proves old N1 branch download claimed current corresponding source.
2. npm test -- tests/sourceOffer.test.ts > /tmp/pr107-source-offer-revision-red.txt 2>&1
   Before immutable filename guard:12passed1failed. Failure proves different-revision archive accepted.
3. npm test -- tests/aboutLicenses.test.tsx tests/sourceOffer.test.ts > /tmp/pr107-source-offer-green.txt 2>&1
   Final:2files17tests passed, exit0. Malformed/absent/SPA/oversized/aborted descriptor, unsafe retrieval/notice paths, missing identifiers, exact source revision filename and local-candidate output all covered.
4. npm run typecheck > /tmp/pr107-source-offer-typecheck.txt 2>&1
   tsc --noEmit,exit0 at final UI source.
5. git diff --check
   exit0.

One initial revision-test command ran from repository root and failed `Missing script: test`; no application failure. Corrected to frontend cwd before observing the actual intended RED result.

No build/Docker/browser/physical-device test has been run by this UI subagent. Parent owns source archive construction, descriptor/archive generation, local preview/link/hash/served-version/touch/keyboard proof and independent review. No public anonymous HTTPS retrieval is claimed, no public link is replaced/live deployed, and no legal-compliance determination is made. The revision-linked GitHub tree can only be publicly retrieved after parent pushes the matching code commit; local source archive availability is tested separately by parent.

Native discoverability recommendation passed to parent: inject a 44px ordinary anchor through the external sky-adapter entry (standalone and embedded) to /licenses/source-offer.html, backed by the same sidecar descriptor. Preserve native keyboard Tab handling by treating that anchor as a native control. This needs no nativeWASM/Vue change. Parent owns these separate files; this subagent changed app About flow only.

Remaining gate: independent review of these4files, archive/reconstruction qualification, actual served-source UI retrieval/accessibility proof and public anonymous HTTPS qualification only if/when publication is separately authorized. Existing native/imagery/data/settings/volumes remain untouched by this subagent.

## Independent-review correction — stale sidecar binding

Reviewer identified that syntactically valid sidecars could describe an old Hub build while claiming Matching source revision. Parent explicitly authorized a narrow loader correction.

`loadSourceOffer` now requires the build's `import.meta.env.VITE_SOURCE_REVISION` to be a40hex value. Missing/unqualified development builds fail closed and never expose a matching offer. It retrieves both descriptor and /runtime-versions.json with the same abort signal and no-store policy; only after validating the full descriptor and comparing exact compiled source revision, sky.artifact_sha256 and sky.native_horizon.native_output_sha256['stellarium-web-engine.wasm'] can it return ready data. The parent must inject identical VITE_SOURCE_REVISION into original/reconstructed Hub builds; no archive digest is compiled into code.

Regression-first `npm test -- tests/sourceOffer.test.ts > /tmp/pr107-source-offer-identity-red.txt 2>&1`:12passed8failed before correction. New failures cover missing compiled identity, valid older source sidecar, wrong/missing runtime hashes and404/SPA metadata, plus verifying the second no-cache fetch.

Final `npm test -- tests/aboutLicenses.test.tsx tests/sourceOffer.test.ts > /tmp/pr107-source-offer-green.txt 2>&1`:2files24tests passed,exit0. `npm run typecheck > /tmp/pr107-source-offer-typecheck.txt 2>&1`:exit0. data_source_review notified for independent re-review. Runtime metadata matching is a bounded application check; parent still owns actual artifact/source archive hash and served byte proof.
