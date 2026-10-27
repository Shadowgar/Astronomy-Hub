# PR107 final source archive independent review — f7cb702c

**Current final audited source candidate:** `f7cb702c428980ce2b32539dbc74fc2b35082c12`. Earlierf44/87sections below are historical and superseded for source distribution identity.

Final archive: `output/source-qualification/candidate-f7cb702c/astronomy-hub-source-f7cb702c428980ce2b32539dbc74fc2b35082c12.tar.gz`; SHA256 `7cf5cf444b35c02f05aeebd555e4a0142fc52c666161d14bea4981de9ebf3fde`;23,639,435bytes. `package.json` exists and its SHA/size/revision were independently checked before auditing.

**PASS actual source-archive integrity/completeness inspection.**1,563manifestinputs+manifest=1,564regular members,0duplicate/unsafe path/link/owner/time/mode errors;0manifest file/hash/size/executable-mode errors;0Hubbytes differing from exact committedf7source;0forbidden caches/generatedWASM/mountedbulk inputs.565of567old attestedinputs exact; only intended generated native JS/WASM absent;0native changes. File pathset identicalf44; only actual source deltas are README.md,reconstruct.py,test_source_package.py as committed.

Reviewed3-file final delta: npmci's auxiliary yarn.lock rewrite is recorded with before/afterSHA and the exact archived source input is restored before Vue build; any authoritative npm package-lock.json change raises an error. Dependency installation still uses npm lock integrity and no host caches. This restores a declared source input, not a generated artifact. All generated Sky/native/Hub outputs remain compared unchanged against exact expected raw file hashes; no diagnostic replacement or normalization exists in the runner. Existing final source-file checks remain, and the preservation receipt is included in reconstruction result. README states this input behavior and the fixed /work buildpath. No remaining confirmed defect found in this narrow correction.

Independent new regression invocation: `python3 -B -m unittest discover -s tests/validation -p test_source_package.py -v` =>6PASS/0fail,0.048s, including auxiliary-lock restoration and authoritative-lock-change rejection. `git diff --check` exit0; git status empty atf7. No repeated native/JS build or browser action by reviewer; parent owns final actual reconstruction/served-offer evidence and must record those results separately.

Final machine audit: `/tmp/pr107-source-final-f7-archive-audit.json`. Reviewer-derived subtree row-list SHA256 (canonical JSON algorithm below): Hub `e4161e8355df5d5fa61ef06b94af6d3e86761d9a2c03d8b3ca1e82abccf51818`; Stellarium unchanged `a080eaf20de77a8a01caef5631b9a1b5a645bb738716dfce944f4e5b06396d8c`.

Unresolved external notice/legal gates exactly retained: inih LICENSE.txt and WebP COPYING/PATENTS/AUTHORS are absent despite source references; exact Noto font notice/provenance and full Roboto font-license treatment remain unqualified. Included small original/bundled font/icon/NASA/compatibility-catalog assets retain distinct rights; mounted bulk science excluded. No public/legal-compliance/production/device/owner acceptance is inferred. Reviewer changed no repository/data/Git/runtime state and did not publish source.

## Historical actual archive review — f44deb28 and87c61fdc

# PR107 final source archive independent review — f44deb28

**Current audited source candidate:** `f44deb2834ddfd0ea2a5fb092e7860d0911be703`. The earlier87c61fdc record below is historical and superseded for artifact delivery.

Final archive: `output/source-qualification/candidate-f44deb28/astronomy-hub-source-f44deb2834ddfd0ea2a5fb092e7860d0911be703.tar.gz`; SHA256 `8bf3e165260de9edf4ddc180a947ba51e3a3263a6bc4624e7154ea712a5708be`;23,638,822bytes.

Independent repeated actual-tar audit: **PASS**.1,563manifestinputs plus manifest =1,564regular members;0duplicate/unsafe paths/links/owner-time-mode errors;0manifest path/hash/size/executable-mode mismatches;0packagedHub bytes differing from exact f44 committed source;0forbidden caches/generated WASM/mountedbulk paths.565of567old attested inputs remain exact, only2regenerable JS/WASM outputs absent,0native changes. Archive pathset is identical to87; only input-content changes are `hub/scripts/source-distribution/README.md` and `reconstruct.py`.

