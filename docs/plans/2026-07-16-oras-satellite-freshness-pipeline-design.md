# ORAS Satellite Freshness Pipeline Design

## Goal

Replace the stale, manually refreshed satellite runtime feed with a repeatable,
source-backed CelesTrak acquisition and deployment path that preserves native
Stellarium Web Engine satellite loading and honest `/api/above-me` visibility.

## Source

The source is CelesTrak's active GP query with an explicit legacy TLE format:

```text
https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE
```

The acquisition command is administrative/import-only. It must not run from a
browser request or normal API request. The default schedule is no more frequent
than every six hours, which remains below CelesTrak's two-hour update cadence.

TLE cannot represent catalog numbers above 99999. The pipeline reports that
format limitation and does not fabricate records for newer six-digit catalog
numbers. OMM/native runtime support is deferred.

## Release Shape

Each generated release contains:

- `tle_satellite.jsonl.gz`: deterministic outer-gzip + inner-gzip JSONL for the
  current Vite/SWE loading behavior
- `manifest.json`: source, acquisition timestamp, object count, epoch range,
  checksum, malformed/skipped/duplicate counts, ISS/HST presence, and format
  limitations

Generated releases live under:

```text
data/runtime-packs/satellite-tle/
```

They remain ignored by Git and excluded from Docker build contexts.

## Normalization

The parser consumes CelesTrak 3LE records and validates:

- name line plus TLE lines 1 and 2
- matching catalog number on both lines
- checksums
- parseable epoch
- unique NORAD identity preserved as a string

The normalized ORAS record contains only source-backed fields required by SWE:

- model `tle_satellite`
- NORAD source ID
- exact TLE lines
- source name, NORAD alias, and COSPAR alias when present
- Starlink group only when the source name identifies Starlink
- CelesTrak provenance

The pipeline does not invent magnitude, visibility, ownership, status, or
physical properties.

## Install And Rollback

Installation validates a staged release before activation, rejects symlinks and
unsafe target paths, installs the manifest last, and atomically swaps the
`current` release directory. The previous release is retained with a timestamp
for rollback.

Production mounts the current release read-only into:

- backend: `/runtime/oras-satellite-tle`
- frontend: the existing Sky Engine `skydata` satellite feed location

Containers must be recreated after an atomic release swap so file bind mounts
resolve the new release inode. The repository feed remains a development
fallback, but generated production data is not baked into images.

## Runtime Status

`GET /api/sky/satellite-feed` reports:

- mounted/degraded status
- source and acquisition time
- record count and epoch range
- nearest/newest freshness for an optional requested time
- checksum and release version
- ISS/HST presence
- TLE catalog-number limitation

`/api/above-me` continues to include only records within the validated TLE-age
window and reports explicit stale/degraded state.

## Commands

The root package exposes:

- `npm run satellites:build`
- `npm run satellites:validate`
- `npm run satellites:install`

Build accepts a local fixture/input path so tests and CI never require network
access. Network acquisition is explicit and rate-conscious.

## Validation

Acceptance requires:

- fixture-driven parser and build tests
- checksum and double-gzip validation
- malformed, duplicate, stale, missing ISS, symlink, and rollback tests
- source IDs remain strings
- backend status endpoint tests
- existing exact lookup and propagation tests
- generated release ignored by Git and Docker
- Docker-mounted feed status
- browser satellite parse count is positive
- ISS exact link still selects correctly

## Deferred

- OMM and six-digit catalog-number support in SWE
- Space-Track authenticated acquisition
- operator-provided supplemental GP blending
- satellite magnitude enrichment
- pass prediction beyond the current bounded above-me propagation path
