# ORAS Canonical Star Chain Design

## Goal

Correct duplicate, oversized, over-bright, and incorrectly colored ORAS stars
by following Stellarium Web Engine's native star survey model instead of
layering overlapping bright-star catalogs.

## Confirmed Root Cause

Stellarium Web Engine renders every loaded star survey. It does not perform
generic position-based or identity-based deduplication between surveys.

The stock ORAS chain is intentionally disjoint:

- minimal stars: `-1.0859375 <= V <= 7.0`
- base stars: `7.0 <= V <= 8.0`
- extended stars: `8.000020980834961 <= V <= 11.5`
- bundled Gaia: registered with key `gaia`, so SWE suppresses Gaia rows
  brighter than the preceding non-Gaia survey ceiling

The current ORAS dense-star profiles are loaded in addition to minimal, base,
and extended. Their bright Gaia, Hipparcos, Tycho-2, and Gliese records overlap
the stock stars and each other. SWE paints each record, producing additive
brightness and visible duplicates.

The dense-star builder also copies one generic magnitude into both `vmag` and
`gmag`, and copies a generic color index into `bv`. This incorrectly treats
Gaia G as Johnson V and Gaia BP-RP as Johnson B-V.

## Approaches Considered

### 1. Runtime positional deduplication

Reject. A fixed angular tolerance can collapse real double-star components,
depends on epoch and proper motion, and duplicates catalog reconciliation in
the renderer.

### 2. Keep the overlay but dim or hide bright rows

Reject. This masks symptoms, retains duplicate identities, and does not fix
photometric-system corruption.

### 3. Canonical native survey replacement

Selected. Build one reconciled native EPHE survey per ORAS profile. When a
profile is active, use it instead of the stock minimal/base/extended surveys.
Register the bundled Gaia survey afterward under the native `gaia` key so SWE
uses it only beyond the canonical profile ceiling. Keep `Off` as the untouched
stock Stellarium chain.

## Canonical Identity

Catalog rows are joined only through source-backed identifiers:

- Gaia DR3 `Source`
- Gaia DR3 `HIP` crossmatch
- Gaia DR3 `TYC2` crossmatch
- Tycho-2 `HIP` crossmatch
- Hipparcos identifier

No angular-position merge is used. This preserves real close binaries.

Gliese CNS3 remains available to search and detail APIs, but its rows are not
rendered in the canonical survey unless a source-backed HIP, Tycho, or Gaia
crossmatch is present. The current CNS3 source does not provide those
crossmatches.

## Photometry

Canonical records retain explicit source photometry:

- Hipparcos: Johnson V and B-V
- Gliese: Johnson V and B-V, when safely crossmatched in future data
- Tycho-2: BT and VT, converted within the documented validity range
- Gaia DR3: G and BP-RP retained as Gaia fields

Visual photometry priority:

1. source-backed Johnson V and B-V
2. Tycho BT/VT transformed to Johnson V and B-V
3. Gaia EDR3/DR3 G and BP-RP transformed with the official Gaia photometric
   relationships and their published applicability ranges
4. if a safe color conversion is unavailable, omit B-V rather than re-label
   BP-RP as B-V

Every EPHE row keeps distinct `vmag` and `gmag` semantics. The build report
counts transformed, native, and unavailable photometry.

## Runtime Registration

At startup:

- profile `off`: register stock minimal, base, extended, then bundled Gaia
- active ORAS profile: register only the canonical profile, then bundled Gaia

The ORAS profile maximum magnitude becomes Gaia's native lower boundary through
the existing SWE `gaia` behavior. The same physical bright stars are therefore
not rendered twice.

Profile changes still require a reload because SWE does not expose safe survey
removal/replacement through the current frontend integration.

## Exact-Link Native Binding

Exact star links first try authoritative native designations:

- `HIP <id>`
- `Gaia DR3 <id>` and engine-compatible Gaia designation
- `TYC <id>`
- source-backed aliases

Startup retries native resolution while star data sources register and tiles
become available. A fallback star object is created only after the bounded
native-resolution window expires. A successfully resolved native object is
selected and camera-locked directly.

Fallback objects remain necessary for API-backed stars not present in the
active rendered survey, but they must not be materialized on top of an
available native object.

## Gaia DR3 Scope

The mounted source currently contains a bounded 10,000-row Gaia DR3 bright
slice. It is sufficient for canonical bright-star reconciliation and exact
identity proof, but it is not an all-sky faint replacement for the bundled
3.5 GB Gaia survey.

This pass must not remove the bundled faint Gaia survey or claim full Gaia DR3
rendering. A future all-sky Gaia DR3 tile acquisition pass can replace that
continuation using the same native `gaia` contract.

## Generated Data

Generated canonical star tiles remain outside git and Docker images:

```text
data/runtime-packs/dense-star-tiles/
```

Committed files are limited to source adapters, builders, validators, runtime
integration, tests, documentation, and generated runtime shell bundles.

## Validation

Automated validation must prove:

- authoritative cross-ID merges
- no positional merging of close binary components
- one canonical row per HIP/Tycho/Gaia identity group
- source IDs remain strings
- Gaia BP-RP is never written directly as B-V
- Tycho and Gaia transformations obey documented validity ranges
- active ORAS profiles replace stock bright packs
- `off` preserves the stock chain
- exact links retry native binding before fallback creation
- missing native objects still receive a controlled fallback

Browser validation must compare `Off` and `Visual` at:

- Mizar and Alcor
- Caph
- Orion
- a 120-degree all-sky view

Acceptance requires no extra Mizar/Alcor/Caph copies, no additive bright blobs,
normal FOV-dependent star sizing, improved source-backed color variation, no
fatal JavaScript errors, and intact DSO, satellite, planet, and exact-link
behavior.
