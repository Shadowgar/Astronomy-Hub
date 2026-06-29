# ORAS Major Catalog Update Design

## Goal

Deliver a visible, source-backed catalog release in `/oras-sky-engine/` across
stars, DSOs, double stars, and unusual objects without committing raw bulk data
or replacing the contained Stellarium Web Engine runtime.

## Architecture

The release uses a hybrid catalog-pack architecture:

1. Native Stellarium HATS/Eph star and DSO packs remain the dense renderer data
   path.
2. ORAS catalog packs provide versioned, bounded JSONL search/detail indexes
   that the browser loads directly.
3. The backend mounts the same packs read-only for `/api/sky/search` and
   `/api/sky/object`, preserving exact-link round trips.
4. A bounded overlay materializes catalog objects that SWE cannot natively
   ingest, rather than pretending the native renderer supports a new model.

Generated packs live under `data/runtime-packs/catalog-packs/`, remain ignored
by git, and are mounted into both frontend and backend containers. Source code,
schemas, tests, and documentation are committed; generated bulk is not.

## Pack Contract

`manifest.json` contains release metadata and one entry per pack:

- pack ID, label, category, version, generated timestamp
- authoritative source names, URLs, versions, and attribution
- total object count and browser-index count
- chunk path, object count, byte size, and SHA-256
- load mode and overlay policy
- optional missing-data or license notes

Each JSONL record preserves:

- `catalog`, string `source_id`, `model`, canonical/display name
- aliases, common names, object types, category
- source-backed RA/Dec and optional photometric/physical fields
- source attribution and pack/version provenance
- explicit unavailable fields omitted rather than synthesized

Malformed packs fail independently. The runtime remains usable and reports the
failure in the status panel.

## Release Packs

### `stars-core`

Build from current Hipparcos Tier 2 and bright-star data, with adapters for
Gaia DR3, Tycho-2, and Gliese/Wolf/nearby-star exports. It supplies searchable
IDs, richer color/parallax/proper-motion/spectral metadata, and bounded overlay
support where native SWE objects are unavailable.

### `dso-expanded`

Build from normalized OpenNGC plus source-backed catalog imports and aliases for
Messier, Caldwell, NGC, IC, Collinder, Melotte, Trumpler, Barnard, LBN, LDN,
Sharpless, Arp, Markarian, and 3C. Existing OpenNGC coordinates remain primary
where a verified cross-match exists.

### `double-stars`

Build from WDS and source-backed Struve cross-references. Preserve system and
component identity, separation, position angle, component magnitudes, epoch,
and source attribution. Combined magnitude is included only when provided or
calculated from two source magnitudes using the documented flux formula.

### `unusual-objects`

Build from ATNF pulsars, a licensed/public quasar source such as Milliquas, and
BlackCAT or another source whose terms permit local generation. Preserve
catalog-specific properties such as period, redshift, flux, and candidate
status without coercing them into star/DSO semantics.

## Runtime Experience

The navigation drawer gains an `ORAS Catalog Packs` action opening a visible
status panel. Search rows show category and catalog badges. Selected-object
details show an `ORAS Enhanced` block with canonical name, aliases, catalog
IDs, source/version badges, and available source-backed properties.

Search combines local pack results with existing SWE/backend results, deduped
by `catalog + source_id + model`. Selecting a pack result creates or resolves a
SWE object through existing materialization and camera-lock paths. Copy links
use the existing exact identity contract.

## Error Handling

- Missing manifest: runtime loads normally and status shows `not mounted`.
- Missing/bad chunk: only that pack fails; other packs remain searchable.
- Unsupported object model: record remains searchable/detail-visible and uses
  a bounded coordinate marker only when real RA/Dec exists.
- Missing field: omitted or shown as unavailable; never fabricated.
- Duplicate identity: highest-priority source wins display fields while all
  source attribution remains visible.

## Validation

Acceptance requires unit tests, generated pack schema/count/checksum proof,
backend exact-link proof, frontend search/detail/status tests, a rebuilt
Stellarium runtime, Docker validation, deep-link regression, and browser
screenshots for each major catalog category.

## Authority Conflict

The user allowed proprietary app/CDN copying, but repository authority forbids
copying Stellarium CDN data. This release therefore uses public upstream
catalogs and existing source-backed repository data only. Public release pages
may be inspected for competitive comparison.
