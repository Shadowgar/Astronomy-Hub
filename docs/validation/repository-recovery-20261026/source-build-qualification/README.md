# Source/build qualification — PR #107

**Archive-only Sky/Hub reconstruction: PASS. Source offer in isolated preview:
PASS. Public source delivery / legal qualification: NOT COMPLETE.**

Source revision: `f7cb702c428980ce2b32539dbc74fc2b35082c12` on existing
`recovery/reconcile-20261026`. Starting head was verified clean at
`2093f06296d58f5030282b9663ef529a042b01d5`; remote main remained `9a03d826…`.
The final PR publishing receipt records the pushed head containing these
source changes and evidence. Later documentation/CI does not change the
qualified application inputs.

## Distribution candidate and complete manifest

* Archive: `output/source-qualification/candidate-f7cb702c/astronomy-hub-source-f7cb702c428980ce2b32539dbc74fc2b35082c12.tar.gz`
* Size: **23,639,435 bytes**; **1,563 source inputs**, plus root source manifest.
* SHA-256: **`7cf5cf444b35c02f05aeebd555e4a0142fc52c666161d14bea4981de9ebf3fde`**.
* [Complete path/size/SHA/mode manifest and expected outputs](SOURCE_MANIFEST.json.gz).
  Uncompressed original is `candidate-f7cb702c/source/source-manifest.json`.
* [Distribution descriptor](receipts/source-offer-manifest.json),
  [package receipt](receipts/package.json),
  [independent actual archive audit](receipts/pr107-source-final-f7-archive-audit.json).

The archive is deterministic, version-named, hash-bound, non-overwriting and
read-only locally. It is **not published** or remotely backed up as a Release
asset. The private preview distribution was an alias to that exact archive,
not a placeholder download. Public archival retention remains a release action.

The package includes full prepatched native Stellarium/Vue source,29 overlays,
native builder specifications, connected Hub/backend/frontend source,
runtime bridge/protocol, material/site configuration, migrations, original
artwork, small application images/fonts/SVGs, lockfiles and existing notices.
It excludes owner environment/settings, caches/node_modules, generated native
outputs, mounted catalogs/HiPS/TLE/kernel/lunar packs and database/user data.
Committed compatibility catalogs and bounded test fixtures remain source/build
inputs with their separate provenance/rights; this is not a blanket statement
that the archive contains no astronomy records.

Independent inspection verified every manifest hash/size/mode, safe regular
paths, no links/duplicates or owner/cache/bulk inputs, and exact Hub bytes at
the source commit. Of the prior567 attested inputs, **565 match exactly** and
only the two regenerable native JS/WASM outputs are absent as intended.
No native scientific source changed.

## Actual archive-only reconstruction

The final archive was SHA-verified and extracted into a fresh directory with
no Git metadata. Its own runner built without accessing the owner checkout,
hidden worktrees, existing node_modules or host npm caches. Docker bind arrays
in the receipt point only into this extraction. The reconstructed outputs were
not promoted into protected runtime directories.

| Input/stage | Observed result |
| --- | --- |
| Native toolchain | Fresh `--no-cache` image from official pinned Emscripten1.39.17 digest plus official SCons3.0.1-2 Debian package,537,980bytes, verified SHA `9c0c7be3…e068`; no apt dependency drift |
| Native compiler | Network disabled; fresh objects from archived prepatched source; exact JS and WASM hashes below |
| Vue/Hub dependencies | Two fresh npm ci installations; exact integrity-bearing lockfiles, official npm registry, install scripts disabled, isolated ephemeral npm caches |
| Vue/Hub compile | Network disabled; fixed qualified `/work` Vue build root; no output normalization |
| Native outputs | **2/2 match** protected expected hashes |
| Sky compiled payload | **110/110 paths and SHA-256 match** qualified payload, including vendor/WASM/CSS/assets |
| Hub candidate output | **144/144 paths and SHA-256 match** the recorded legal/source-offer candidate build |
| Original archived inputs | **1,563/1,563 unchanged** after complete qualification |

