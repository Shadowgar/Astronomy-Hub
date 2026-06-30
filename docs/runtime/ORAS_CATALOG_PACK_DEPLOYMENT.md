# ORAS Catalog Pack Deployment

## Purpose

ORAS catalog packs are generated JSONL search/detail indexes for the active
`/oras-sky-engine/` Stellarium Web runtime. They make the merged major catalog
update deployable without committing or baking a 100 MB generated release into
Docker images.

The packs are runtime data:

- source-backed and reproducible
- ignored by git under `data/runtime-packs/catalog-packs/`
- mounted read-only into backend and frontend containers
- validated by manifest checksums before use
- optional only in an explicitly degraded mode

## Current Release Shape

The production-sized release from the major catalog update contains 158,217
objects:

| Pack | Objects |
|---|---:|
| `stars-core` | 99,635 |
| `dso-expanded` | 20,539 |
| `double-stars` | 25,000 |
| `unusual-objects` | 13,043 |

Generated release files must remain outside git. The committed
`docs/runtime/oras-catalog-release-manifest.example.json` file is only a small
template that documents release metadata fields.

## Paths And Mounts

Default host path:

```bash
data/runtime-packs/catalog-packs
```

Default build/staging path:

```bash
data/runtime-packs/catalog-pack-build
```

Override host path:

```bash
export ORAS_CATALOG_PACKS_HOST_DIR=/srv/oras/catalog-packs/current
```

Development container mounts:

| Service | Container path | Mode |
|---|---|---|
| backend | `/runtime/oras-catalog-packs` | read-only |
| frontend | `/app/public/oras-sky-engine/skydata/catalog-packs` | read-only |

Production container mounts:

| Service | Container path | Mode |
|---|---|---|
| backend | `/runtime/oras-catalog-packs` | read-only |
| frontend | `/usr/share/nginx/html/oras-sky-engine/skydata/catalog-packs` | read-only |

Backend uses:

```bash
ORAS_CATALOG_PACKS_DIR=/runtime/oras-catalog-packs
```

Frontend loads:

```text
/oras-sky-engine/skydata/catalog-packs/manifest.json
```

Startup must load the manifest only. Chunks are loaded only when explicitly
needed for browser-side indexed behavior.

## Build

Build the release from public/source-backed catalog inputs:

```bash
npm run catalog:build
```

Equivalent direct command:

```bash
ORAS_CATALOG_RELEASE_VERSION=2026.06.1 \
ORAS_CATALOG_SOURCE_ROOT=data/catalog-sources/oras-major-catalog-update-1 \
ORAS_CATALOG_RELEASE_DIR=data/runtime-packs/catalog-pack-build \
bash scripts/skydata/build_oras_catalog_release.sh
```

The build wrapper:

1. acquires source catalogs into `ORAS_CATALOG_SOURCE_ROOT`
2. builds source-backed packs into `ORAS_CATALOG_RELEASE_DIR`
3. validates the generated manifest, chunks, object counts, checksums, and
   UTF-8 JSONL records

By default, build output goes to `data/runtime-packs/catalog-pack-build`, not
the live mounted path. Use `install_oras_catalog_release.sh` to publish a
validated build into the runtime mount.

## Install

Install from a built release into the mounted runtime path:

```bash
bash scripts/skydata/install_oras_catalog_release.sh \
  data/runtime-packs/catalog-pack-build \
  /srv/oras/catalog-packs/current
```

The install wrapper:

1. validates the source release first
2. rejects symlinked source files and symlink targets
3. creates a staging directory beside the target
4. copies chunk/payload files first
5. copies `manifest.json` last
6. validates the staged release
7. moves the previous target to `current.previous-<timestamp>`
8. atomically moves the staged release into place
9. validates the installed target
10. sets read/execute permissions with `chmod -R a+rX`

Do not install by copying files manually into a live target. A new manifest
pointing at incomplete chunks creates a real corrupted release window.

## Validate

Validate a release directory:

```bash
npm run catalog:validate -- data/runtime-packs/catalog-packs
```

Equivalent direct command:

```bash
bash scripts/skydata/validate_oras_catalog_release.sh data/runtime-packs/catalog-packs
```

Validate a running stack with the backend status endpoint:

```bash
ORAS_CATALOG_STATUS_URL=http://127.0.0.1:8000/api/sky/catalog-packs \
bash scripts/skydata/validate_oras_catalog_release.sh data/runtime-packs/catalog-packs
```

