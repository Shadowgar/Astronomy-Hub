# Solar 2.4 validation ledger

Commands below run from the recovery worktree unless noted. Windows commands use
`/mnt/c/Program Files/nodejs/node.exe` with `wslpath -w` for the script and output
paths. Source data and preview mounts are read-only. Tests do not qualify owner
acceptance, a physical iPhone, all source epochs or every catalog member.

## Final source and build checks

```sh
npm test --prefix frontend
npm run typecheck --prefix frontend
docker build --target build -f frontend/Dockerfile.production -t astronomy-hub-solar24-build-proof:latest .
docker exec -e PYTHONDONTWRITEBYTECODE=1 -w /work pr107-solar24-backend python -m pytest -p no:cacheprovider --basetemp=/tmp/solar24-final-pytest -q backend/tests/test_solar_destinations.py backend/tests/test_solar24_acquisition.py backend/tests/test_planetary_systems.py backend/tests/test_system_body_orientation.py backend/tests/test_satellite_spk_systems.py backend/tests/test_solar_populations.py
output/playwright/solar-system-2.4/asset-tools-venv/bin/python -m unittest discover -s scripts/planetdata -p test_solar24_assets.py -v
```

- **673 frontend tests / 89 files passed**, typecheck passed.
- Production Docker build stage passed. The unchanged Vite large-chunk advisory
  remains. Its unmodified `/app/dist` export is the private preview artifact.
- **134 Docker backend/source tests passed in 7.86 s**, with **34 inherited
  Skyfield/NumPy deprecation warnings** in retained Moon/frame tests. This is not
  warning-clean or full-backend-suite qualification. No warnings were suppressed.
- **7 asset tests passed**, independently repeated by the science reviewer.
  Actual pinned sources were checked; this is not a generated-constants-only test.
- Compose validation passed using the existing owner's base directory for its
  required `.env`, without printing values or starting services:
  `docker compose --project-directory /home/rocco/Astronomy-Hub -f /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/docker-compose.yml -f /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/docker-compose.solar23.yml -f /home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026/docker-compose.solar24.yml config --quiet`.

[Source/build hashes](evidence/source-binding.json) bind every changed runtime
input and all 327 emitted files to actual private HTTP bytes. Scientific manifest
pins remain in the source reports. [Preservation](evidence/preservation.json):
146 prior container IDs and 90 named volumes retained; one added task backend,
zero added/deleted volumes. Owner checkout `.vscode/settings.json` is untouched.

## Actual browser checks

Large machine-readable receipts are compact JSON with identical parsed values; original formatted logs remain in the local output directory. Gallery validation decoded all 69 images and sought to the midpoint of all four recordings on Windows, with no desktop/portrait horizontal overflow.

All use headed Windows Edge and NVIDIA RTX3060, not SwiftShader. Epoch for matched
views is 2026-10-27T04:00:00Z. Viewports: 1440×900, 390×844 and 844×390.

```text
capture_solar24_baseline.mjs <output/before>
verify_solar24_candidate.mjs <output/candidate-desktop> desktop
verify_solar24_candidate.mjs <output/candidate-portrait> portrait
verify_solar24_candidate.mjs <output/candidate-landscape-final> landscape
verify_solar24_candidate.mjs <output/candidate-desktop-final> desktop capture-only
verify_solar24_candidate.mjs <output/candidate-portrait-final> portrait capture-only
verify_solar24_failures.mjs <output/failures-r3>
verify_solar23_lifecycle.mjs <output/lifecycle-final>
benchmark_solar24.mjs http://localhost:4231 <output/performance-r3>
record_solar24_journeys.mjs <output/journeys-final>
```

Paths above are under `scripts/validation/` and `output/playwright/solar-system-2.4/`.
Final-build capture-only reruns retain camera/source/catalog/return assertions;
the earlier full runs additionally exercise forward/reverse source-window renewal.
The final edit between them changed disclosure/status text, not renderer behavior.

Candidate checks: 18 scenes per viewport, actual source belt/TNO symbols,
source-index search → precise Ceres, Pluto → Charon → Solar camera/UTC return,
forward and reverse across multiple sampled windows with stable renderer identity,
one active canvas and no console errors. Four separate failure groups check
optional 503 isolation, SPA worker/asset retirement, precise Eros beyond the old
catalog's time domain, and context-loss/retry with one fresh renderer.

The four existing lifecycle/native checks were rerun against the final artifact:
held parallel shader preparation and departure, loss during preparation/retry,
synchronous shader creation failure/retry, and ready native Moon → Apollo17 → Moon
→ System preserving UTC/camera and retiring native frames. Unchanged broader
Sky/Earth provider and satellite investigations reuse the qualified Solar2.3 and
recovery evidence; they were not rerun wholesale or promoted to new device proof.

Four recordings show real Pluto/Charon, Ceres/asteroids, Kuiper/Eris and comet
journeys. Nineteen exclusive GPU cases are in [PERFORMANCE.md](PERFORMANCE.md).
Actual screenshots and recordings are in [the gallery](gallery/index.html).

## Failed attempts retained, excluded from passing counts

- Initial GLB requests returned SPA HTML because the build allowlist omitted v2.4;
  corrected source allowlist and real browser retest establish the repair.
- One smoke assertion compared equivalent `Z` and `.000Z` strings; changed to epoch
  equality. No scientific timestamp or coverage was relaxed.
- Landscape selector looked for a hidden toolbar Overview button; the test now uses
  the visible Pluto System breadcrumb. No controls were redesigned.
- Initial Docker command used `/app`, missing test fixtures; the documented `/work`
  mount and `/tmp` scratch produced the authoritative 134-test result.
- Direct worktree Compose validation lacked the owner's `.env`; existing owner
  project-base validation passed. No secret values were copied or emitted.
- First performance attempt used the wrong label; the next used SystemScene orbit
  keyboard bindings in Solar. Unchanged render-count assertion rejected those
  samples. Final run drives actual Solar orbit controls and checks active renders.
- Failure harness initially checked playback before motion readiness, then read
  the disposed diagnostics during retry. Corrected readiness explicitly requires
  an enabled source clock and a non-disposed replacement scene; all assertions
  remain active. No production exception was suppressed.

Independent review of the final root integration corrections remains unavailable
because the reviewer service returned a usage limit. Scoped completed reviews are
linked in [REVIEW.md](REVIEW.md); tests do not replace that outstanding review.
Hosted exact-SHA CI/CodeQL status is recorded on PR107 after push. No neutral or
skipped check is counted as passing qualification.
