# ORAS Satellite TLE Deployment

## Purpose

ORAS uses the CelesTrak Active GP/TLE feed as the source for the satellite
catalog served by `/oras-sky-engine/` and propagated by `/api/above-me`. The
release is acquired independently from application builds, converted into the
double-gzip JSONL format required by the pinned Stellarium Web Engine, and
mounted read-only at runtime.

Generated releases are runtime data. They are ignored by git, excluded from
Docker build contexts, and must not be copied into an image.

## Source

| Field | Value |
| --- | --- |
| Source | CelesTrak Active GP data |
| Endpoint | `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE` |
| Format | Three-line or two-line TLE records |
| ORAS catalog | `Satellite TLE (local)` |
| Runtime model | `tle_satellite` |

CelesTrak documents that GP data is updated about every two hours and asks
clients not to download the same data more frequently than necessary. ORAS
uses a six-hour operational refresh interval by default. This release uses the
legacy TLE representation, which supports five-digit NORAD catalog numbers;
OMM ingestion is required before ORAS can retain newer six-digit catalog IDs.

## Release Layout

Build directory:

```text
data/runtime-packs/satellite-tle/build/
  manifest.json
  tle_satellite.jsonl.gz
```

Installed directory:

```text
data/runtime-packs/satellite-tle/current/
  manifest.json
  tle_satellite.jsonl.gz
```

The manifest records the source URL, acquisition time, record counts, malformed
and duplicate counts, epoch range, checksum, byte size, required ISS/HST IDs,
compression layers, and catalog-number limitation. The generated feed contains
only source-backed names, identities, designations, and TLE lines. It does not
invent coordinates, visibility, magnitude, owner, or operational status.

## Build

Acquire and build one current release:

```bash
npm run satellites:build
```

For deterministic tests or an offline controlled build:

```bash
.venv/bin/python scripts/skydata/build_oras_satellite_tle_release.py \
  --input /path/to/celestrak-active.tle \
  --output data/runtime-packs/satellite-tle/build \
  --release-version 2026.07.16.1200 \
  --acquired-at 2026-07-16T12:00:00Z
```

The builder rejects malformed checksums, mismatched NORAD IDs, insufficient
record counts, and releases missing ISS (`25544`) or HST (`20580`). Output is
deterministic for the same source records, acquisition timestamp, and release
version.

## Validate And Install

```bash
npm run satellites:validate
npm run satellites:install
```

The installer validates the source release, rejects symlink content and symlink
targets, stages the feed before the manifest, validates staging, atomically
replaces `current`, retains the previous release as
`current.previous-<timestamp>`, and validates the installed release.

Do not manually overwrite a live manifest or feed.

## Runtime Mounts

Set the host release path when starting Compose:

```bash
export ORAS_SATELLITE_TLE_HOST_DIR="$PWD/data/runtime-packs/satellite-tle/current"
COMPOSE_BAKE=false docker compose up -d --build backend frontend
```

| Service | Container path | Mode |
| --- | --- | --- |
| backend | `/runtime/oras-satellite-tle` | read-only |
| frontend development | `/app/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz` | read-only file |
| frontend production | `/usr/share/nginx/html/oras-sky-engine/skydata/tle_satellite.jsonl.gz` | read-only file |

Backend environment:

```text
SATELLITE_TLE_FEED_PATH=/runtime/oras-satellite-tle/tle_satellite.jsonl.gz
ORAS_SATELLITE_TLE_MANIFEST_PATH=/runtime/oras-satellite-tle/manifest.json
```

Because an atomic directory replacement changes the host inode behind a bind
mount, recreate backend and frontend containers after installing a release.

## Status And Acceptance

```bash
curl -sS http://127.0.0.1:8000/api/sky/satellite-feed
```

A ready response proves that the mounted manifest and feed pass checksum,
record-count, required-ID, compression, and freshness validation. A valid but
old release reports `degraded`; it is never presented as current. A missing or
invalid mount also reports an explicit degraded state.

Runtime acceptance must additionally prove:

- `/oras-sky-engine/` loads the mounted feed
- the Stellarium console reports a positive parsed satellite count
- ISS exact lookup and selection still work
- `/api/above-me` includes only independently propagated, above-horizon,
  age-eligible candidates
- no gzip or `Parsed -1 satellites` error appears

## Scheduled Refresh

Example systemd/cron command, run no more often than every six hours:

```bash
cd /srv/Astronomy-Hub && \
  npm run satellites:build && \
  npm run satellites:validate && \
  npm run satellites:install && \
  ORAS_SATELLITE_TLE_HOST_DIR=/srv/Astronomy-Hub/data/runtime-packs/satellite-tle/current \
    COMPOSE_BAKE=false docker compose up -d --force-recreate backend frontend
```

Do not loop or aggressively retry when CelesTrak is unavailable. Retain the
last validated release, expose its actual freshness status, and retry at the
next scheduled interval.

## Rollback

Stop or recreate the consumers around rollback:

```bash
mv data/runtime-packs/satellite-tle/current \
  data/runtime-packs/satellite-tle/failed-$(date -u +%Y%m%dT%H%M%SZ)
mv data/runtime-packs/satellite-tle/current.previous-<timestamp> \
  data/runtime-packs/satellite-tle/current
npm run satellites:validate -- --output data/runtime-packs/satellite-tle/current
ORAS_SATELLITE_TLE_HOST_DIR="$PWD/data/runtime-packs/satellite-tle/current" \
  COMPOSE_BAKE=false docker compose up -d --force-recreate backend frontend
```

Keep at least one known-good previous release.

## Known Limitation

Legacy TLE output cannot represent all newer six-digit NORAD catalog numbers.
The next format expansion should ingest CelesTrak OMM JSON or CSV while keeping
the current SWE-compatible TLE feed for objects that can be represented safely.