Native JS SHA `0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7`;
WASM SHA `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942`.
The fresh builder image ID is `sha256:4215272551374a053158e7f3a595cead3df7c354fb06419ecf4b3651af04e963`;
its different identity from the historical workstation builder is expected.
Output hashes, not an unidentified local image, establish reproduction.

The Hub intentionally differs from the old2093f062 Hub because the owner
authorized a new source-offer UI. It matches its source-revision-bound candidate
reference exactly. Earth/Planet runtime artifacts and external SDK dependencies
are preserved, not freshly rebuilt by this Sky/Hub qualification; no broader
binary-reproduction claim is made.

[Machine PASS receipt](receipts/reconstruction.json),
[exact reconstruction commands](receipts/reconstruction-commands.json),
[archive-only instructions](../../../../scripts/source-distribution/README.md).

### Failures investigated, not hidden

* Initial34186454 preflight rejected one Python-generated `__pycache__` file.
  No source bytes changed and no build ran. The runner now disables bytecode;
  a regression exercises import without adding cache files.
* Fresh87c61fdc native output matched, but Vue output embedded a different
  container module path. The recipe now documents/fixes the historical `/work`
  path. Diagnostic string normalization was used only to identify the cause;
  it was never used to produce or qualify release artifacts.
* At `/work`, f44deb28 still differed only in Vue loader identifiers. npm10
  rewrites auxiliary yarn.lock during npm ci; Vue hashes that file. The final
  runner restores the exact prevalidated archive Yarn input, records both
  digests and rejects any change to authoritative npm package-lock.json.
  A diagnostic raw rebuild then matched all110files; finalf7cb702c repeated the
  entire qualification from a fresh extraction and passed all stages.
* A source-offer browser harness asserted focus before the existing
  requestAnimationFrame restoration completed. Its failed receipt is retained;
  a deterministic focus-condition wait passed. No application change hid it.

All failed attempt logs and difference diagnostics are retained compressed.
The final complete clean qualification is the sole PASS authority. Existing
native compiler-image platform warning, legacy dependency deprecations and
Webpack/Vite size warnings remain visible; this is not warning-clean R4 or
dependency-security qualification.

## Source-offer implementation and retrieval proof

The existing Hub About & Licenses experience now replaces historical N1 download
claims with a validated sidecar descriptor. It shows source revision, archive
SHA/size/location, applicable license links and explicit unpublished/public-HTTPS
limits. The descriptor must match both compiled `VITE_SOURCE_REVISION` and
served Sky/native-WASM metadata. Missing, malformed or stale identity fails
closed with no archive link. The digest is external to its archive, avoiding
a self-referential hash.

The source-controlled external Sky bridge adds a discoverable44px
**Source code & licenses** link in the standalone frame, available independently
of native startup. It opens a same-origin legal/source page with AGPL text,
Stellarium attribution, Hub MIT notice, no-warranty wording and the same
source/runtime identity checks. Its keyboard handling recognizes this link.
No native/Vue compiled payload or scientific renderer was changed for the link;
only the external legal bridge and its identity metadata changed.

An isolated internal-only Docker nginx preview served the **rebuilt** Hub/Sky,
read-only distribution and read-only existing Sky data. No production endpoint
was replaced. Actual checks:

* Unauthenticated **private HTTP** retrieval returned200 and all23,639,435bytes;
  SHA exactly matches the descriptor/archive.
* All **144 actual served files** match the reconstruction's expected SHA set.
* Desktop1440×900 and portrait390×900: Hub menu→About source data; keyboard or
  real emulated touch archive activation; Escape returns focus to launcher.
* Standalone native source link:44px target, keyboard/touch opens actual legal
  page; matching revision, digest and download location observed. Both layouts
  have zero page errors. Existing inline Hub link styling is retained; no claim
  that every inline text link has a44px target is made.
* Controlled503 manifest: both Hub and standalone page expose no download.

