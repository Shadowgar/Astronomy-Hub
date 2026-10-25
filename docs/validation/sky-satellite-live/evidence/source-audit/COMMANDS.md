# Principal exact verification commands

All host commands ran from `/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-live-repair-1` unless paths are absolute. No source install/promotion command was run.

```sh
date -u +%Y-%m-%dT%H:%M:%SZ
docker ps --format '{{.Names}}\t{{.Ports}}'
docker inspect oras-ps2-backend --format '{{json .Mounts}}'
docker inspect oras-ps3-preview --format '{{json .Mounts}}'
curl -fsS http://127.0.0.1:4225/api/v1/sky/satellite-feed
curl -fsS http://127.0.0.1:4225/api/sky/satellite-feed
curl -fsS 'http://127.0.0.1:4225/api/sky/satellite-feed?time=2026-06-18T23:00:00Z'
curl -sS -I http://127.0.0.1:4225/oras-sky-engine/skydata/tle_satellite.jsonl.gz
curl -fsS http://127.0.0.1:4225/oras-sky-engine/skydata/tle_satellite.jsonl.gz | sha256sum
sha256sum /home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz
python3 output/sky-satellite-live/catalog/audit_native_catalog.py
python3 output/sky-satellite-live/catalog/stage_refresh_once.py
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q -W error
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q -k invalid_release_minimum
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py -q -k missing_and_invalid
/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py backend/tests/test_satellite_tle_catalog.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_tle_deployment.py -q
docker run --rm --network none --read-only --tmpfs /tmp -e PYTHONDONTWRITEBYTECODE=1 -v /home/rocco/Astronomy-Hub/.worktrees/sky-satellite-live-repair-1:/work:ro -w /work --entrypoint python sha256:00e343c5943ae02f94c5312d17fec4ab6c5aaa2376d27ce9ff2486793dc15c6a -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py backend/tests/test_satellite_tle_catalog.py backend/tests/test_satellite_tle_release_pipeline.py backend/tests/test_satellite_tle_deployment.py -q -p no:cacheprovider
git diff --check -- backend/app/services/satellite_feed_status_service.py backend/app/routes/satellite_feed.py backend/tests/test_satellite_feed_api.py
git branch --show-current
git rev-parse HEAD
```

The status audit also invoked readonly `docker exec -e PYTHONDONTWRITEBYTECODE=1 oras-ps2-backend python -c ...` to directly run existing catalog/freshness/candidate functions; receipts are `backend-native-parser.json` and `protected-readonly-mounts.txt`. Only the three satellite environment keys were inspected; no secret environment values were printed. New corrected service was separately exercised in disposable Docker with additional readonly `/native` bind to the exact protected skydata path, yielding `corrected-status-actual-native-docker.json`. No changes to existing Docker containers or their mounts were made.

Independent science/preservation follow-up commands:

```sh
command -v npx
node output/sky-satellite-live/catalog/native_independent_samples.mjs
docker exec -e PYTHONDONTWRITEBYTECODE=1 -e PYTHONPATH=/app -w /app oras-satellite-live-backend python /work/output/sky-satellite-live/catalog/compare_native_skyfield.py
python3 output/sky-satellite-live/catalog/preservation_audit.py
docker exec -e PYTHONDONTWRITEBYTECODE=1 -e PYTHONPATH=/work -w /work oras-satellite-live-backend python -m pytest backend/tests/test_satellite_feed_api.py backend/tests/test_satellite_propagation_service.py -q -p no:cacheprovider
```

Existing read-only Earth verifier called `scripts.runtime.earth_artifact.verify(Path('/home/rocco/Astronomy-Hub/.worktrees/cinematic-earth-completion-1/output/earth-sky-completion/earth'),repo=Path.cwd(),qualified=True)`; it verified all513artifact members/52source inputs. Scientific data receipt hashes the seven explicit mounted files against existing manifest/admitted LUNAR_FILES constants; neither acquisition nor installer functions were called. An initial direct script invocation needed explicit `PYTHONPATH=/app`, and JSON encoding needed Python bool rather than NumPy bool. A system-Python source-hash helper lacked SQLAlchemy and was rerun using the established `.venv/bin/python`; these were evidence-script environment/serialization errors, with no application-source change or provider retry.
