# ORAS Local Planetary Ephemeris Design

## Goal

Make Sun, Moon, and major-planet discovery independent of JPL Horizons network
availability while preserving the existing `Solar System (JPL)` identity and
Sky Engine link contracts.

## Current Gap

`fetch_jpl_ephemeris()` currently performs up to nine serialized Horizons API
requests for each uncached observer/hour. When Horizons is unavailable,
`/api/sky/object` cannot resolve solar-system objects and `/api/above-me`
returns no solar-system candidates.

## Selected Source

Use the public JPL/NAIF `de442s.bsp` kernel:

- source: `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp`
- authority: NASA/JPL Navigation and Ancillary Information Facility
- size: approximately 31.2 MB
- coverage: 1849-12-26 through 2150-01-22 TDB
- lineage: DE442, integrated May 2024 as an update to DE440

The kernel is runtime data. It is downloaded into an ignored host directory,
validated by size and SHA-256, and mounted read-only into the backend. It is
never committed or copied into a Docker image.

## Architecture

```text
DE442s acquisition -> checksum manifest -> read-only runtime mount
                                        -> Skyfield local propagation
                                        -> normalized JPL ephemeris payload
                                        -> /api/sky/object and /api/above-me
                                        -> /oras-sky-engine/ exact links
```

Local DE442s propagation is primary. Existing Horizons observer requests remain
the controlled fallback when the local pack is missing, invalid, or outside its
coverage. If both paths fail, the existing explicit missing-object/empty-source
behavior remains; no coordinates are fabricated.

## Local Propagation

The existing Skyfield dependency loads the mounted BSP with `load_file()` and
uses a built-in timescale so runtime propagation does not trigger hidden data
downloads. For each requested UTC time and observer, it computes:

- apparent RA/Dec in ICRF-aligned axes
- geometric topocentric altitude and azimuth
- observer-to-target distance
- exact UTC time basis
- kernel/source provenance

DE442s directly contains the Sun, Moon, Mercury, Venus, and Earth. Mars through
Neptune use the corresponding planetary barycenters supplied by the kernel;
that target reference is disclosed in output metadata.

## Runtime Contract

The authoritative identity remains:

```text
catalog=Solar System (JPL)
source_id=<sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune>
model=<sun|moon|planet>
```

Payloads gain source-backed metadata without breaking existing fields:

- `ephemeris_source`: `jpl_de442s_local` or `jpl_horizons`
- `target_reference`
- `distance_au` when available
- provenance identifying the JPL kernel or Horizons

The Above Me source-status metadata reports whether local ephemeris is loaded,
degraded to Horizons, or unavailable.

## Failure Handling

- Missing manifest/kernel: report local status `degraded`; try Horizons.
- Checksum/size mismatch: reject the local pack; try Horizons.
- Out-of-range time: do not extrapolate; try Horizons.
- Invalid observer/time: preserve current validation errors.
- Local calculation error: log source failure; try Horizons.
- Both sources unavailable: return controlled missing data, never guessed data.

## Validation

- Unit-test manifest/checksum validation and missing/corrupt states.
- Unit-test deterministic DE442s propagation when the runtime pack is present.
- Compare local results with Horizons at a fixed observer/time within bounded
  angular and alt/az tolerances.
- Prove exact object lookup and `/api/above-me` work with Horizons disabled.
- Prove Horizons fallback still works when the local pack is missing.
- Validate Docker images are kernel-free and the backend mount is read-only.
- Re-run backend, frontend, and ORAS deep-link browser validation.

## Non-Goals

- No asteroid, comet, spacecraft, or planetary-satellite expansion.
- No frontend redesign or new Hub/WordPress surface.
- No change to Sky Engine rendering or survey imagery.
- No committed BSP kernel and no Docker-baked ephemeris data.
