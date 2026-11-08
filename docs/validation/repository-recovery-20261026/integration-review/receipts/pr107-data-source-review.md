# PR107 independent data/source/build review

Reviewed worktree `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`, clean branch `recovery/reconcile-20261026`, HEAD `56f5645aac51d0d4bf16508dd85fba77e76db43c`; comparison main `9a03d8260a529f5858c5c3298cbb9d32b721daeb`.

## Scope and verdict

No new P0/P1/P2 integration defect found in the bounded dense-star and source/build scope. Dense-star 404s are reproducible sparse-catalog behavior inherited unchanged from main. The source candidate materially improves on the October24 audit's sparse-native-source situation, but still does not satisfy its release package/build procedure, publication, interactive offer, combined-work scope or deployment gates. These are existing explicit release qualification gaps. They do not by themselves prove runtime regression or make Git integration a public deployment, but the recovery README also expressly keeps integration blocked until its missing gates are resolved. This review does not waive that owner-controlled gate.

This is an independent inspection, not adoption of author approval. No application files, source data, Git state, containers, volumes or production were changed. Only this receipt and `/tmp/pr107-dense-validate.json` were written. No source downloads, package installs, rebuilds, provider requests or satellite investigation.

## Dense-star 404 root cause and impact

Cause: `scripts/skydata/build_oras_dense_star_tiles.py:406-423` filters source records by the selected magnitude limit, groups surviving stars by HEALPix cell, and emits only occupied cells. `:292-303` describes order3/min-order3. The installed `2026.09.native-stars.4` visual-default profile has magnitude limit4.8, 1,668 stars, 590 of the 768 possible order3 cells. Thus178 cells intentionally have no tile. The binocular and deep profiles each occupy768 cells (65,143 and84,129 stars respectively).

`integrations/sky-overlay/apps/web-frontend/src/assets/oras_dense_stars.js:181-205` registers the profile as native replacement, plus native Gaia continuation; it does not pass its manifest tile occupancy list to the native renderer. Native `integrations/sky-overlay/src/modules/stars.c:710-719` visits visible cells, counts terminal status and skips null tiles. Pinned full-source `/var/tmp/oras-phase-c/sky-reconstruction/upstream/src/hips.c:707-723` explicitly requests `ASSET_ACCEPT_404` and treats4xx as absent. This is source-level graceful absence, not evidence that nonexistent stars should have been rendered.

The saved recovery `receipts/browser-smoke.json` has74 unique404 URLs, all under visual-default order3. Every one is absent on disk AND absent from the manifest's declared tile entries. Example `/oras-sky-engine/skydata/dense-star-tiles/profiles/visual-default/Norder3/Dir0/Npix39.eph`. Full installed data SHA/size/path verification: visual590/590, binocular768/768, deep768/768; zero bad hashes/sizes, zero undeclared or missing declared paths. Repository validator also passes all3 profiles. Root manifest/source-generation digest `e286212acbd9b86bf30d92fe73744bfb451bce56912bca0f58b7cc560ced6f7f` is retained.

Routing: the recorded preview receipt mounts `integration-main-20261005/data/runtime-packs/dense-star-tiles` read-only at `/skydata/dense-star-tiles`; `output/recovery/nginx.conf:17` aliases `/oras-sky-engine/skydata/` to `/skydata/`. Consequently these are real missing sparse files, not a wrong prefix or missing entire mount. Main Compose also specifies a separate read-only dense mount. No corrective mount/data promotion is warranted by these404s.

Main comparison: `scripts/skydata/build_oras_dense_star_tiles.py`, `integrations/sky-overlay/apps/web-frontend/src/assets/oras_dense_stars.js`, and `integrations/sky-overlay/src/modules/stars.c` are each byte-identical to main. Vite's candidate changes concern bridge/legal assets, not the sparse-tile fallback. User impact is visible network404 noise and extra requests for empty cells; no catalog star loss demonstrated. This review does not prove broad Gaia depth, full-sky science or performance. A separately authorized follow-up could evaluate empty valid EPHE tiles or native-supported occupancy metadata with regression tests; do not invent stars, suppress errors globally or change photometry to hide the symptom.

