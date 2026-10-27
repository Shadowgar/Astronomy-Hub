# Archive-only reconstruction

This candidate supplies prepatched native Stellarium source plus the connected
Hub source/build context, bridge, overlays, original artwork, locks and notices.
It excludes generated binaries, node_modules, owner secrets/settings, mounted
science/provider data, and user/database data. Full per-file path/size/SHA/mode
inventory and expected output hashes are in `source-manifest.json` at archive root.
The inventory excludes only that manifest itself; the external archive digest
binds the manifest too. An offer descriptor is generated after the archive and
is deliberately outside it, avoiding self-referential digests.

Requirements: Linux amd64, Python3, Docker with network access to official image
registries for the explicitly pinned images, HTTPS archive.debian.org for one
SCons package, and registry.npmjs.org for dependencies. Adequate disk/RAM for two
fresh npm installations and native compilation are required. No Git checkout,
owner worktree, preinstalled node_modules or host npm cache is used to rebuild.

Verify the separately supplied archive SHA-256 before extraction. Extract into
a fresh directory. From the extracted `astronomy-hub-source` directory:

```sh
docker pull --platform linux/amd64 emscripten/emsdk@sha256:1e264934c11ffde8511441eaed6bdc44eaa30ec027e46d38be7ae67106aefdab
docker pull --platform linux/amd64 node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0
python3 -B hub/scripts/source-distribution/reconstruct.py --root "$PWD" --output /absolute/fresh/reconstruction-results
```

The script first validates every archived input, acquires/verifies only the
537,980byte SCons Debian package using the exact official URL/SHA in toolchain.json,
then creates a fresh native image from the pinned Emscripten1.39.17 image with
`--no-cache --network none`. It installs SCons3.0.1-2 using dpkg, with no mutable
apt repository. Official base-image toolchain caches are identified by immutable
image digest; no unidentified host cache is mounted. It runs `make js-es6` on
the already patched tree; do not reapply the horizon patch.

Both npm installations are fresh `npm ci --ignore-scripts`, with exact lockfile
integrity, registry.npmjs.org, no audit/fund calls, one fetch retry and60second
fetch timeout. Each has its own ephemeral container `/tmp` cache. Install scripts
are disabled so they cannot fetch undocumented binaries. Build stages run with
network disabled. Only the extracted tree is bind-mounted. Node20 is immutable
by image digest and platform. Every Docker argument and stdout/stderr log is
retained under the requested results directory.

Vue builds use the fixed in-container root `/work`, matching the qualified
release. Webpack4 unminified Babel helper names and vue-loader cache identifiers
encode absolute module/config paths; changing that root changes the app bundle
bytes and filename even with identical source/dependencies. This fixed build
path is part of the recipe. Outputs are compared unchanged, never normalized.
npm10 also rewrites the auxiliary `yarn.lock` during `npm ci`. Vue CLI includes
that file in its loader cache identifiers. The runner retains/restores the exact
archived Yarn input immediately after installation, recording before/after SHA;
it rejects any change to npm's authoritative package-lock.json. Dependency
resolution remains governed by that unchanged npm lock/integrity. Restoring a
source input is not normalizing generated binaries. Every original source hash
is rechecked at the end of the qualification.

The native JS/WASM must match the recorded expected hashes, every Sky Vue output
must match the qualified110-file payload set, and the Hub build must match its
candidate expected file set/hashes. Hub builds set `VITE_SOURCE_REVISION` from the
archive manifest; this binds the offer to that exact archived source commit.
The unchanged runtime marker is version metadata, not a supplied binary shortcut.
Original archived source hashes must remain unchanged after compilation.

Rebuilt Sky output lives at `stellarium/apps/web-frontend/dist`; rebuilt Hub at
`hub/frontend/dist`. These are qualification outputs only. The script does not
promote, publish, deploy, overwrite owner artifacts or touch production volumes.
Earth/Planet source, dependency pins and build scripts are included, but their
separately qualified external SDK/artifacts and mounted science data are not
reconstructed by this Sky/Hub qualification. No Earth/Planet binary-rebuild or
external-data redistribution claim is made.

Retained licenses do not settle AGPL combined-work scope or separately licensed
imagery/data rights. Missing original upstream notices/provenance must remain
identified for external review. A successful deterministic build is not legal
compliance, public anonymous retrieval, physical-device or owner acceptance.
