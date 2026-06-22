# Sky Engine Catalog Superiority Plan

Status: Active planning matrix and bounded implementation guide

Updated: 2026-06-22

Runtime: `/oras-sky-engine/`

Discovery API: `/api/above-me`

## Purpose

ORAS catalog superiority means deeper, better-attributed identity, aliases,
search, and object metadata without copying proprietary application data or
shipping unbounded browser payloads. Catalog records must come from public,
source-backed upstream data. The shared registry describes sources and alias
rules; it is not an object catalog.

The competitive audit for this pass inspected the public Stellarium Mobile App
Store and Google Play metadata on 2026-06-22. The App Store release notes list
Gaia DR3, Tycho-2, Collinder, Melotte, Trumpler, Gliese, WDS, Struve, Arp,
Barnard, Lynds, Sharpless, Markarian, 3C, Wolf, nearby stars, double stars,
pulsars, quasars, black holes, names, magnitudes, colors, and physical
properties as recent catalog improvements. No application binary was reverse
engineered and no Stellarium CDN data was copied because neither is required to
use the authoritative upstream catalogs.

Competitive references:

- <https://apps.apple.com/us/app/stellarium-mobile-star-map/id1458716890>
- <https://play.google.com/store/apps/details?id=com.noctuasoftware.stellarium_free>

## Decision Rules

- Source IDs remain strings from ingestion through URLs and JavaScript.
- Raw Gaia-scale data is never committed or baked into Docker.
- Large catalogs require mounted, tiled, indexed, or database-backed storage.
- Alias rules may expose only identifiers already present in source-backed
  records or validated cross-match tables.
- Unknown identifiers return not found. No alias, coordinate, magnitude,
  distance, description, or physical property is inferred.
- `/api/above-me` receives only coordinate-bearing records that pass the
  existing validated visibility and ranking path.
- Licensing and attribution are verified again before each importer is enabled.

Surface abbreviations used below: `S` search, `O` exact object lookup, `A`
above-me, `D` detail metadata, `L` exact links, and `R` runtime rendering.

## Stars

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Gaia DR3 / EDR3 | Stars, astrometry, photometry | ESA Gaia Archive | <https://www.cosmos.esa.int/web/gaia/dr3>; TAP/ADQL bounded exports | Gaia acknowledgement/data policy | about 1.8B sources | No | Yes | S,O,A,D,L,R | P0 | Pilot manifest only | Build magnitude-limited spatial tiles/index; never browser JSON or Docker bulk. |
| Tycho-2 | Bright/intermediate stars | CDS VizieR I/259; ESA lineage | <https://cdsarc.cds.unistra.fr/viz-bin/cat/I/259> | Cite catalog and VizieR; verify redistribution terms | about 2.54M | Not as committed JSON | Yes | S,O,A,D,L,R | P1 | Planned | Strong bridge between Hipparcos and Gaia depth. |
| Hipparcos | Bright stars | ESA Hipparcos; CDS I/239 | <https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239> | Cite ESA catalog/VizieR | 118,218 | Yes as indexed data | Already | S,O,A,D,L,R | P1 | 61,675-row Tier 2 active | Normalize remaining identity/alias coverage before replacement. |
| Bright Star Catalogue | Bright named stars | Yale BSC; CDS V/50 | <https://cdsarc.cds.unistra.fr/viz-bin/cat/V/50> | Cite Hoffleit/Warren and VizieR | 9,110 | Yes | Already | S,O,A,D,L,R | P1 | Local subset active | Good source for names, spectral types, colors, and multiple-star flags. |
| Gliese / CNS3 | Nearby stars | Gliese/Jahreiss; CDS V/70A | <https://cdsarc.cds.unistra.fr/viz-bin/cat/V/70A> | Cite catalog/VizieR; verify redistribution terms | about 3,800 | Yes | Yes | S,O,A,D,L | P1 | Planned | Cross-match to Gaia/Hipparcos rather than duplicate positions. |
| Wolf / nearby-star aliases | Nearby/high proper-motion stars | Gliese/CNS and source cross-identifications | CDS/SIMBAD cross-match acquired through bounded importer | Source-specific attribution; no unsourced name table | TBD after source audit | No | Yes | S,O,D,L | P2 | Source selection pending | Treat Wolf numbers as aliases to canonical stars when cross-match is proven. |
| Closest stars | Curated nearby-star ranking | RECONS plus Gaia-backed distances | <https://www.recons.org/> and Gaia Archive | RECONS/Gaia attribution; verify reuse terms | bounded hundreds | No | Yes | S,A,D,L | P2 | Planned | A ranking/view over canonical stars, not another identity catalog. |
| Star colors / physical properties | Stellar astrophysics | Gaia DR3 astrophysical parameters, BSC spectral data | Gaia TAP bounded columns; BSC cross-match | Preserve per-field source and uncertainty | hundreds of millions upstream | No | Yes | D,R | P1 | Planned | Only expose measured/source fields; no color or mass inference in API. |

