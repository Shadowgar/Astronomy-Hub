# Solar System 2.5 integration qualification

Status: scoped implementation, independent source/application reviews and actual
Windows GPU qualification completed. Exact committed SHA and hosted check results
are recorded on existing draft PR107. Owner visual acceptance, physical iPhone
and corresponding-source publication remain open.
This is scoped Solar2.5 qualification, not approval of the entire consolidated PR.

## Authority, checkout and preservation

Loaded root/frontend/backend AGENTS, CORE_CONTEXT, LIVE_SESSION_BRIEF and the
`solar_reconstruction` manifest pack; its full inventory is recorded in
[PLAN.md](PLAN.md) and the preceding Solar2.4 plan. Canonical validation,
unified renderer architecture, ADR0010, cinematic design specification and
relevant Solar2.3–2.4 source/runtime/review records were consulted. No unrelated
document pack or full-docs scan. The owner explicitly authorized this bounded
Solar2.5 implementation after Solar2.4; older phase restrictions are historical.

Branch `recovery/reconcile-20261026`, existing draft PR107. Starting local/remote
SHA `ea4d384af3aead949de7bec1947e8aff41465bca`; main verified
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`. The owner checkout's VS Code settings
were preserved. No new branch/PR, merge, production deployment, tunnel, source
archive publication or protected-resource deletion. Source releases and previous
private preview artifacts remain retained.

## Delivered implementation

The lazy `/missions/:mission` workspace reuses the existing Solar camera,
CelestialBody appearance, resource ownership, clock and HDR compositor. Only the
selected mission/source window and model load. CPU double-precision positions
are subtracted before GPU upload; the compositor uses metres for rasterization
and model self-shadowing. Source models retain every primitive/node/material,
uniform approximate physical scale and their explicit illustrative attitude.

Discovery, verified events, UTC seeking, forward/reverse playback, encounter and
full/ranged trajectory views, physical inspection, orbit/follow/free camera and
Solar return are integrated. Source quality has four explicit classes; later
points are dimmed without claiming predictions are measurements. Historical
bodies use compatible mission solutions at the same UTC. Missing intervals stay
unavailable. Full/selected path intent and camera/display preferences persist
through return navigation; restoration refetches the bounded path before applying
its saved wide camera.

Four model-supported flagships: Voyager1, Voyager2, Cassini–Huygens reference
model with Cassini trajectory, New Horizons. Six bounded trajectory-only entries:
Pioneer10, Pioneer11, Juno, Dawn, NEAR Shoemaker, Rosetta. Huygens has no independent
position/descent track. Arrokoth has a clearly disclosed reference-size sphere,
not qualified shape/imagery. Historical target texture longitude/ring presentation
and spacecraft attitude remain illustrative.

Exact source coverage, native IDs, original kernels, predicted/design segments,
target-chain comparisons and uncertainty are in [SCIENCE.md](SCIENCE.md).
Model rights, dimensions and the32 verified events are in [ASSETS.md](ASSETS.md).
Final mission source manifest:
`9b1bf0cde347536ae5d2c923684498c199444084458d72bdbccbe833c4055e94`.
Source vectors are mounted read-only from `release-v3`; scientific bulk is not
copied into frontend bundles or Docker images. The model pack is12,293,436bytes.

## Findings and independent correction reviews

All findings below are P2 and have preserved failing evidence. Review documents
identify exact original file/line, cause, user effect, reproduction and correction.

- Solar2.4 expired destination path/marker: corrected admission/retirement;
  independent Windows test restored valid geometry after three unsupported-time
  round trips with stable19geometries/67live WebGL buffers and optional503 recovery.
  [Solar2.4 independent review](REVIEW_SOLAR24.md).
- Model readiness after disposal; scientific identity/qualification admission;
  microsecond source-time truncation (34.2576m API/client discrepancy); mixed path
  quality mislabeled reconstructed; controls re-enabled after context loss during
  model load; full/ranged trajectory lost after Back. Source corrections reviewed
  independently. Final rebuilt GPU confirmation is recorded below.
  [Application review](REVIEW_APPLICATION.md).
- Public source edges outside playable bounds, omitted range-transfer budget,
  two independently failing interpolation cells, and UTC trajectory endpoint
  roundtrip labels: corrected without relaxing numerical tolerances or changing
  original coefficients. [Science review](REVIEW_SCIENCE.md).
- Workspace visibility closure, catalog retry/unknown-route handling,
  exact TDB/identity/coverage binding and date-only event view epochs: independently
  tested with explicit browser fixtures. These tests do not claim graphics proof.
  [Workspace review](INDEPENDENT-WORKSPACE-REVIEW.md).
- First actual Docker/browser pass exposed a missing mission model copy rule in
  the explicit Vite asset allowlist. The bounded pack is now emitted and served;
  the original failing receipt is retained. No bulk-public copying was enabled.

Separate asset/rights review found no remaining P1/P2 in that scope:
[asset review](REVIEW_ASSETS.md). Independent reviews are scoped and do not grant
owner visual acceptance or approve inherited whole-PR release liabilities.

## Numerical and focused evidence

Final acquisition validation:2,376 fresh position/velocity comparisons across90
segments, zero failures. Independent reviewer:1,368 original-CSPICE comparisons,
zero failures;180public endpoints and10defaults admitted;667source/request hashes
and10runtime-file hashes match. The previously failing Uranus point improves
from52.865m to14.130m under the unchanged50m sampled fitting threshold.

API/client precision regression matches the Voyager API anchor within0.0743mm;
independent all-mission anchor comparison maximum0.266mm. Endpoint comparisons
have a separately stated float64 Julian-date rounding allowance. These are
numerical checks, not formal physical orbit uncertainties or continuous bounds.
Original NH kernel phase uncertainty estimates are disclosed separately.

Exact commands and retained logs (repository worktree):

```sh
npm test --prefix frontend
npm run typecheck --prefix frontend
npm test --prefix frontend -- --run tests/missionContracts.test.ts tests/missionReview.test.ts tests/missionPrecision.test.ts
python3 -m unittest discover -s scripts/planetdata -p test_solar25_assets.py -v
docker exec -w /work pr107-solar25-final-backend python3 -m pytest -p no:cacheprovider backend/tests/test_mission_exploration.py
docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar25-handoff-proof:latest .
git diff --check
```

Logs are under `output/playwright/solar-system-2.5/`. Final full frontend:697tests/92files pass; focused mission24tests/3files,
typecheck,8asset tests and the Docker production build pass. Focused Docker
backend plus inherited Solar/destination/system regressions:64passed with31
inherited HTTPX/Starlette/NumPy deprecation notices. Mission-only backend17tests
pass. No new warning suppression or dependency substitution.

## Actual browser evidence and limits

Actual headed Windows Edge uses NVIDIA RTX3060 Laptop/D3D11, not SwiftShader.
The first reconstructed Voyager pass captured six actual views, including
1440×900,390×844 and844×390, with no page/shader errors. That early pass is not
substituted for the final rebuilt journeys. Failed/partial runs, their harness
corrections and the actual context-loss/path-restoration red receipts remain
under `output/playwright/solar-system-2.5/`.

Four complete source-backed journeys pass: three passing rows from the retained
`journeys-qualified` aggregate FAIL receipt plus the final passing Voyager1 rerun.
The earlier FAIL is retained because it exposed the corrected stop-notice defect.
42 camera captures,42 disposed-renderer checks, four lifecycle regressions and
four videos are indexed in [BROWSER-JOURNEYS.md](BROWSER-JOURNEYS.md). There are no
uncaught page errors; unsupported-date422 and navigation aborts are intentional.
Four final quality/recovery checks also pass: actual1x/1.5x/2x drawing buffers,
context-loss Retry preserving UTC/quality on one new renderer, full reload and
the visible Pluto coverage disclosure. [Receipt](evidence/quality-recovery.json).
The final additional Pluto/Charon no-data disclosure is text-only; its actual
screenshot is included in the gallery. Scene and source inputs are unchanged.

[Original screenshots](gallery/index.html), four recordings and the actual
application are available at the existing private preview:
`http://localhost:4231/owner-review/solar25-evidence/index.html`.
There are54 unchanged PNGs in the gallery, including the Solar2.4 actual before/after.
Videos remain in the private preview; committed artifact receipts bind their bytes.

