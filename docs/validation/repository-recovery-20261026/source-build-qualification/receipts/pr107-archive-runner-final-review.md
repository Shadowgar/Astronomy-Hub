# Independent final archive-runner path review

Reviewed exact commit `f44deb2834ddfd0ea2a5fb092e7860d0911be703` on `recovery/reconcile-20261026`; checkout clean when inspected. Scope is only that commit's two-file change in `scripts/source-distribution/reconstruct.py` and `README.md`. No build or Docker operation was run. This reviewer did not author the correction.

## Disposition

No actionable finding. The correction makes both Vue npm-ci and Vue-build stages mount the extracted `stellarium/apps/web-frontend` subtree at `/work` with working directory `/work`. Thus absolute dependency/config paths have the qualified release's documented root without borrowing any owner checkout or node_modules. Hub npm-ci/build retain the full extracted root at `/source` and `/source/hub/frontend` working directory, preserving their required relative Hub/runtime/protocol/config inputs.

The Vue app is self-contained after packaged overlay/bridge integration. All local adapter/material/site/protocol dependencies needed by its bundle are copied into its source tree. Its vue.config.js computes the sibling test-skydata path, but bulk copying remains disabled via ORAS_RUNTIME_COPY_SKYDATA=0; the native compiler stage and output-copy paths are unchanged. Static stage directory names are supplied internally, so the new startswith branch cannot redirect an externally provided subpath.

Crucially, the commit changes mount/working paths only; exact native, Sky file-set/SHA and Hub file-set/SHA comparisons remain unchanged. There is no normalization or output-rewriting step. The README identifies the fixed path as a reproducibility input and explicitly says outputs are compared unchanged. Parent-reported initial diagnostic normalization explains the old mismatch; this review does not elevate that diagnostic into a qualified build pass.

## Read-only verification

- `git rev-parse HEAD`: exact f44deb2834ddfd0ea2a5fb092e7860d0911be703. `git status --short`: no output.
- Inspected `git show f44deb2834ddfd0ea2a5fb092e7860d0911be703 -- scripts/source-distribution/reconstruct.py scripts/source-distribution/README.md` and full current runner.
- Executed the actual nested node() function extracted through Python AST in memory with only its run() callback replaced by an argument recorder. Four cases passed: Vue install/build each mount only the extracted app at/work; Hub install/build each mount only the extracted root at/source. Both installs retain network bridge, both builds network none; exactly one mount per stage, no HOME override, pinned node-image argument and900-second stage timeout retained.
- Confirmed all three exact SHA-comparison expressions remain present in the actual runner, including complete Sky and Hub path/hash dictionaries.
- `git diff --check f44deb2834ddfd0ea2a5fb092e7860d0911be703^ f44deb2834ddfd0ea2a5fb092e7860d0911be703 -- scripts/source-distribution/reconstruct.py scripts/source-distribution/README.md`: no output, exit0.

No repository files changed, no commits/pushes, no full suites or second build. The final fresh archive qualification result remains the parent-owned completion gate. This report does not claim it has finished or passed.
