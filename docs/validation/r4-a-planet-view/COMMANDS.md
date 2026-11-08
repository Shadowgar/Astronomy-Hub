# Qualification commands and evidence classes

Run from `.worktrees/r4-a-planet-view-1`. Node is
`/home/rocco/.nvm/versions/node/v22.22.0/bin/node`; npm uses that directory in PATH.
Output is `output/r4-a/`. Commands below are actual qualification commands;
browser source identities bind the production inputs independently of Git metadata.

```sh
npm --prefix frontend test
npm --prefix frontend run type-check
node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs runtimes/planet-runtime/contracts.test.mjs
python3 -m unittest discover -s scripts/planetdata -p 'test_*.py' -v
docker exec -w /work oras-r4-backend python -m pytest /work/backend/tests/test_planet_view.py /work/backend/tests/test_solar_exploration.py -q -o cache_dir=/tmp/r4-pytest-cache
ORAS_PLANETARY_EPHEMERIS_DIR=/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_planet_view.py -q -W error
python3 scripts/validation/validate_architecture_docs.py
python3 scripts/validation/verify_cinematic_references.py
python3 scripts/validation/verify_solar_assets.py
git diff --check
```

The Node contract command requires child-process permission for its existing
Python export-boundary fixture. The sandbox run failed `spawnSync python3 EPERM`;
the identical authorized command passed **258/258**. This was a harness permission
failure, not an application assertion. Frontend and Python counts, exact outputs
and final identities are recorded with the integrated README/evidence.

Docker science/Solar: **33 passed, 7 visible deprecation warnings**. Five arise in
Skyfield's `matrix.shape` assignment with container NumPy2.5; Starlette and HTTPX
warnings also occur in existing infrastructure/tests. Strict warnings-as-errors
Docker qualification remains incomplete. Host lunar strict verification is
**10 passed, zero warnings**, supporting evidence only. No warnings or source pins
were silently changed to obtain a pass. A fixture-path run from `/app` lacked the
Solar reference JSON; the correct complete readonly mount is `/work`.

## Actual browser journeys

```sh
R4_URL=http://172.26.23.204:4222 node scripts/validation/verify_r4_planet_view.mjs
R4_OUT=output/r4-a/recovery-final R4_RECOVERY_MODES=sky R4_URL=http://172.26.23.204:4222 node scripts/validation/verify_r4_recovery.mjs
node scripts/validation/verify_r4_earth_return.mjs
node scripts/validation/inspect_r4_rendering.mjs
python3 scripts/validation/measure_r4_illumination.py
```

All successful globe journeys use the real local API and original mounted image;
only explicitly labeled negative tests intercept requests to inject failure or
delay. Camera destinations, frame/radii/time, source readiness and destruction are
asserted against actual native diagnostics. Touch uses CDP input, keyboard and
mouse operate the real canvas. Reduced motion is enabled for the journey run.
Software Chromium/SwiftShader and viewport emulation are not physical GPU/device
qualification or owner visual acceptance.

One combined recovery run completed eight groups but timed out opening Earth
before the R4 Earth journey. Short fresh baseline4221/candidate4222 observations
both rendered Earth ready without page errors. The separate bounded Earth-only
desktop/mobile search→Solar→Moon→Earth checks passed. The original timeout's
cause remains **unknown**; it is not relabeled as a successful combined run.

An earlier final navigation attempt passed desktop and reached mobile Back/Forward
before a30s Moon readiness timeout. A bounded mobile diagnostic passed; no
functional mismatch was reproduced and the timeout cause remains unknown. The
integrated README names the final run outcome rather than inferring it from
these earlier results. No deadline was increased or unrelated workload disturbed.

Other retained evidence distinguishes actual application fixes (history camera,
camera up-vector validation, unfinished coordinate draft, height-boundary numeric
roundoff, HTTP-origin UUID, retry camera and Earth-specific illumination) from
harness corrections (normalized-vector comparison and waiting for command/move-end
acknowledgement). A startup502 followed the task backend refresh before Uvicorn
was ready; the real API was confirmed200 before subsequent qualification.

## Reproducible builds and served bytes

```sh
npm --prefix frontend run build -- --outDir ../output/r4-a/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/r4-a/hub-repeat --emptyOutDir
ORAS_PLANET_OUT="$PWD/output/r4-a/planet" bash scripts/runtime/build_planet_runtime.sh
ORAS_PLANET_OUT="$PWD/output/r4-a/planet-repeat" bash scripts/runtime/build_planet_runtime.sh
python3 scripts/validation/verify_r4_delivery.py --candidate
# After committing the same qualified source:
python3 scripts/validation/verify_r4_delivery.py
```

Native builds use the existing clean God's Eye checkout at
`e7707d9a0f34d9fbffc300023c319f95caa5be30`, Cesium1.138.0, readonly mounts,
`--network none`, UID1001 and pinned image
`node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8`.
Hub is additionally reproduced in that same offline image, with `/work` and both
existing dependency directories readonly, `/output` mapped to
`output/r4-a/hub-container`, and Vite's `.vite-temp` isolated in container tmpfs.
The initial readonly-cache build failure is preserved; no dependency write was
enabled as a workaround. Both native and Hub builds report their default large
chunk warning; this is retained as a bundle-cost limitation, not a performance pass.

The delivery verifier compares all files across three Hub builds and two native
builds, checks served bytes, original TIFF/derived PNG hashes, unchanged Earth/Sky
payloads, upstream pin/cleanliness, protected source and readonly runtime mounts.
Its final mode verifies committed file bytes against local sources. No historical
browser test is rerun or relabeled by that identity verifier.

Windows reachability was checked with the existing PowerShell executable:

```powershell
(Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://172.26.23.204:4222/solar-system").StatusCode
```

Observed result: **200**. Actual Chromium rendering also runs on that HTTP origin,
where secure-context-only `crypto.randomUUID` is absent.

After the interrupted session, both task-owned R4 containers were found exited with code255 and Docker OOMKilled=false. Their exit cause is unknown. Only `oras-r4-backend` and `oras-r4-preview` were started again. Final served-byte checks and Windows HTTP200 were reverified against unchanged payloads; earlier source-matched browser journeys are retained as earlier runs, not relabeled as post-startup fresh journeys.
