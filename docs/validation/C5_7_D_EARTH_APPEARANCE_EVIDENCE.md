# C5.7-D Earth appearance — local qualification and owner-review handoff

Owner authorization: 2026-10-10, visual-first roadmap and C5.7-D only; mandatory
$0 provider spending. Default Mode, SINGLE AGENT. Base:
`eea3e295ed5d234edae9053b3119f61e15e8371b` (merged PR #68); isolated branch
`c5-7-d-earth-appearance-1`. No merge, C6 implementation or production deployment.

## Context and authority

Loaded CORE/LIVE first, then the union of `docs_change`, `planning`,
`frontend_change`, `validation`, `review`: 57 unique documents plus manifest.
Exact original paths/raw-byte hashes are in
`/tmp/c5-7-d-earth-appearance-20261010/loaded-context.json`.
No extra governing documents or broad docs scan. This newly authored evidence is
now registered in those five packs. The original PR #68 proposals/audits remain
unchanged; execution controls now record D → C6-0/1 → C6-2 → C6-3 → C6-4/5 →
preserved A/PR #67 → separately approved satellites/Weather. Only D is activated.
OD4 is approved only for existing SDK assets/configuration; five other decision
rows and outstanding C5.7 qualification remain open. ion Community requires
written club/public-use eligibility and zero-charge protection.

## Source inspection and bounded implementation

Inspected Hub `runtimes/earth-runtime/core/ViewerController.mjs`, pinned God's Eye
`src/app/viewer.js` and `src/app/atmosphereCompat.js`, and installed Cesium1.138.0
`SkyBox.js`, `SkyAtmosphere.js`, `Resource.js`, `CesiumWidget.js` and bundled faces.
God's Eye remains clean at `e7707d9a0f34d9fbffc300023c319f95caa5be30`.

Replaced the permanently disabled standard skybox with guarded SDK texture
loading, retaining Cesium's existing skybox/Sun/Moon and six Tycho texture faces.
Public `Resource.fetchImage` loads the existing images before enabling the box,
then requests a render. Loading failure leaves the dark background and accessible
unavailable status; Earth continues rendering. Destroy cancels resource requests
and the existing Viewer destroys its cube map/atmosphere. No custom star renderer.
The missing-face RED stopped the default render loop and displayed one Cesium
error panel; GREEN retained the loop, disabled failed stars and showed no panel.

Trial/retained atmosphere: intensity18, saturation−0.12, brightness−0.08, versus
Cesium defaults50/0/0. Matching orbital screenshots show a less bright halo.
Ground atmosphere, Sun lighting, camera/controller limits, request-render mode,
imagery, ellipsoid terrain, layers, bridge, SWE and dependencies remain unchanged.
Only ViewerController is a changed renderer input. Apple model-atmosphere shader
workaround was not implemented: no demonstrated need in this no-3D/software test;
physical Apple/Metal qualification is still follow-up.

## Actual visual proof and owner preview

Full Hub preview: <http://127.0.0.1:4190/earth?date=2026-10-10T17%3A00%3A00Z>.
Open Earth, change time for night, orbit/zoom normally; existing imagery may use
its labeled fallback. Run only on the owner's local machine/WSL forwarding.
Comparison gallery:
<http://127.0.0.1:4192/@fs/hub/output/playwright/c57d/index.html>.
Screenshots and state JSON live in the isolated checkout's
`output/playwright/c57d/`: `{baseline,star-only,proposed}-{day,terminator,night,horizon}.png`,
matching JSON and `runtime-{desktop,mobile}.png`. No generated/manufactured images.

The Docker visual harness imports the actual Hub controller, with exact baseline
controller bytes from merged main. Both variants use the same existing bundled
Natural Earth fallback and ellipsoid, avoiding provider variation during comparison.
It is controlled source/browser proof; full-product artifact proof is separate.
Scene date2026-10-10; lon−79.585394°, lat41.321903°; full Earth height15,621,863m,
heading0°, pitch−90°, roll0°. Day17:00UTC, terminator23:00UTC, night05:00UTC.
Horizon17:00UTC: height500,000m, pitch−15°. Actual Cartesian/camera/UTC/renderer
settings, selected imagery, source hash and every network request are captured in
JSON. `star-only` retains Cesium defaults for atmosphere; proposed uses18/−.12/−.08.
Pixel proof records actual star pixels in the background and day/night luminance
differences. These are decorative standard stars, not scientific positions.
No photoreal imagery/terrain improvement is claimed.

Commands (repository-relative unless a path is shown):

```sh
python3 scripts/validation/earth-appearance/prepare.py /tmp/c57d-proof-review
node scripts/validation/earth-appearance/capture.mjs baseline
node scripts/validation/earth-appearance/capture.mjs star-only
node scripts/validation/earth-appearance/capture.mjs proposed
```

The harness Docker command/mounts are in
`scripts/validation/earth-appearance/README.md`; this run's prepared harness is
`/tmp/c5-7-d-earth-appearance-20261010/proof`. Baseline intentionally exits1 on
the disabled skybox assertion after capturing the views. Proposed passes four
scenes, six loaded faces, zero page/asset errors and five actual Viewer/cube-map/
SkyAtmosphere destruction cycles; repeated destroy leaves0canvases.

## Final build, installed/served identity and rollback

Final Earth: `822b1baeb933636cc5570077e905b57a029ea003902173b48142e0bbaf8fa552`,
512 files; source inputs `0bae2e8d50e2199d7d3dfd99e46611405bd6ba5b447e95b2df7097e41d0630a9`.
Controller SHA256 `0f0756a7422554b203800324e291aca105d877c497f282ceec8677e4d9acf028`.
Two successful sequential builds `final-c`/`final-d` reproduce identical release
manifests and bytes. Established builder, Cesium1.138.0, unchanged pin/lock:

```sh
GODS_EYE_SOURCE=/tmp/c5-7-d-earth-appearance-20261010/source ORAS_EARTH_OUT=/tmp/c5-7-d-earth-appearance-20261010/final-c bash scripts/runtime/build_owned_earth.sh
GODS_EYE_SOURCE=/tmp/c5-7-d-earth-appearance-20261010/source ORAS_EARTH_OUT=/tmp/c5-7-d-earth-appearance-20261010/final-d bash scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /tmp/c5-7-d-earth-appearance-20261010/final-c
python3 scripts/runtime/earth_artifact.py install --source /tmp/c5-7-d-earth-appearance-20261010/final-c
python3 scripts/runtime/earth_artifact.py verify
python3 /tmp/c5-7-d-earth-appearance-20261010/verify_served.py
docker compose -p oras-c57d -f /tmp/c5-7-d-earth-appearance-20261010/compose.yml ps
```

PASS: final-c/final-d/install/release equality; all512served Earth payloads and
release JSON; all96served unchanged Sky payloads at
`b9c0c22e39384dfdf5e86def40eb580f0b1ec0b6b78052d5a8fb7701aadd164d`.
Rollback `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`
retained at owner `data/runtime-artifacts/earth`; all512disk and independently
served rollback payloads/release match on local4194. No owner artifact replaced.
The preliminary visual trial remains in this checkout at
`data/runtime-artifacts/earth-visual-trial-1cde3fe2`.

Disposable source clone insulated the owner installation from builder `npm ci`.
Rejected overlapping disposable build attempts failed on missing dependency files;
their outputs were not qualified. Corrected sequential final builds pass. Existing
Vite chunk-size and npm update notices remain; no dependency update was performed.

## Bounded checks and retained failed attempts

```sh
node --test --test-reporter spec tests/earth/*.test.mjs tests/runtime/*.test.mjs
python3 -m unittest discover -s tests/validation
npm --prefix frontend run test
npm --prefix frontend run typecheck
npm --prefix frontend run build
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/validate_reconciliation_docs.py
git diff --check
```

PASS:82Node tests,21document/negative tests,229frontend tests in28files;
typecheck/build/diff exit0. Docker artifact negative suite:
`docker run --rm -v "$PWD:/hub:ro" -w /hub astronomy-hub-backend:latest python3 -m pytest -q -p no:cacheprovider /hub/tests/test_local_earth_artifact.py`:
9PASS,0warnings. Initial read-only pytest-cache warning was corrected by disabling
cache. Initial sandbox-only Node run could not run its subprocess test; escalated
final82test run passes. Docker is runtime authority.

Browser command prefix:
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:4190 PLAYWRIGHT_SKIP_WEBSERVER=1 npm --prefix frontend run test:e2e --`.
Final focused selections:

- `earthAppearance.spec.ts earthBfcache.spec.ts unifiedWorkspace.spec.ts --grep 'bundled stars|standalone Earth|one-heavy-renderer|runtime retry|immersive Escape' --workers=1`:6PASS.
- `earthAppearance.spec.ts --grep 'five serial' --workers=1`:2PASS;5Sky/Earth recreation cycles each desktop/mobile, exactly1frame, removed old frames, no page exceptions/overflow.
- `skyUxRegressions.spec.ts --grep 'real canvas wheel|embedded native ORAS search' --workers=1`:3PASS; both Sky surfaces,2wheel scales, M31 canonical selection/centering and Earth/Sky return. Centering error9.20e−13radians.

Default browser runs are software-rendered Chromium; explicit matched-view capture
uses ANGLE SwiftShader. Mobile is390×844emulation; desktop1440×900. No physical
GPU/mobile/Safari/Apple FPS/memory qualification or owner visual acceptance.
Blocked HTTPS existing-provider fixture requests and declared503feeds are not live
success. Existing endpoints remain NASA/USGS/CelesTrak; no new network provider.

Initial new-test provider allowlist omitted the already-existing CelesTrak host;
corrected test-only, then desktop/mobile pass. Initial broader workspace selection
timed out on Deneb before any Earth entry. Exact-main comparison successfully
selected Deneb but then intentionally lacked matching Earth metadata in that
comparison harness; it is not a passing full-baseline qualification. Final desktop/
tablet/mobile workspace recheck passed all3cases without a source fix. No Sky
runtime/scientific fix was made and no cause is inferred from the first timeout.
The exploratory full overlay run was interrupted after its desktop fixture case
passed; it is not claimed as a completed suite. New screenshot files initially
used historical names only in this isolated worktree; they were moved under
`output/playwright/c57d/{overlay-regression,sky-regression}`. Owner historical
outputs were never replaced. Original tracked test-result files were restored.

Raw logs/results, rejected attempts and executable verification scripts are in
`/tmp/c5-7-d-earth-appearance-20261010/`; final scoped screenshots/JSON are in the
checkout's `output/playwright/c57d/`. No unexpected skip is reported as a pass.

## Preservation and remaining gates

`python3 /tmp/c5-7-d-earth-appearance-20261010/preserve.py`:25unchangedfile hashes,
all62original container IDs/status/mounts unchanged, all81namedvolumes unchanged,
non-Earth lock/public metadata unchanged, pin clean/unchanged. Owner checkout
`dev-wsl-performance-repair-1` at `1cb71b848a1ed46390945fe0fa636676b8b8f744`
retains only its original unstaged `.vscode/settings.json`.
PR #67 remains OPEN/unmerged at `ebdad3124fe470e3a09e369d3a56e998f29740fb`.
Current local preview services are additional task containers with read-only
data/artifact mounts, no named volumes or owner datastore changes.

STOP for owner visual/PR review. Physical-device/Apple/resource budgets and broader
C5.7-E remain open. C6 mapping/terrain/3D, provider accounts/charges and additional
features require separate approval. No production/SSH/Cloudflare deployment.
Final browser total:14PASS across the scoped suites (6+2+3+3),0failures/0skips in
the qualifying runs; rejected/interrupted attempts remain above. Commit and PR
head/URL are reported in the owner handoff; no merge is authorized.

## Exact files changed

- `docs/DOCUMENT_INDEX.md`
- `docs/DOC_INVENTORY.md`
- `docs/MASTER_PLAN.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md`
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md`
- `docs/execution/EARTH_CAPABILITY_PLAN.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md`
- `frontend/public/runtime-versions.json`
- `frontend/tests/e2e/earthAppearance.spec.ts`
- `integrations/renderers.lock.json`
- `runtimes/earth-runtime/core/ViewerController.mjs`
- `scripts/validation/earth-appearance/README.md`
- `scripts/validation/earth-appearance/capture.mjs`
- `scripts/validation/earth-appearance/index.html`
- `scripts/validation/earth-appearance/prepare.py`
- `scripts/validation/earth-appearance/proof.mjs`
- `scripts/validation/earth-appearance/vite.config.mjs`
- `scripts/validation/validate_reconciliation_docs.py`
- `tests/validation/test_reconciliation_docs.py`
