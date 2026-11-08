# Source/build qualification commands

Workdir `.worktrees/repository-recovery-20261026`. This is replay evidence, not
authorization to publish/deploy. Exact Docker args and per-stage stdout/stderr
are retained under receipts; the archive's runner contains no owner-worktree
fallback. The final source commit is f7cb702c428980ce2b32539dbc74fc2b35082c12.

## Identity/context/inspection

```sh
git status --short
git branch --show-current
git rev-parse HEAD
git ls-remote origin refs/heads/main refs/heads/recovery/reconcile-20261026
```

Initial clean HEAD2093f062; main9a03d826; existing recovery branch. Read current
root/scoped instructions and CORE/LIVE/manifest context, prior integration
source/build evidence and explicit source-offer audit/OPEN_SOURCE_READINESS.
Source inspection used scoped rg/cat/nl, Git blobs, JSON/tar/font-header/SHA
inspection; no broad docs-content scan or repeated integration/satellite audit.

## Focused checks and independent review

```sh
python3 -B -m unittest discover -s tests/validation -p test_source_package.py -v
node /tmp/pr107-source-offer-static-proof.mjs frontend/public/licenses/source-offer.html
node --test tests/runtime/sky-artifact.test.mjs tests/runtime/sky-native-controls.test.mjs tests/runtime/sky-page-lifecycle.test.mjs
(cd frontend && npm test -- --run tests/sourceOffer.test.ts tests/aboutLicenses.test.tsx tests/orasRuntimeSpaFallback.test.js)
(cd frontend && npm run typecheck)
python3 /tmp/test_pr107_acquire_toolchain.py
python3 scripts/source-distribution/acquire_toolchain.py --output-dir output/source-qualification/native-toolchain-download
```

Final counts:6package/runner,6standalone-script,3bridge/artifact/lifecycle,
32frontend,12acquisition harness; typecheck exit0. Real official SCons acquisition
matched537,980bytes and SHA9c0c7be3…e068. Independent reports/harnesses are copied
under receipts. Earlier red absence tests, missing-runtime guard and packaging
omission findings are preserved, not retroactively relabeled.

## Candidate reference, package, extraction and reconstruction

```sh
VITE_SOURCE_REVISION=f7cb702c428980ce2b32539dbc74fc2b35082c12 npm --prefix frontend run build -- --outDir ../output/source-qualification/expected-hub-f7cb702c
python3 -B scripts/source-distribution/package_source.py --revision f7cb702c428980ce2b32539dbc74fc2b35082c12 --upstream-repo /var/tmp/oras-phase-c/sky-reconstruction/upstream --expected-hub output/source-qualification/expected-hub-f7cb702c --output output/source-qualification/candidate-f7cb702c
```

Preparation reads the exact pinned upstream Git archive and exact committed Hub
blobs, applies29 hashed overlays/one authorized patch and integrates existing
bridge/material/artwork inputs into a prepatched tree. No existing dependency
tree or compiled native output enters the package. Owner Git is needed for
preparation, **not reconstruction**. Root source manifest binds1,563inputfiles,
expected native output, all111Sky rows (110payload+metadata) and144Hub files.

SHA verification/extraction used Python hashlib and
`tarfile.open(archive).extractall(fresh_directory,filter='data')`; no Git tree or
node_modules was included. Actual final qualification command:

```sh
python3 -B output/source-qualification/extracted-f7cb702c/astronomy-hub-source/hub/scripts/source-distribution/reconstruct.py --root output/source-qualification/extracted-f7cb702c/astronomy-hub-source --output output/source-qualification/reconstruction-f7cb702c
```

Exit0, `reconstruction.json.status=PASS`:2native hashes,110Sky files,144Hub files,
1,563unchangedsourceinputs. Exact invoked Docker arrays in
`receipts/reconstruction-commands.json`. Fresh builder --no-cache/networknone,
one pinned official .deb, two fresh npmci installs with scriptsdisabled/
HTTPSregistry/onefetchretry/60sfetchtimeout, compile networknone. Emsdk and Node
official registry digests/platform were independently verified, then used as
immutable image inputs. No hidden host cache/node_modules mount.

Earlier retained attempts:341 preflight Python bytecode mismatch;87 fresh native
PASS/Vue path+cache identifier mismatch;f44 fresh native PASS/Vue auxiliary lock
mismatch. The complete differences were investigated. A diagnostic raw Vue build
after restoring the exact archived Yarn input passed110files. Finalf7 repeats
all stages fresh, with fixed /work path and documented source-lock preservation.
No output bytes were normalized/patched/promoted to make a comparison pass.

## Offer descriptor, actual retrieval and browser

The post-archive sidecar was assembled from package receipt plus unchanged
Sky/native hashes, immutable revision-named relative archive URL, license paths
and explicit candidate/legal/publication limits. It is outside the archive to
avoid digest recursion. `distribution-f7cb702c/` holds a read-only hardlink to
the exact prepared archive plus manifest.json. It is not publicly published.

```sh
python3 /tmp/pr107-source-preview.py
node /tmp/pr107-source-browser.mjs
node /tmp/pr107-source-negative.mjs
```

The scripts are retained under receipts. One new nginx preview used an
internal-only task network with verified unused10.254.108.0/28, no host port,
no production/DB backend and read-only rebuiltHub/archive/Skydata binds. It was
read at http://10.254.108.2:8879. Source-only API503s were deliberate; this is
not scientific provider/runtime readiness evidence.

Anonymous private HTTP archive response200,23,639,435bytes,SHA exact. Actual
served144file hashes match reference. Desktop1440×900/portrait390×900 source
journeys PASS: About offer revision/digest, keyboard/touch download activation,
Escape focus return, standalone native44px source link and real legal page.
Zero page errors. Two controlled503offer-negative checks PASS, no download.
An initial immediate-focus assertion failed before animation-frame restoration;
the corrected condition wait passed, no product code was changed to hide it.
No public anonymous HTTPS, real public deployment, physical GPU/device or source
publication test was run. These remain explicit gates.

## Preservation and publishing the code/evidence only

```sh
git diff --name-only 2093f062 -- runtimes/earth-runtime runtimes/planet-runtime integrations/sky-overlay vendor backend frontend/public/oras-sky-engine/js frontend/public/oras-sky-engine/css data
docker rm -f pr107-source-preview
docker network rm pr107-source-qualification
git diff --check
git status --short
git log --oneline -5
```

Protected source/generated paths produce no diff. External legal bridge and its
identity metadata change intentionally; native science/WASM/Vue payloads do not.
Read-only hash checks verify518existing Earth/lunar/image/JPL files, original
owner settings/legacycatalog/nativeWASM,143container IDs and90volume names.
Only task preview resources were removed; new identified builder images remain.
No forensic claim about every database byte, no existing container restart,
no production/data/volume mutation, branch deletion, new PR or deployment.

Local code commits ca426c9d→34186454→87c61fdc→f44deb28→f7cb702c retain recipe fixes
and failed-attempt provenance. Push and PR107 update use the existing branch;
the final immutable publishing SHA and hosted results are recorded in the PR
receipt. No archive Release asset or live public link was published/replaced.