## Source package evidence and exact missing gates

`output/recovery/sky-source-candidate.tar.gz` exists:10,577,239bytes, SHA256 `7b25bd4f6a975cddaf6004dc796489df703d1fda424f63434760a1fff2a3f18b`,858 files. This matches `receipts/source-package.json`, whose status explicitly says `PREPARED_NOT_PUBLISHED_OR_LICENSE_QUALIFIED`, candidate f7e69519. Includes Makefile, SConstruct,242 ext_src files,159 src files, Vue sources/locks, and integrated plugin. Comparing all567 clean-build attestation source-input rows against archive yields565 present/hash-matching,0 mismatches; the two absent rows are generated native JS/WASM, intentionally regenerable outputs, not evidence of absent native source. Current plugin/material/satellite source files inspected also match the archive exactly, despite its older metadata SHA.

The recorded clean native+Vue build reproduced110 application files. Fresh current check `node --test tests/runtime/sky-artifact.test.mjs` passes1/1,0fail/skip; it verifies current committed payload files and marker/source hashes. This is source/artifact consistency, not fresh dependency acquisition or independent archive-only reconstruction.

Existing release qualification blockers remain:

1. No public immutable source artifact URL/digest is bound in the runtime marker or release manifest. The tar is only ignored local output. `frontend/public/licenses/README.txt:1` points to mutable historical `n1-sky-earth-navigation-1`, not the current artifact-matched archive.
2. No verified interactive source offer. The current `app.1f71b7b1.js` has zero `Source code`, `source code`, `github.com/Shadowgar`, `source-candidate` or `licenses/` markers. `integrations/sky-overlay/apps/web-frontend/public/index.html:29-38` mounts the app without an offer; `runtimes/sky-adapter/plugin.js:166` opens data/survey credits, not a corresponding-source archive. Full AGPL texts are present and equal SHA256 `0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0` in vendor/overlay/public licenses; texts alone do not prove a prominent build-matched source offer. Standalone/embedded keyboard/touch/screen-reader visibility and anonymous HTTPS archive retrieval remain untested.
3. Archive-only build instructions are incomplete. The archive includes only7 `hub-build-context/` files (lock, patch,5Python/shell build scripts). Included `scripts/runtime/build_sky_horizon.sh:7-22` requires a separate Git checkout at exact anchor, a preexisting locally named native builder image with exact image ID,29 overlay inputs, external adapter/material/site configuration/artwork inputs and read-only preinstalled node_modules. Those Hub inputs are not available at the paths its included scripts require. `sky_source.py:5-15` defaults to a private workstation path and requires a Git root; the tar is an already modified tree with no Git checkout. `apply_sky_overlay.py:6-8` requires missing Hub overlay paths. `integrate_sky_bridge.py:7-35` requires missing Hub source/config/artwork context even though copied plugin output is present in the integrated tree. `scripts/Dockerfile.stellarium-jsbuild` is absent from the archive. There is no adapted direct-from-prepatched-tree build guide or fresh environment acquisition recipe proven by the existing cached rebuild.
4. Separately served bridge/protocol inputs such as `runtimes/sky-adapter/entry.mjs`, `native-panels.mjs`, `packages/runtime-protocol/{endpoint,index,workspace}.mjs` are not in the tar's Hub build context. Their exact corresponding-source/combined-work scope and dependency/source inclusion needs an explicit license-boundary review; this technical inspection does not decide legal scope or claim a violation.
5. The runtime marker identifies upstream/patch/material/native/artifact hashes but no published source manifest; current immutable release pairing, fresh builder/dependency reproduction, notices/no-warranty presentation, third-party asset/data redistribution review, anonymous download integrity and actual deployment identity remain unqualified. Native/JS cached reproducibility is real evidence and must not be mislabeled as missing, but does not satisfy those other gates.