[Browser proof](receipts/browser-offer-proof.json),
[served hashes and negative checks](served-identity-and-negative.json.gz).
Screenshots remain under `output/playwright/source-qualification/`.

**Anonymous public HTTPS retrieval was not tested.** Publication is unauthorized
in this assignment. The archive/descriptor still need an approved immutable
public location, actual release-serving configuration and anonymous HTTPS/hash
and deployed-version checks. Default builds without an explicit source revision
or verified descriptor remain unqualified rather than advertising a mismatched
download. This candidate preview does not establish a live public source offer.

## Independent reviews and focused tests

Separate non-author reviewers inspected package/runner, toolchain acquisition,
source UI, final auxiliary-lock correction and the actual final archive.
Confirmed review issues were repaired: missing runtime identity accepted by the
standalone page, omitted third-party/migration source, owner-env filtering that
also excluded a required public overlay config, and the build recipe issues
above. Final independent reviews report no remaining confirmed defect in those
technical changes; they do not assert legal/release approval.

* Source offer/UI/fallback: **32 tests pass**, typecheck passes.
* Package/runner: **6 tests pass**, including deterministic archive, tamper/link
  rejection, complete overlay admission and source-lock/cache preservation.
* Actual standalone script negative/control proof: **6 pass**.
* Bounded acquisition harness: **12 pass**; real official package acquisition
  matched declared size/hash.
* Focused native bridge/lifecycle/artifact contracts: **3 pass**.
* Full scientific/satellite/125-commit browser suites were deliberately not
  rerun. Prior qualified science evidence is reused only for unchanged inputs.

Exact commands: [COMMANDS.md](COMMANDS.md). Independent reports and test harnesses
are under `receipts/`. This is a source/build qualification, not a fresh
repository-wide integration/security review.

## Preservation, remaining gates and recommendation

Git/source and hash checks establish unchanged native science, satellite
propagation/source data, Earth/Planet runtime source and imagery, lunar/JPL
orientation/ephemerides and planetary-system packs. Existing owner settings and
legacy catalog match prior exact hashes. No database or scientific source pack
was mounted writable by the build/preview. All143 original container IDs and90
volume names match before/after; only the one new preview/container network was
removed. New identified builder images/ignored qualification outputs remain.
An additional518existing Earth artifact/lunar orientation/lunar image/DE442s
files match their recorded SHA values; the compressed hash receipt is retained.
This is not a forensic byte snapshot of every Docker database/volume.
[Preservation receipt](receipts/preservation.json).

Remaining source/legal determinations are explicit in the archived
[licensing boundary inventory](../../../../scripts/source-distribution/LICENSING_BOUNDARIES.md):
AGPL combined-work/source scope; pinned upstream inih LICENSE.txt and WebP
COPYING/PATENTS/AUTHORS absent from that source tree; matching Roboto/Noto font
notices/grants not established. Existing inline/embedded notices are retained;
generic licenses or font names were not substituted as permission. Bundled
NASA/artwork/catalog/fixture rights remain distinct from code licenses. External
Earth SDK/module source is pinned separately; fresh Earth/Planet reconstruction
and their complete dependency/source qualification are not claimed here.

**Recommendation:** the engineering source/build result can advance to
owner/device acceptance. **Integration/release remains blocked** pending approved
public source publication/retrieval and applicable legal/source boundaries,
plus the existing physical Windows/mobile and owner product acceptance gates.
No production-ready claim, merge, deployment, new branch/PR or branch deletion.
Stop source/build expansion here; do not start the next UX/device phase in this
assignment.

Loaded context: existing root/frontend/backend instructions, CORE_CONTEXT,
LIVE_SESSION_BRIEF and manifest review/frontend/validation constraints loaded in
this conversation; current recovery/integration reports; the explicitly requested
source-offer audit/OPEN_SOURCE_READINESS and source/build recipes. No runtime
override or broad `/docs` content scan. Older task stop points were superseded
only by this owner's explicit source/build request.