Read-only commit delta review: Sky dependency install/build now mounts its exact archived Vue app at fixed in-container `/work` instead of `/source/stellarium/apps/web-frontend`. Hub continues mounting the extracted root at `/source`. This pins the qualified Webpack4/vue-loader absolute path so generated helper/cache identifiers can reproduce original bundle bytes. No hidden owner path, dependency/cache mount, source/math change, output normalization or relaxed comparison was introduced. Full unchanged expected path/hash comparison remains. README documents why fixedpath is part of the recipe. Parent reports old87fresh native outputs matched but Vue differed by diagnostic path/cache identifiers; those earlier results are parent-owned historical evidence, not a passing finalf44 reconstruction. Parent's actual final clean qualification remains required/running; reviewer did not start another build.

Final machine receipt: `/tmp/pr107-source-final-f44-archive-audit.json`. Source-tree row-list digest algorithm as below: Hub `f72aadcb0b3a7a64ff0734ab4539da7869c6511e597ebf9a5f299dd6d6c7ad55`; Stellarium unchanged `a080eaf20de77a8a01caef5631b9a1b5a645bb738716dfce944f4e5b06396d8c`.

`git diff --check` exit0; final git status clean atf44. No unnecessary repeat suite/build: prior focused5package/1artifact/6static checks below remain attached to their actual reviewed code state; thisf44follow-up is source/tar delta verification. No reviewer source/data/Git/runtime/publication changes. Original notice/font/licensing, actual reconstruction/served identity, public retrieval and owner/device gates remain explicit and unchanged.

## Historical actual archive review — 87c61fdc

# PR107 actual source archive independent review

Reviewed local committed candidate `87c61fdc17ee76973244b30d205a639fc262d850` on existing `recovery/reconcile-20261026`, worktree `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`. Initial/final git status clean. Scope: actual archive contents, source/code/notice boundary and the final bytecode preflight correction. Read-only; no source/data/Git/runtime/publication changes, no second reconstruction build.

## Verdict and exact artifact

**PASS at source-archive integrity/completeness inspection scope.** No remaining confirmed code/package defect found. Actual acquisition/build equality, served source-offer accessibility, anonymous public HTTPS and legal/device/owner gates are separate; this receipt does not claim them passed.

Archive: `output/source-qualification/candidate-87c61fdc/astronomy-hub-source-87c61fdc17ee76973244b30d205a639fc262d850.tar.gz`.

- SHA256: `7bdbc1cfdb9de6c55d6fc3abd18ea063cb96197f551837ed0d2d42b43c98c090`
- Bytes:23,638,623
- Manifest inputs:1,563 =996Hub +567Stellarium files; tar includes1additional source-manifest.json,1,564members total.
-0duplicate names,0unsafe path/root traversal,0symlink/hardlink or nonregular members,0unexpected owner/time/mode metadata.
-0missing/extra manifest paths,0hash/size/executable-mode mismatches.
-0packaged Hub bytes differing from committed87c61fdc blobs.
-0forbidden cache/node_modules/dist/test-results/Git/generatedWASM or mounted bulk-data paths in the audited classifications.

Independent machine receipt: `/tmp/pr107-source-final-archive-audit.json`.

Separate content-tree SHA256 values, computed over each subtree's original ordered manifest rows with JSON sort_keys=True,separators=(',',':'):

- Hub:`eff6973584b5b54b49fefbb442dbfe5bcb7e7e4be006a0f07ae96b49bd9a74cd`
- Stellarium:`a080eaf20de77a8a01caef5631b9a1b5a645bb738716dfce944f4e5b06396d8c`

These are reviewer-derived row-list digests, not extra fields claimed to exist in the archive manifest. Final archive digest binds the manifest itself; its input table intentionally excludes itself.

## Actual coverage and old source comparison

Required source/build contexts present: full prepatched native src/ext_src/build-time data/tools/Makefile/SConstruct and Vue inputs/locks; all lock-hashed Hub overlays including the exact public .env.production; native patch; external bridge/native-panels and all runtime-protocol modules; material CSS and original Pennsylvania source artwork/manifest; site config; source package/toolchain/acquisition/reconstruction scripts and executable instructions; original About/sourceOffer code and standalone legal page; root MIT/THIRD_PARTY_NOTICES, AGPL copies, Hub asset notices, migration source/config, small Solar assets/provenance. No binary-only shortcut is needed to supply the native outputs to Vue; the runner regenerates them before Hub build.

