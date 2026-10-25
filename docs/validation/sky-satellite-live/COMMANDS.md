# Commands and exact evidence

Working directory for commands below:
`/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-live-repair-1`.
Node22 path is `/home/rocco/.nvm/versions/node/v22.22.0/bin/node`;
`PATH=/home/rocco/.nvm/versions/node/v22.22.0/bin:$PATH` for npm.
Python tests use `/home/rocco/Astronomy-Hub/.venv/bin/python`.
Logs retain warnings and failed attempts; no warning suppression or timeout inflation.

```sh
node --test tests/runtime/*.test.mjs
npm --prefix frontend test
npm --prefix frontend run type-check
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest tests/runtime/test_sky_promotion.py tests/runtime/test_sky_source.py -q
docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v "$PWD:/work:ro" -w /work --entrypoint python sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py backend/tests/test_satellite_tle_catalog.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_tle_deployment.py -q -p no:cacheprovider
```

Results:114runtime/384frontend/6promotion-source/39Docker tests passed;
TypeScript exit0. Docker has3existing deprecation warnings; strict `-W error`
failed on inherited TestClient/httpx warning and remains failed, not waived.
[Backend audit commands/RED evidence](evidence/catalog/COMMANDS.md).

```sh
python3 scripts/runtime/integrate_sky_bridge.py output/sky-satellite-live/native-default/upstream/apps/web-frontend
docker run --rm --network none --user 1001:1001 -v "$PWD/output/sky-satellite-live/native-default/upstream/apps/web-frontend:/work" -v /var/tmp/oras-phase-c/sky-reconstruction/upstream/apps/web-frontend/node_modules:/work/node_modules:ro -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
python3 scripts/runtime/record_sky_workspace.py output/sky-satellite-live/native-default/upstream/apps/web-frontend/dist
python3 scripts/runtime/record_runtime_versions.py ../cinematic-earth-completion-1/output/earth-sky-completion/earth
npm --prefix frontend run build -- --outDir ../output/sky-satellite-live/hub --emptyOutDir
npm --prefix frontend run build -- --outDir ../output/sky-satellite-live/hub-repeat --emptyOutDir
docker run --rm --network none --user 1001:1001 -v /home/rocco/Astronomy-Hub:/home/rocco/Astronomy-Hub:ro -v "$PWD/output/sky-satellite-live/vite-temp:/home/rocco/Astronomy-Hub/frontend/node_modules/.vite-temp" -v "$PWD/output/sky-satellite-live/hub-container:$PWD/output/sky-satellite-live/hub-container" -w "$PWD" node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 npm --prefix frontend run build -- --outDir ../output/sky-satellite-live/hub-container --emptyOutDir
python3 scripts/validation/verify_satellite_live_delivery.py --candidate
```

Native UI used the local pinned upstream archive with existing overlay/patch and
retained qualified native JS/WASM. No C/native engine compilation. UI build repeated
twice at final source:110payloadfiles byte-identical. Hub host/repeat/Docker142files
byte-identical. All142Hubfiles and111Skyfiles were served and checked. Vite chunk
size and Browserslist-age notices remain visible. Initial readonly Vite temp write
failed; `--configLoader native` then failed existing `__dirname` use. The qualified
command mounts only task-owned temporary output at the required cache path, retaining
read-only source/dependencies. Both failed commands/logs remain in local output.

```sh
SV_OUT=output/sky-satellite-live/native-motion-qualified node scripts/validation/verify_satellite_native_motion.mjs
node output/sky-satellite-live/time-audit/navigation-recovery.mjs
node output/sky-satellite-live/time-audit/status-browser-qualified.mjs
curl --max-time 10 -fsS 'http://127.0.0.1:4226/api/sky/satellite-feed?norad=43689'
```

The native visual runner:3viewports×5control groups passed on finalc8edee build.
Navigation:22checkpoints passed, with warnings/limits in the
[report](evidence/time-audit/navigation-finish/REPORT.md). Its retained successful
harness is [here](evidence/time-audit/navigation-finish/successful-harness.mjs);
its relative imports/output paths describe its original output location.
The source-status fixture intercepts only browser GET responses for Unavailable;
no native scientific data changes. Exact output and screenshot hashes are retained.

```sh
python output/sky-satellite-live/catalog/stage_refresh_once.py
python output/sky-satellite-live/catalog/stage_refresh_resume_once.py
```

One bounded request on October24 and a new bounded request after the resumed
October25 environment restart: both120second timeouts,0bytes/status, no promotion.
These commands are a historical log, **not instructions to retry acquisition**.

```sh
docker start oras-satellite-live-backend oras-satellite-live-preview
powershell.exe -NoProfile -Command 'try { $r=Invoke-WebRequest -UseBasicParsing -Uri "http://172.26.23.204:4226/sky-engine" -TimeoutSec 15; Write-Output ("WINDOWS_HTTP_STATUS="+$r.StatusCode); Write-Output ("WINDOWS_BYTES="+$r.RawContentLength) } catch { Write-Output $_.Exception.Message; exit 1 }'
git status --short
git diff --check
git log --oneline -5
```

Only task containers were restarted after the external environment interruption.
The Windows address is environment-local; current access and final committed-source,
local/remoteHEAD checks are reported in the PR delivery record. Final identity uses
`python3 scripts/validation/verify_satellite_live_delivery.py` without `--candidate`.