## Double And Multiple Stars

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| WDS | Double/multiple systems | US Naval Observatory | <https://crf.usno.navy.mil/wds/>; current fixed-width files | USNO acknowledgement requested; verify redistribution | about 149,000 systems at audit | Index feasible; raw commit no | Yes | S,O,A,D,L,R | P1 | Planned | Preserve system and component identity, separation, PA, epoch, and magnitudes. |
| Struve | Double-star discoverer aliases | USNO WDS cross-reference files | WDS Friedrich/Otto Struve cross-references | USNO acknowledgement; retain WDS authority | thousands of aliases | Yes as cross-match index | Yes | S,O,D,L | P1 | Planned | Alias layer over WDS, not independent stars. |
| Double-star handling | Systems/components | WDS plus canonical star catalogs | Derived normalized system/component model | Every field retains source catalog | N/A | No | Yes | O,D,L,R | P1 | Design required | Avoid collapsing components into one star or double-counting systems. |

## Open Clusters

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Collinder | Open clusters | Original catalog; CDS/SIMBAD and modern B/ocl cross-matches | <https://cdsarc.cds.unistra.fr/viz-bin/cat/B/ocl> | Verify catalog-specific reuse; cite original and cross-match source | about 470 identifiers | Yes after cross-match audit | Yes | S,O,A,D,L | P1 | Planned | Prefer aliases on canonical NGC/IC/open-cluster records. |
| Melotte | Open clusters | Original catalog; CDS/SIMBAD and B/ocl | <https://cdsarc.cds.unistra.fr/viz-bin/cat/B/ocl> | Same as Collinder | about 245 identifiers | Yes after audit | Yes | S,O,A,D,L | P1 | Planned | High-value familiar aliases such as Melotte 22. |
| Trumpler | Open clusters | Original catalog; CDS/SIMBAD and B/ocl | <https://cdsarc.cds.unistra.fr/viz-bin/cat/B/ocl> | Same as Collinder | tens of original identifiers | Yes after audit | Yes | S,O,A,D,L | P1 | Planned | Validate historical numbering before normalization. |

