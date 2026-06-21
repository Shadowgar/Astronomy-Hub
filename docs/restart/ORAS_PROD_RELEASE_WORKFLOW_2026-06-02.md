# ORAS production release workflow

Date: 2026-06-02

## Summary

The supported production release path for the ORAS Sky-Engine frontend on the Pi is:

1. `npm run build:stellarium`
2. `docker compose -f docker-compose.prod.yml build frontend`
3. `docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend`
4. validate `/oras-sky-engine/` plus the DSO pack endpoints

This keeps the current production split intact:

- the frontend image contains the ORAS Sky-Engine runtime shell under `frontend/public/oras-sky-engine`
- `skydata` remains bind-mounted from `frontend/public/oras-sky-engine/skydata`

## Why this workflow exists

Two Pi-specific failure modes showed up in production work:

1. host-side Stellarium builds could destabilize the machine when they ran directly against the external-drive checkout
2. frontend Docker builds could spend an extremely long time walking build context on the NTFS-backed external drive

The first issue is addressed by the safe builder in `scripts/build-stellarium-safe.sh`, which stages the vendored Stellarium frontend on internal storage and builds it inside a throttled Docker container.

The second issue is addressed by keeping the frontend Docker context narrow. `frontend/.dockerignore` now excludes:

- `public/oras-sky-engine/skydata`
- `dist`
- `dev`
- `test-results`

That prevents Docker from traversing generated runtime output and other large local artifacts during `docker compose ... build frontend`.

## Supported commands

### Full local production refresh

```bash
cd <repository-path>
npm run build:stellarium
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
```

### Validation only

```bash
cd <repository-path>
docker compose -f docker-compose.prod.yml ps frontend
curl --fail --silent --show-error http://127.0.0.1/oras-sky-engine/ >/dev/null
curl --fail --silent --show-error http://127.0.0.1/oras-sky-engine/skydata/packs/base/dso/properties
```

### Reuse current Stellarium runtime, but rebuild frontend image and recreate container

```bash
cd <repository-path>
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend
```

## Validation gate

The release is considered healthy only if all of the following are true:

- `/oras-sky-engine/` loads
- the live app bundle is reachable
- `/oras-sky-engine/skydata/dso/properties` returns `404`
- `/oras-sky-engine/skydata/packs/base/dso/properties` returns `200` and includes `hips_order = 1`
- `/oras-sky-engine/skydata/packs/extended/dso/properties` returns `200` and includes `hips_order = 3`

## Notes

- Use `npm run build:stellarium`; the legacy build path is unsupported for normal production work.
- If the external drive is not mounted after reboot, the frontend container will bind-mount an empty local `skydata` directory and the ORAS runtime will appear loaded but broken.
- This workflow standardizes the frontend/runtime side only. Check database health separately with `docker compose -f docker-compose.prod.yml ps postgres`.