For `docker-compose.prod.yml`, only the frontend publishes a host port and
nginx proxies `/api/` to the backend. Validate through the exposed frontend
port:

```bash
ORAS_CATALOG_STATUS_URL=http://127.0.0.1:${PUBLIC_HTTP_PORT:-4173}/api/sky/catalog-packs \
bash scripts/skydata/validate_oras_catalog_release.sh /srv/oras/catalog-packs/current
```

Runtime/browser acceptance:

```bash
npm run validate:oras-catalog-release
```

Expected API status when packs are active:

```json
{
  "mounted": true,
  "object_count": 158217,
  "packs": [
    { "pack_id": "stars-core", "status": "loaded" },
    { "pack_id": "dso-expanded", "status": "loaded" },
    { "pack_id": "double-stars", "status": "loaded" },
    { "pack_id": "unusual-objects", "status": "loaded" }
  ]
}
```

Check directly:

```bash
curl -sS http://127.0.0.1:8000/api/sky/catalog-packs
```

For production compose:

```bash
curl -sS http://127.0.0.1:${PUBLIC_HTTP_PORT:-4173}/api/sky/catalog-packs
```

## Update Without Rebuilding Docker

Catalog packs are mounted runtime data. To update packs without rebuilding
images:

1. build the new release into a staging/build directory
2. install it into the host mount path with
   `scripts/skydata/install_oras_catalog_release.sh`
3. restart or reload the containers if needed
4. validate `/api/sky/catalog-packs`
5. run `npm run validate:oras-catalog-release`

Docker images should remain unchanged when only catalog pack data changes.

## Rollback

The install wrapper moves the previous target to:

```text
<target>.previous-<timestamp>
```

Rollback:

```bash
mv /srv/oras/catalog-packs/current /srv/oras/catalog-packs/bad-$(date -u +%Y%m%dT%H%M%SZ)
mv /srv/oras/catalog-packs/current.previous-20260630T120000Z /srv/oras/catalog-packs/current
ORAS_CATALOG_STATUS_URL=http://127.0.0.1:${PUBLIC_HTTP_PORT:-4173}/api/sky/catalog-packs \
bash scripts/skydata/validate_oras_catalog_release.sh /srv/oras/catalog-packs/current
```

Keep at least one last-known-good release on the host volume.

## Missing Or Degraded Packs

Missing mount behavior is explicit:

- backend `/api/sky/catalog-packs` returns `mounted: false` and
  `object_count: 0`
- Sky Engine status dialog reports that no generated catalog release is mounted
- standard Stellarium catalogs remain available
- ORAS enhanced pack search/detail is unavailable

Corrupted pack behavior is degraded, not silent:

- valid packs still load
- failed packs report `status: failed`
- checksum, byte-size, duplicate-identity, unsafe-path, and malformed JSONL
  errors are surfaced in status payloads

Production should treat missing packs as a deployment issue unless intentionally
running in degraded mode.

## Docker Image Safety

The generated release is excluded from git and Docker build contexts:

- `.gitignore`: `/data/runtime-packs/catalog-packs/`
- `.dockerignore`: `data/runtime-packs/catalog-packs`
- `frontend/.dockerignore`: `public/oras-sky-engine/skydata/catalog-packs`

Do not copy generated packs into application source directories before building
images. Use `ORAS_CATALOG_PACKS_HOST_DIR` and read-only mounts.

## Production Checklist

1. `npm run catalog:build`
2. `bash scripts/skydata/install_oras_catalog_release.sh data/runtime-packs/catalog-pack-build <host-mount-dir>`
3. `ORAS_CATALOG_PACKS_HOST_DIR=<host-mount-dir> COMPOSE_BAKE=false docker compose -f docker-compose.prod.yml up -d --build`
4. `curl -sS http://127.0.0.1:${PUBLIC_HTTP_PORT:-4173}/api/sky/catalog-packs`
5. confirm `object_count` is `158217`
6. run `ORAS_API_BASE_URL=http://127.0.0.1:${PUBLIC_HTTP_PORT:-4173} npm run validate:oras-catalog-release`
7. open `/oras-sky-engine/`
8. open the `ORAS Catalog Packs` status dialog
9. confirm the release and loaded pack counts
10. verify startup does not load full chunk payloads unless explicitly needed