## Nebulae And Dark Nebulae

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| Barnard | Dark nebulae | Barnard catalog; CDS VII/220A | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/220A> | Cite Barnard catalog and VizieR; verify reuse terms | 349 | Yes | Yes | S,O,A,D,L,R | P1 | Planned | Coordinates and diameters are source-backed; opacity where available. |
| Lynds dark nebulae | Dark nebulae | Lynds catalog; CDS VII/7A | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/7A> | Cite Lynds 1962 and VizieR; verify reuse terms | 1,791 | Yes | Yes | S,O,A,D,L,R | P1 | Planned | Import as canonical records or validated cross-matches, not aliases alone. |
| Lynds bright nebulae | Bright nebulae | Lynds catalog; CDS VII/9 | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/9> | Existing cross-identifiers come through OpenNGC CC-BY-SA-4.0; cite Lynds/CDS | 1,125 upstream; 92 local cross-matches | Yes after terms audit | Yes | S,O,A,D,L | P0 | Pilot active in this pass | Long-form aliases are generated only for existing OpenNGC LBN identifiers. |
| Sharpless | H II regions | Sharpless catalog; CDS VII/20 | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/20> | Cite Sharpless 1959 and VizieR; verify reuse terms | 313 | Yes | Yes | S,O,A,D,L,R | P1 | Planned | Normalize Sh 2 identifiers and preserve angular extent. |

## Galaxies And Special Catalogs

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| HyperLEDA | Galaxies | HyperLEDA | <http://leda.univ-lyon1.fr/>; API/export after terms review | Attribution and redistribution terms must be confirmed | millions | No | Yes | S,O,A,D,L | P2 | Planned enrichment | Use for source-attributed galaxy properties/cross-IDs, not identity replacement. |
| Arp | Peculiar galaxies | Arp catalog; CDS VII/74A | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/74A> | Cite Arp catalog and VizieR; verify reuse terms | 338 | Yes | Yes | S,O,A,D,L | P1 | Planned | Cross-match aliases to canonical NGC/IC where possible. |
| Markarian | UV-excess galaxies | Markarian catalogs via CDS/VizieR | CDS catalog selected after license/schema audit | Source-specific acknowledgement required | about 1,500 | Yes after source audit | Yes | S,O,A,D,L | P2 | Source selection pending | Do not infer AGN class from name alone. |

## Radio, High-Energy, And Unusual Objects

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| 3C | Radio sources | Revised Third Cambridge catalog; CDS VIII/1A | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VIII/1A> | Cite catalog and VizieR; verify reuse terms | 471 | Yes | Yes | S,O,A,D,L | P2 | Planned | Cross-match to canonical galaxy/quasar identities where proven. |
| Pulsars | Pulsars | ATNF Pulsar Catalogue | <https://www.atnf.csiro.au/research/pulsar/psrcat/> | ATNF requested acknowledgement and version provenance | more than 3,000; exact at import | Index feasible | Yes | S,O,A,D,L | P2 | Planned | Keep timing/position epoch and catalog version. |
| Quasars | Quasars/AGN | Million Quasars v8; CDS VII/294 | <https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/294> | Cite catalog/VizieR and verify license | about 1.02M | Database/index only | Yes | S,O,A,D,L,R | P2 | Planned | Magnitude-bounded spatial index; preserve confidence/class fields. |
| Black holes | Stellar black-hole systems | BlackCAT | <https://www.sc.eso.org/~jcorral/BlackCAT/> | BlackCAT acknowledgement/citation required; verify export terms | fewer than 100 systems | Yes after terms audit | Yes | S,O,A,D,L | P2 | Planned | Never label candidates as confirmed; preserve classification status. |

## DSO Identity And Content