Final Windows Edge/RTX3060 performance run:12 model-inspection cases,70warmup plus
200 measured orbit frames per case. GPU median0.268–0.733ms, p95≤1.169ms; actual
RAF median6.9ms, p95≤7.1ms. First readiness333–1568ms. First-launch cold frame
maximum506.8ms and a611ms main-thread long task remain; Cassini cold333.3ms and
New Horizons249.9ms. This is not hitch-free cold loading and is not directly
comparable to the earlier Solar-only236ms cold maximum. Driver/backend caches
were not forcibly flushed. New isolated browser contexts are browser-cold evidence,
not machine-cold proof. Model decode24–58ms and shader preparation21–276ms are
recorded separately; model-ready time47–84ms includes fetch/decode. Texture
reservations peak29,818,886bytes against134,217,728budget, excluding total driver
VRAM and compositor/geometry overhead. [Full metrics](evidence/performance-performance.json).

`python3 scripts/validation/verify_solar25_build.py` verifies27 served files against
Docker-exported bytes, including every entry-reachable Hub chunk and the three
models/manifest;16 reviewed runtime input hashes are bound in
[evidence/served-build.json](evidence/served-build.json).
`python3 scripts/validation/package_solar25_evidence.py` copies original images,
records four video hashes and emits the static gallery without HTML data sinks.
The final source/runtime hashes are compared with the committed revision before
posting final hosted evidence to PR107. No security approval is inferred from a
neutral scanner or from scoped tests.

The independent preservation audit retained147/147old container IDs and90/90volume
names;10 additive helpers, no new host ports, named volumes or writable mounts.
Old mounted manifest pins and14Solar2.4asset hashes match. Baseline volume names
do not prove a byte-for-byte content comparison; no volume mutation was performed.
[Preservation receipt](evidence/preservation-final.json).

Physical iPhone access was explicitly unavailable; responsive desktop-browser
viewports are not physical-device proof. NASA Eyes parity, universal mission
history, live telemetry and qualified historical spacecraft attitude are not claimed.
The old f7cb702c corresponding-source archive does not match this application.
Final matching reconstruction/archive, authorized immutable public source/descriptor
delivery, anonymous HTTPS pairing and inherited combined-work/license qualifications
remain release gates. No new source archive was published. Stop product expansion
for owner review and these qualifications; no Solar2.6 work is authorized here.
