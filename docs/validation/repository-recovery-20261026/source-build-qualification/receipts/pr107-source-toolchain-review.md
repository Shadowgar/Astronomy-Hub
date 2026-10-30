# PR107 source/toolchain qualification subtask

Starting branch `recovery/reconcile-20261026`, HEAD `2093f06296d58f5030282b9663ef529a042b01d5`, clean when inspected. Explicit task: source/build qualification only. No prior integration, Moon, observer or satellite investigation reopened. Read owner attachment Pasted text.txt; existing loaded repository/context rules continue. Read native recipe, Dockerfile, renderer lock, overlay/adapter scripts, current clean-sky source/attestation and old source archive. Prior memory was used only to locate historical source-gate evidence, not as current execution state.

## Key findings and selected path

1. Old source candidate is10,577,239 bytes/858 entries. `hub-build-context` contains only seven files. Its reconstructed `stellarium-modified` tree already has the authorized native landscape patch and current star overlay: landscape SHA `fe67ef1bbf919fbc77523a96f6d276bae63cfb4013b468b9777b9d434ba43fa9`; stars SHA `6c80e56d50123dc40256b6d55f26567db555ddb0949b57a74c4e9d876dba7042`.
2. Existing `scripts/runtime/build_sky_horizon.sh` cannot be the archive-only entry point: it resolves an external Git checkout at anchor023e3b26, requires an existing local builder image by ID, archives upstream, reapplies the native patch, mounts original node_modules, and calls an attester that runs Git. Do not run it against a prepatched archive or reapply the patch. Keep it as historical provenance; new archive instructions must operate on the included tree directly.
3. The prepatched tree's exact native command is `source /emsdk/emsdk_env.sh && make js-es6`, executed from `/app` in linux/amd64. `make js` from upstream README is insufficient for the qualified ES6 wrapper. Root Makefile/SConstruct, all native src/ext_src/tools/data inputs and executable tools/make-assets.py are required. tools/make-assets.py uses Python3/zlib and generates native asset include files. Remove prior build objects and .sconsign.dblite from a clean source package. Preserve included source bytes; no native edits to obtain a match.
4. Existing native builder image history is consistent with the repository Dockerfile but it uses mutable `FROM emscripten/emsdk:1.39.17` and unpinned archived apt installation. Fresh build should use the lock-pinned official base plus only the exact SCons package. The official base history already installs Python, Python3, build-essential, make and wget. The SCons package requires only `python:any`. A clean Docker build must confirm those assumptions; this subtask did not create any Docker resources.

## Independently retrieved official inputs

Read-only requests; Docker auth token was not printed or persisted.

- Official Emsdk manifest: `https://registry-1.docker.io/v2/emscripten/emsdk/manifests/sha256:1e264934c11ffde8511441eaed6bdc44eaa30ec027e46d38be7ae67106aefdab`. SHA256 of response bytes matches the requested manifest digest exactly. Schema2, eight layers, linux/amd64, created2020-06-09. Config blob digest verified `sha256:ebe9fb0f1f2b2c8bc6a4e2539fe9ab367c0d8af43dc4334646534a54b43e96b9`.
- Official Debian buster package index: `https://archive.debian.org/debian/dists/buster/main/binary-amd64/Packages.xz`,7,909,256 bytes, SHA256 `62e908201deef3b8e0a7da2e770925b31c8a54a8d22fad7cc058034978859a35`. Reports SCons3.0.1-2. Index was retrieved over HTTPS; no separate Debian signature-validation claim is made.
- Official SCons package: `https://archive.debian.org/debian/pool/main/s/scons/scons_3.0.1-2_all.deb`,537,980 bytes, SHA256 `9c0c7be3025255466852cdc4a303b858fd4cd08f0401cf33046fb4502c25e068`. Acquired bytes match the official index hash. Package control confirms version3.0.1-2, architecture all, dependency python:any.
- Official Node manifest: `https://registry-1.docker.io/v2/library/node/manifests/sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0`. Response SHA matches lock digest; it is an OCI multi-platform index, so explicitly select linux/amd64 during reconstruction.

