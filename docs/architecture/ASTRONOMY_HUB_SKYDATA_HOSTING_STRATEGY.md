# Astronomy Hub Skydata Hosting Strategy

Date: 2026-05-15  
Status: strategy derived from the measured Stellarium Web audit, with unresolved items kept explicit

## Decision Rule

Astronomy Hub should not depend on permanently cloning Stellarium's CDN. Each family is classified on two axes:

1. provenance: `public external`, `Stellarium-hosted`, `derived/mirrored`, or `unresolved`
2. action: `keep external`, `mirror locally`, `rebuild locally`, or `unresolved`

Use public authoritative sources where direct use is acceptable. Host locally when parity depends on Stellarium-specific packaging, runtime shape, or assets that are not safe to assume from a third-party CDN.

## Hosting Classification

| Family | Provenance | Astronomy Hub action | Reason |
| --- | --- | --- | --- |
| minimal/base/extended star `.eph` packs | Stellarium-hosted optimized packs | rebuild locally | runtime parity needs `.eph` tiles; long-term CDN cloning is not acceptable |
| Gaia `.eph` survey | derived from public Gaia, Stellarium-hosted pack | rebuild locally | runtime consumes tiles, not live Gaia APIs |
| base/extended DSO `.eph` packs | Stellarium-hosted optimized packs | rebuild locally | catalog data can be public, but the runtime pack format is Stellarium-specific |
| DSS colored survey | derived/mirrored public survey | keep external or selectively mirror locally | public lineage exists; local mirror only if parity, latency, or terms require it |
| Milky Way survey | Stellarium-hosted derivative | mirror locally | runtime expects a ready HiPS image survey and the observed asset is Stellarium-specific |
| Moon/Sun imagery | observed Stellarium-hosted image surveys | mirror locally | runtime parity now has measured SSO imagery dependencies |
| planet imagery | observed Stellarium-hosted image surveys | mirror locally | focused Jupiter flow loaded Jupiter, Io, and Callisto survey tiles |
| HiDEF DSS depth | same DSS colored survey, higher HiPS orders | mirror locally or use controlled fallback while mirroring | focused M31 verification showed HiDEF is DSS `Norder8`/`Norder9`, not a separate family |
| skycultures | Stellarium-specific assets | mirror locally | labels, illustrations, and metadata are runtime assets, not generic APIs |
| landscapes | Stellarium-specific assets | mirror locally | runtime depends on named image packs and descriptions |
| minor planets | public MPC input | keep external for ingestion, host generated runtime copy | ingest from MPC, serve ORAS-owned promoted runtime file |
| comets | public MPC input | keep external for ingestion, host generated runtime copy | same pattern as minor planets |
| satellites | public orbital inputs, Stellarium-hosted bundle | keep external for ingestion, host generated runtime copy | build ORAS bundle from approved sources such as CelesTrak-class feeds |
| object search/index | observed external service surface | replace locally | focused routes hit `api.noctuasky.com`; production runtime should not depend on third-party object lookup APIs |

## Recommended Topology

### Keep External

- Public survey endpoints that are already intended for direct external consumption, after survey-by-survey terms review.
- Official catalog refresh sources for ingestion:
  - Gaia archive exports
  - MPC minor-planet and comet feeds
  - approved satellite-element sources

### Host Locally

- all `.eph` star and DSO packs
- Gaia runtime tiles
- skycultures
- landscapes
- Milky Way runtime imagery
- any Stellarium-only or parity-critical optimized mirror
- promoted runtime copies of MPC/comet/satellite data

### Replace With Astronomy Hub Services

- object search/autocomplete
- object detail lookup
- exact source-ID lookup

These should be backed by ORAS-owned normalized data and APIs, not by `api.noctuasky.com`.

## Local Pack Requirements

### `.eph` Families

Astronomy Hub cannot safely emit runtime-compatible `.eph` packs until it owns or validates a writer that reproduces:

- `EPHE` framing
- file version and chunk structure
- `JSON` metadata handling
- tile header and NUNIQ encoding
- table descriptors
- compression
- byte-shuffle behavior
- CRC behavior
- `children_mask` semantics

Minimum target families:

- bright stars from Hipparcos / Bright Star Catalogue inputs
- deeper stars from Gaia
- DSO packs from approved DSO catalogs

### Image HiPS Families

The public-source investigation found a usable distinction:

- image HiPS generation is supported by Stellarium `hipster`
- targeted inspection of official desktop source found no matching Web `.eph` writer evidence
- `.eph` generation is still unresolved

Astronomy Hub can therefore plan image-survey pipelines separately from `.eph` pack pipelines.

## External Source Map

| Runtime family | Replace/mirror from |
| --- | --- |
| Gaia metadata and deeper star source data | Gaia archive exports |
| bright-star inputs | Hipparcos and Bright Star Catalogue |
| DSO inputs | approved DSO catalogs such as Stellarium DSO, HyperLeda, SIMBAD/OpenNGC where licensing allows |
| DSS imagery | official DSS/CDS lineage |
| minor planets and comets | MPC |
| satellites | approved orbital-element providers |

## Parity Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| no proven `.eph` writer | blocks lawful local star/DSO pack regeneration | resolve writer provenance or implement against documented contract with fixture parity |
| hidden or optional public sources | incomplete runtime parity map | keep measured coverage explicit; do not infer unobserved families |
| incomplete DSS deep orders | visible lowDEF fallback during deep DSO zoom | mirror DSS `Norder8`/`Norder9` locally or use a controlled missing-asset fallback while the mirror is incomplete |
| Stellarium-specific skyculture/landscape assets | parity drift if omitted | mirror selected assets locally with explicit provenance |
| external search service dependency | runtime fragility and third-party coupling | replace with ORAS-owned search/index APIs |
| public-source freshness | stale SSO/satellite content | schedule ingestion, provenance tracking, and promoted runtime bundles |

## Current Decision State

- `rebuild locally`: stars, Gaia tiles, DSO packs
- `mirror locally`: skycultures, landscapes, Milky Way, verified parity-critical image packs
- `keep external for ingestion`: public catalogs and official survey sources
- `replace locally`: object search/index APIs
- `unresolved`: `.eph` writer provenance

## Validation Boundary

This strategy is evidence-backed but not a completion claim. It is anchored to:

- source code in `study/stellarium-web-engine`
- fresh browser evidence in `study/web/stellarium_web_skydata_audit_2026-05-15`
- a limited public-source generator provenance check

It remains `PARTIAL` until:

1. all required runtime families have measured coverage or explicit disposition,
2. `.eph` writer provenance is solved,
3. DSS deep-order mirroring reaches the locally required parity depth.
