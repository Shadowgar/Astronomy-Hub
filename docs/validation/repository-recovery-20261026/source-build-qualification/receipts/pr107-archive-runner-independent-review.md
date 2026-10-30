# Independent archive-runner review

Scope: parent's `scripts/source-distribution/package_source.py`, `reconstruct.py`, related README/identity helper, native legal-entry change in `runtimes/sky-adapter/entry.mjs`, and source-offer static emission in `frontend/vite.config.mjs`. Starting committed HEAD2093f062; reviewed current uncommitted patch. This reviewer did not author these files/changes. The separate three toolchain files authored by this reviewer are explicitly excluded from this independent review.

## Disposition

No remaining concrete blocker found in reviewed scope before the planned clean qualification. This is source/runner review, not proof that reconstruction already passed.

Two corrections were communicated and are now present in current source:

- Removed the runner's `HOME=/tmp` override, complying with developer instruction not to repurpose HOME. Explicit npm_config_cache=/tmp/npm-cache already isolates dependency cache.
- Packaging now requires expected Hub output/index.html before preparing an archive. Previously inventory(nonexistent-path) silently returned an empty list; the guard prevents accidentally preparing a candidate without a real expected Hub build.

## Checked contracts

- Packaging reads immutable committed blobs from exact full source revision and pinned upstream023e3b26. It stages native source, applies the pinned overlay/native patch exactly once, and integrates archived Hub adapter/material/site/artwork inputs. Reconstruction itself has no Git operation or external source-checkout requirement.
- Source filtering includes the lock-hashed .env.production overlay exception and THIRD_PARTY_NOTICES. Owner .env files, node_modules, generated Sky runtime payload, large runtime-pack root and owner outputs are excluded. Symlinks/unsafe Git archive paths are rejected. Deterministic archive metadata and complete input path/size/SHA/executable inventory are recorded.
- Runner validates the complete extracted-source inventory before any build. Output must be fresh and outside the extraction. Acquire/native build commands consume only packaged scripts, downloaded SCons build context and the extracted native tree. The native compile uses the prepatched tree at/app, linux/amd64 and network none; it does not invoke old Git-dependent build_sky_horizon.sh or reapply its patch.
- Native expected keys are bare stellarium-web-engine.js/.wasm filenames, so runner's native/build lookup and later app/src/assets/js copy paths are correct. Exact native SHA equality is mandatory before Vue build.
- Fresh Sky and Hub npm ci operations use included lockfiles and no owner node_modules/cache mount. Install scripts are disabled and registry/cache/retry bounds explicit. Compile stages have network disabled. Existing official image digest caches are identified inputs; no host dependency cache is admitted.
- Current lock has111 Sky artifact rows, including one identity marker. Comparison excludes only oras-runtime-build.json and requires exact path+SHA equality for the110 generated payload files. Hub compilation gets the archive source revision, consumes reconstructed Sky payload plus archived identity marker, and requires exact full Hub path+SHA equality against its expected build. A failed build/comparison cannot produce reconstruction.json PASS. Original archived input content hashes are checked after compilation.
- Full module graph emitted by Vite for external Sky bridge is present: entry/native-panels, protocol endpoint/index/workspace/navigation and continued-input. Relative module imports resolve to included/emitted source files; no additional owner runtime paths are required.
- Legal anchor is independent of native scene readiness, uses a44px minimum interaction height, normal anchor keyboard behavior and noopener/noreferrer. Including it in nativeControl preserves ordinary Tab behavior and focus reporting. Cleanup removes it. No propagation/time/source-selection/scientific rendering logic changed.
- Static source-offer HTML is explicitly emitted with build revision injection. Without a valid bound revision/descriptor/runtime identity it displays unavailable; it does not claim publication by default. Archive descriptor/retrieval hosting remains separately qualified by parent.

## Commands/results

`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/validation -p test_source_package.py -v`:4 tests PASS,0.004s. Tests cover overlay inclusion, source/artwork boundaries, deterministic archive/tamper detection and symlink rejection.

Python AST parsing of both runners passed. Lock inspection found204 Hub package records and1,442 Sky records; every resolved package uses https://registry.npmjs.org/ and has integrity. `git diff --check -- frontend/vite.config.mjs runtimes/sky-adapter/entry.mjs`:no output, exit0. Re-read current runner/package source after parent corrections confirmed HOME override absent and expected-Hub index.html guard present.

No build, image creation, container run, package installation, full suite, repository edit, commit or push was performed during this independent review. Only this /tmp report was authored. Clean archive reconstruction, exact served identity/retrieval/browser proof and licensing determination remain external to this review. Parent should report actual build outcome and independent toolchain review separately.