## Implemented within delegated authority

Only these three repository files were authored:

- `scripts/source-distribution/Native.Dockerfile`: exact official Emsdk base; COPY verified scons.deb; recheck SHA; dpkg -i; no apt calls; WORKDIR/app.
- `scripts/source-distribution/toolchain.json`: image, architecture, native command and expected outputs; Node image/build environment; exact official SCons URL/hash/size.
- `scripts/source-distribution/acquire_toolchain.py`: `--output-dir DIR`; official Debian HTTPS only, redirects constrained to the same official HTTPS host, socket20s/transfer60s checks, size limit, SHA verification, cleanup on failure, atomic no-overwrite publication, explicit existing-file verification, no hidden cache or installation. Existing wrong files/symlinks are preserved and rejected.

Parent owns packaging/build orchestration and independent reviewer assignment. No commit/push or Docker mutation was performed here.

## Archive-only reconstruction handoff

From extracted package only:

1. Verify complete source manifest. Native tree is already patched, so do not invoke existing Git-dependent reconstruction or reapply overlay/patch. Include all overlay inputs, runtime adapter/materials, site JSON, original landscape source+tiles and metadata, native builder specs, dependency locks and third-party notices in the corresponding source context.
2. Run packaged acquire_toolchain.py into an explicit fresh build-context directory. Copy Native.Dockerfile there. Build a fresh task native image from that context with linux/amd64; no original checkout/node_modules/cache mounts. This establishes known base+package provenance even though its local image ID will differ from the historical builder ID.
3. Run native compilation from the package's prepatched source mounted at/app, network disabled. Compare exact outputs below before copying them into app/src/assets/js. Missing/corrupt output is failure; do not promote native outputs on mismatch.
4. Using pinned Node20 image/linux-amd64, run npm ci against included app package-lock.json into a clean task directory/cache with documented network acquisition. Lockfile version3 contains1,442 package records; every resolved package uses registry.npmjs.org and has integrity. No owner node_modules or cache mount. Then compile with network disabled and the documented ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/, ORAS_RUNTIME_COPY_SKYDATA=0 and NODE_OPTIONS=--openssl-legacy-provider --max-old-space-size=4096. Preserve historical container paths and build environment when comparing deterministic bundle bytes.
5. Compare the actual application dist files against the recorded release file manifest, excluding only explicitly defined identity metadata. Do not treat old lock artifact lists as proof of current served source identity without comparing the actual release manifest. Build source offer after archive identity is established.

Expected native SHA256:

```
0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7  build/stellarium-web-engine.js
d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942  build/stellarium-web-engine.wasm
```

## Verification performed

- Initial `git status --short` empty; HEAD exact2093f062.
- Read-only `docker image inspect` and `docker history` identify existing builder166dc236...; initial inspect using removed Parent field failed, corrected inspect succeeded. No image pull/build/run/create/remove was done.
- `/tmp/test_pr107_acquire_toolchain.py`: initial RED (module absent), GREEN9. Added truncation, redirect and concurrent-output preservation checks; RED1, GREEN12. Final command `PYTHONDONTWRITEBYTECODE=1 python3 /tmp/test_pr107_acquire_toolchain.py`:12 tests passed,0.013s.
- `PYTHONDONTWRITEBYTECODE=1 python3 scripts/source-distribution/acquire_toolchain.py --output-dir /tmp/pr107-source-acquire-toolchain-20261027`: exit0, ACQUIRED scons.deb with pinned SHA and537,980 bytes. Independent sha256sum matched. This is actual helper/acquisition evidence, not a builder reconstruction pass.
- `git diff --check -- scripts/source-distribution`: no output, exit0.

Remaining gates: clean native builder installation, archive-only native/app reconstruction, byte comparison, complete package/source-offer proof and independent review. No legal-compliance or production-readiness claim; separately licensed science/imagery stays distinct from source delivery.
