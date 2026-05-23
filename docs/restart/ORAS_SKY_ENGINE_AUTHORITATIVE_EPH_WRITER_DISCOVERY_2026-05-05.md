# ORAS Sky-Engine Authoritative EPH Writer Discovery - 2026-05-05

## Scope

This document records the authoritative writer discovery pass for staged ORAS star-tile output.

The goal was to determine whether this repository, the vendored Stellarium Web Engine source, or the checked-in study copy already contain a runtime-compatible writer for star HiPS `.eph` tiles.

## Files Checked

Vendored upstream runtime and build paths:

- `vendor/stellarium-web-engine/src/eph-file.c`
- `vendor/stellarium-web-engine/src/eph-file.h`
- `vendor/stellarium-web-engine/src/modules/stars.c`
- `vendor/stellarium-web-engine/SConstruct`
- `vendor/stellarium-web-engine/tools/make-assets.py`
- `vendor/stellarium-web-engine/tools/make-hip-lookup.py`
- `vendor/stellarium-web-engine/tools/compute-ephemeris.py`

Local ORAS generation path checked:

- `scripts/sky-engine/build_hipparcos_tiles.py`

Study copy cross-check:

- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/eph-file.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/SConstruct`

## Discovery Commands

Exact compact search command used:

```bash
cd /home/rocco/Astronomy-Hub && rg -n --hidden -g '!**/node_modules/**' -g '!**/.venv/**' -g '!**/dist/**' -g '!**/build/**' 'EPHE|eph-file|children_mask|skydata/stars|Norder[0-9]+|STAR chunk|make-assets|make-hip|hipparcos' vendor/stellarium-web-engine study scripts | head -n 220
```

Key observed hits:

- `vendor/stellarium-web-engine/src/eph-file.c` defines the `EPHE` reader contract
- `vendor/stellarium-web-engine/SConstruct` calls `./tools/make-assets.py`
- `vendor/stellarium-web-engine/tools/make-assets.py` lists `.eph` as an existing asset type to package
- `vendor/stellarium-web-engine/tools/make-hip-lookup.py` generates `src/hip.inl`
- `scripts/sky-engine/build_hipparcos_tiles.py` writes JSON tile assets under `frontend/public/sky-engine-assets/catalog/hipparcos`

## Findings

Authoritative findings from checked code:

1. `vendor/stellarium-web-engine/src/eph-file.c` and `vendor/stellarium-web-engine/src/eph-file.h` define an `.eph` container reader and table decoder.
2. `vendor/stellarium-web-engine/src/modules/stars.c` defines the STAR table parse contract and `children_mask` traversal behavior.
3. `vendor/stellarium-web-engine/tools/make-assets.py` does not generate star tiles; it packages files that already exist on disk, including `.eph` files.
4. `vendor/stellarium-web-engine/tools/make-hip-lookup.py` does not emit tiles; it generates HIP lookup data for `src/hip.inl`.
5. `scripts/sky-engine/build_hipparcos_tiles.py` is not an `.eph` path; it emits JSON catalog tiles for ORAS-side proof assets.
6. The checked-in study copy matches the vendored result: reader paths are present, but no checked-in star-tile `.eph` writer was found.

## Decision

Selected strategy:

- `C`

Meaning:

- stop at the exact blocker
- do not emit guessed runtime-compatible `.eph` bytes
- keep staged proof output limited to normalized JSONL plus manifest

## Exact Blocker

> Runtime-compatible EPH output is blocked: the vendored runtime exposes an EPH reader and STAR chunk layout, but this repo does not contain a star-tile EPH writer to emit safe live-compatible bytes.

## What Is Safe Now

This discovery pass supports the following safe claims:

- ORAS understands the live read path and tile contract well enough to inspect it
- ORAS can export real Gaia rows into staged non-live proof artifacts
- ORAS cannot yet generate authoritative staged star `.eph` output from checked-in code alone

## Next Step

One of the following must happen before staged `.eph` emission is attempted:

- obtain the upstream star-pack generator used to create the bundled star survey
- or derive a writer from authoritative upstream source that covers chunk layout, compression, byte shuffle, CRC, row ordering, and `children_mask` semantics without guesswork

Until then, the correct status remains:

- `BLOCKED`