Narrow correction: qualify an exact build-matched source package with usable fresh reconstruction instructions and covered connected inputs; publish only through separately authorized release work; add source-controlled visible source/license affordance and rebuild; then anonymous HTTPS/hash, standalone/embedded accessibility, regression and actual-served identity tests. Do not hand-edit generated bundles or silently substitute source/native pins. Release gates are explicitly recorded at source-offer audit S1–S3 and recovery README:66; no public-compliance conclusion follows from this repository-only review.

## Commands and results

Substantive verification commands (all from reviewed worktree unless absolute):

```text
git status --short
git rev-parse HEAD
git branch --show-current
git diff --check
/home/rocco/Astronomy-Hub/.venv/bin/python -B scripts/skydata/validate_oras_dense_star_tiles.py /home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/dense-star-tiles > /tmp/pr107-dense-validate.json
node --test tests/runtime/sky-artifact.test.mjs
sha256sum vendor/stellarium-web-engine/LICENSE-AGPL-3.0.txt integrations/sky-overlay/LICENSE-AGPL-3.0.txt frontend/public/licenses/stellarium-web-engine-AGPL-3.0.txt
git diff 9a03d8260a529f5858c5c3298cbb9d32b721daeb HEAD -- scripts/skydata/build_oras_dense_star_tiles.py integrations/sky-overlay/apps/web-frontend/src/assets/oras_dense_stars.js vendor/stellarium-web-engine/src/modules/stars.c frontend/vite.config.mjs docker-compose.yml
docker ps --format '{{.Names}} {{.Ports}}'
docker ps -a --format '{{.Names}} {{.Status}}'
```

Outputs: clean status, exact HEAD/branch above, whitespace check exit0; dense validator exit0 with3 profiles; Node1pass0fail0skip; AGPL license digests all equal above. Docker read initially denied by sandbox, successful escalated read only. Exact recovery preview/backend exist but are Exited(255); only unrelated owner frontend4173 is running. No4230runtime/browser request or new browser qualification claimed, and no container started. Initial system Python validator import failed with missing sqlalchemy; corrected by existing owner venv, no installation. One `python` invocation failed because only python3 exists. Other inspection used read-only rg/nl/cat, Python JSON/tar/hash comparisons and git-show byte comparisons as described above. No broad data download. Prior browser receipts are historical evidence only.

## Context loaded and limits

Default Mode. CORE_CONTEXT, LIVE_SESSION_BRIEF, CONTEXT_MANIFEST; assigned review pack36–55 (FEATURE_ACCEPTANCE, FEATURE_TRACKER, EARTH_CAPABILITY_PLAN, C5_7_EARTH_CORE_RECOVERY_SPEC, C6_GLOBAL_MAPPING_SPEC, ADR0009, the listed October5 Earth capability/divergence/input/traces/export/provider/handoff audits, C5_6_75 evidence, October10 adoption blueprint/external gaps/visual decision/roadmap/validation audits, C5_7_D evidence). A bulk read output was truncated; relevant source/licensing/build passages were subsequently searched directly, so this is scoped evidence review, not a claim of line-by-line review of every historical Earth audit. Explicitly authorized recovery README, COMMANDS, dated source-offer audit and OPEN_SOURCE_READINESS were read. No documents outside manifest/explicit recovery authorization were treated as governing context. Parent/other reviewers own review pack1–35. Memory registry used only as an evidence-routing hint, then current source/data/HEAD were checked.

Files changed: none in repo. Commit/push/PR: none; existing draft107 unaffected. Remaining gaps above. Recommended next task: owner disposition of the separate source-release/build qualification gate, while independent integration/security/UX reviewers finish their assigned areas.