Compared every567source-input row of the old clean native/Vue build attestation against actual tar bytes:565present and exact hash matches,0changed. Only absent rows are the two intended regenerable outputs `apps/web-frontend/src/assets/js/stellarium-web-engine.{js,wasm}`. The full tar also contains new Hub/external legal-offer source absent from the old limited package.

Manifest expectedSky has111rows including runtime metadata marker; runner compares110actual Vue output payload files with that marker excluded, then stages those outputs beside the archived metadata marker for Hub's144expected output rows. The external bridge legal-link source is present at exact committed bytes and represented by updated runtime bridge-input hash. Current artifact test verifies the committed marker/lock/version/source/payload relationship without native/WASM alteration.

## Bytecode preflight correction review

Reviewed87c61fdc3-file change: reconstruct.py sets `sys.dont_write_bytecode=True` before importing package_source; README invokes Python with-B; regression copies both scripts into a fresh temp directory, invokes --help without-B, and asserts no local __pycache__ was created. This addresses the earlier single-extra-file preflight failure without weakening inventory validation or removing source files. No earlier incomplete preflight is relabeled a build pass. Independently rerun package tests5PASS/0fail (0.046s).

Actual one reconstruction is parent-owned and running from its fresh extraction. Reviewer did not start another build, read/write its build output, install dependencies or touch images/containers/volumes. Runner acquisition/source procedures were reviewed in `/tmp/pr107-source-package-independent-review.md`; source code itself does not establish its runtime result.

## Notice and data boundaries remain explicit

The actual archive preserves root scoped MIT, THIRD_PARTY_NOTICES and native AGPL headers/text; it does not blanket-relicense third-party content. Original source assets and existing notices remain intact.

Still absent from the pinned native tree/archive: inih LICENSE.txt and WebP COPYING/PATENTS/AUTHORS referenced by source headers; Noto font exact notice/provenance and complete Roboto font license treatment remain unresolved. Inline native dependency notices, md4c license and Hub Plex/Lucide/Feather licenses are retained. These are known external licensing/notice qualification gaps, not silently cleared by inclusion of source or a successful build.

The source candidate excludes mounted bulk catalogs/ephemerides/orientation/HiPS/runtime science and owner data. It intentionally includes existing small bundled non-code source assets needed by Hub/native builds: original artwork/fonts/SVGs/NASA Solar imagery+GLB and committed backend compatibility catalogs (`planetary_satellites.json`, catalog registry, Gaia pilot manifest, Hipparcos subset, OpenNGC compressed data). Those retain separate data/media rights; in particular OpenNGC's CC BY-SA scope is identified by THIRD_PARTY_NOTICES. Do not describe this as a package containing only MIT/AGPL program text or as clearance for all included assets/data. No new provider/catalog/image download or public distribution occurred in this review.

Standalone source-page identity bypass and missing notice coverage were fixed before this archive. The actual current inline static script independently passes6fixtures including missing/mismatched identities; corrected React loader rejects stale/missing build/runtime identity before presenting source. Publication status remains candidate and should remain so until separately authorized public retrieval proof. Source/offer sidecar digest stays outside archived source to avoid a self-hash cycle.

## Exact validation run

```text
python3 -B -m unittest discover -s tests/validation -p test_source_package.py -v
node --test tests/runtime/sky-artifact.test.mjs
node /tmp/pr107-source-offer-static-proof.mjs frontend/public/licenses/source-offer.html
git diff --check
git status --short
```

Results:package5PASS;artifact1PASS/0fail/skip;static-source-module6PASS;whitespace exit0;status empty. Read-only Python tar/git-archive audit checked all member metadata, file hashes/sizes/modes, required roots, old attestation inputs and committedHub bytes; machine output saved above. No whole-suite rerun or browser qualification was performed.

Recommended next action: finish the single parent archive-only reconstruction, inspect exact output comparison/logs and actual served source-offer/download identity, then record remaining publication/notice/legal/device/owner gates. No merge, deployment, source publication or production-ready claim is authorized by this review.