| Catalog/source family | Object class | Authority/upstream | URL or acquisition | License/attribution notes | Expected size | Full now? | Pilot now? | Surfaces | Priority | Status | Notes |
|---|---|---|---|---|---:|---|---|---|---|---|---|
| OpenNGC | NGC/IC DSOs | OpenNGC | <https://github.com/mattiaverga/OpenNGC> normalized local gzip | CC-BY-SA-4.0 | 12,516 normalized local records | Yes | Active | S,O,A,D,L,R | P0 | Active | Primary DSO identity/cross-match source. |
| Caldwell | Curated DSO aliases | Existing source-backed OpenNGC identifiers | Registry-style bounded alias expansion | OpenNGC attribution applies | 109 | Yes | Active | S,O,A,D,L | P0 | Active | Alias only; canonical NGC/IC identity remains authoritative. |
| Messier | Curated DSOs | Local compatibility plus OpenNGC cross-match | Existing bounded local records | Repository plus OpenNGC attribution | 110 upstream; 13 local compatibility seeds | Yes | Active | S,O,A,D,L,R | P0 | Active/partial | Replace seed dependence with canonical cross-match coverage over time. |
| NGC | DSOs | OpenNGC | Existing compact normalized catalog | CC-BY-SA-4.0 | about 7,840 nominal IDs | Yes | Active | S,O,A,D,L,R | P0 | Active | Compact and spaced forms resolve. |
| IC | DSOs | OpenNGC | Existing compact normalized catalog | CC-BY-SA-4.0 | about 5,386 nominal IDs | Yes | Active | S,O,A,D,L,R | P0 | Active | Compact and spaced forms resolve. |
| Common names | Object aliases | OpenNGC and explicitly licensed curated sources | Cross-match/enrichment only | Per-source attribution required | derived | No single bulk source | Yes | S,O,D,L | P1 | Partial | Do not scrape or invent names. |
| Wikipedia-style descriptions | Descriptive text | Wikipedia/Wikidata only where approved | Revision-pinned API/import | CC-BY-SA attribution/share-alike and revision provenance | bounded selected objects | No | Yes | D | P3 | Deferred | No descriptions until licensing, revision, and display contract are explicit. |

## Current ORAS Support Inventory

- Gaia: Gaia DR2 database lookup and string-safe exact identity; a Gaia DR3
  pilot manifest exists, but no full DR3 importer or runtime tile pipeline.
- Hipparcos: 61,675 normalized Tier 2 stars participate in exact lookup and
  bounded above-me ranking.
- OpenNGC: 12,516 normalized NGC/IC records in a 1.1 MB gzip support search,
  exact lookup, enrichment, and bounded above-me candidate generation.
- Messier: bounded local compatibility records are enriched from OpenNGC when
  a cross-match exists.
- Caldwell: source-backed OpenNGC identifiers generate bounded `C`, spaced,
  zero-padded, and `Caldwell` aliases.
- Compact IDs: both compact and spaced NGC/IC forms normalize and search.
- Common names: OpenNGC-provided common names are searchable and returned; no
  generated descriptions are present.
- APIs: `/api/sky/search`, `/api/sky/object`, and `/api/above-me` are active.
- Exact links: `catalog + source_id + model` remain authoritative, with real
  RA/Dec as fallback coordinates and large source IDs kept as strings.
- Runtime routing: the vendored Stellarium frontend searches the backend and
  materializes exact source-backed objects through the current route contract.
- Other active data: JPL-backed solar-system lookup and Skyfield-propagated
  local TLE satellites remain separate from the catalog alias registry.

## Pass 2 Implementation Slice

This pass implements LBN long-form alias expansion for the 92 LBN
cross-identifiers already present in normalized OpenNGC records. For example,
`LBN 350`, `LBN350`, and `Lynds Bright Nebula 350` resolve to `IC5070` (Pelican
Nebula). The exact object response includes OpenNGC and LBN attribution.

The slice does not import the 1,125-row LBN catalog, add coordinates, or add
records to `/api/above-me`. An out-of-range or absent LBN alias remains not
found. A later LBN importer may add canonical records only after source terms,
schema, deduplication, and runtime DSO materialization are validated.

## Recommended Import Order

1. Tycho-2 indexed pilot with Gaia/Hipparcos identity reconciliation.
2. Collinder/Melotte/Trumpler source-backed cross-match aliases.
3. Barnard/LDN/Sharpless bounded DSO import with angular extent.
4. WDS system/component model and Struve cross-reference pilot.
5. Gaia DR3 magnitude-limited spatial tile/index pipeline.
6. Arp/Markarian/3C cross-match enrichment.
7. Pulsar/quasar/black-hole specialized object models after runtime display
   semantics are defined.
