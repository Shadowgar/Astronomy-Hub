# ORAS Sky-Engine Self-Hosted Skydata Mirror Plan - 2026-05-05

## Goal

Build an ORAS-owned skydata pipeline that:

- preserves the current same-origin vendored ORAS Sky-Engine runtime
- removes production dependence on `stellarium-web.org`
- does not load giant Gaia datasets into frontend memory
- allows ORAS to match the public site's visible density and search quality in controlled steps
- keeps existing local bundled skydata stable until explicit replacement proof passes

## Non-Negotiable Rules

- the vendored ORAS Sky-Engine runtime remains the renderer
- no Babylon or custom renderer is reintroduced
- no production dependency is left on `stellarium-web.org`, `api.noctuasky.com`, or the observed public CDN hosts
- no downloader writes into `frontend/public/oras-sky-engine/skydata` by default
- no full Gaia import is required for this slice
- the first proof must be bounded and observable, not gigantic

## Official / Open Replacement Inventory

| Dataset class | Public class observed | Official / open replacement | ORAS ownership model | Local storage target | Runtime delivery shape | Legal note |
| --- | --- | --- | --- | --- | --- | --- |
| Deep star source catalog | public star packs plus Gaia survey metadata | ESA Gaia Archive bulk downloads and partner data access | ingest verified Gaia export slices into ORAS DB and pack builder | `data/sky-engine/oras-mirror/raw/gaia/` and `normalized/catalog/` | ORAS-generated star runtime packs, not direct frontend table load | Gaia citation and archive terms apply; review before bulk automation |
| Gaia density / sky maps | public `/surveys/gaia/v1/*` | CDS HiPS / HiPS catalog services for Gaia DR2 / EDR3 / DR3 density products | ORAS chooses explicit Gaia-compatible survey products and caches them | `data/sky-engine/oras-mirror/raw/cds/gaia/` and `runtime/surveys/gaia/` | same-origin survey tiles after ORAS cache build | CDS terms and survey-specific terms require review |
| General surveys / HiPS imagery | public Milky Way and other survey-style classes | CDS HiPS registry and source survey hosts | ORAS mirrors only selected approved surveys | `data/sky-engine/oras-mirror/raw/cds/surveys/` and `runtime/surveys/` | same-origin tile roots with ORAS metadata | survey-by-survey review required |
| Satellite elements | public `tle_satellite.jsonl.gz` bundle | CelesTrak GP queries in JSON, CSV, XML, or KVN OMM-compatible forms | ORAS fetches only required groups or IDs on approved cadence and compiles runtime bundle | `data/sky-engine/oras-mirror/raw/celestrak/` and `normalized/satellites/` | generated `tle_satellite.jsonl.gz` replacement bundle | CelesTrak usage limits and cadence rules must be respected |
| Minor planets | public `mpcorb.dat` | MPC `MPCORB.DAT.gz` or extended formats | ORAS mirrors official MPC files and normalizes freshness metadata | `data/sky-engine/oras-mirror/raw/mpc/` and `normalized/minor-planets/` | generated runtime-compatible minor-planet file | MPC acknowledgement requested; terms review still required |
| Comets | public `CometEls.txt` | MPC `CometEls.txt` or JSON equivalent | ORAS mirrors official MPC files and records timestamps | `data/sky-engine/oras-mirror/raw/mpc/` and `normalized/comets/` | generated runtime-compatible comet file | MPC acknowledgement requested; terms review still required |
| Object search metadata | public NoctuaSky API | ORAS-owned Postgres catalog built from Gaia, DSO, MPC, satellite, and alias datasets | ORAS backend owns search contracts | `normalized/catalog/` and Postgres tables | FastAPI search and detail endpoints | ORAS-owned contract; no external runtime dependency |
| Future flight layer | not part of public Stellarium boot path | OpenSky or other ADS-B source evaluated separately | keep isolated from satellite ingest | `raw/opensky/` and `normalized/flights/` | separate backend API only; no runtime coupling yet | OpenSky access, redistribution, and rate limits need explicit review |

## Proposed Local Filesystem Layout

Downloader and mirror outputs should stay out of the live runtime tree by default.

Proposed layout:

```text
data/
  manifests/
    oras_skydata_sources.template.json
  sky-engine/
    oras-mirror/
      raw/
        gaia/
        cds/
        celestrak/
        mpc/
        opensky/
      normalized/
        catalog/
        satellites/
        surveys/
        minor-planets/
        comets/
      runtime/
        stars/
        dso/
        surveys/
        satellites/
      staging/
      reports/
      proofs/
frontend/
  public/
    oras-sky-engine/
      skydata/
```

Write policy:

- downloader default output root is `data/sky-engine/oras-mirror/`
- `frontend/public/oras-sky-engine/skydata/` stays protected unless an explicit promotion step is approved
- promotion from `data/sky-engine/oras-mirror/runtime/` into the live same-origin runtime is a separate proof step

## Downloader Foundation Requirements

The downloader foundation must be manifest-driven.

Minimum behavior:

- every source must come from an explicit manifest entry
- dry-run support must be first-class
- resume support must exist for interrupted downloads
- per-source size limits must be enforced
- large download plans must refuse to run unless explicitly confirmed
- each successful download must emit a report record with source URL, local path, size, SHA-256, and license note when provided
- live runtime overwrite must be blocked by default

## Rough Storage Estimate

This slice does not compute a final production storage total because no large mirror was executed.

Current rough planning ranges are still useful:

- current bundled runtime artifacts already in the repo are small, in the MB-scale
- current public satellite bundle evidence is also small, about 1.4 MB for the observed `tle_satellite.jsonl.gz` class
- MPC and comet source files are small relative to surveys and Gaia, ranging from KB-scale to low-MB-scale in the observed public classes
- approved survey mirrors can grow into tens or hundreds of GB depending on survey count, order depth, and cached sky coverage
- Gaia raw source catalogs plus processed runtime artifacts are the dominant storage risk and should be treated as a high-hundreds-of-GB to TB-scale planning problem until bounded proof sizes are measured

Planning implication:

- ORAS has enough storage to pursue self-hosting, but the first real storage estimate should be produced from a populated manifest and one bounded Capella-region proof, not from a blind full-sky assumption

## Capella Star-Density Proof Plan

This is the first bounded density proof.

Why Capella:

- the public site visibly shows a denser background around Capella than the current local ORAS bundle
- current local ORAS star limits already explain the gap
- the field is bright, easy to test, and does not require a full-sky Gaia ingest to prove the path

Proof stages:

1. Capture the local baseline.
2. Record the current local star ceiling from `frontend/public/oras-sky-engine/skydata/stars/properties`.
3. Build a bounded source export around Capella from an official Gaia path.
4. Normalize that bounded export into ORAS catalog tables or a temporary proof artifact.
5. Generate a temporary deeper star runtime pack outside the live runtime tree.
6. Compare star count and screenshot parity in the Capella field before any promotion.

Required proof output:

- a proof artifact in `data/sky-engine/oras-mirror/proofs/`
- source metadata showing which official export was used
- count comparison between current local pack and proof pack for the Capella test field
- screenshot or scripted runtime comparison showing the density increase

What this proof explicitly does not do:

- full Gaia import
- giant browser-memory catalog load
- direct public Stellarium tile cloning into production

## Backend Ownership Plan

The backend must own readiness, search, and provenance before the runtime switches data sources.

Required first backend contracts:

- `GET /api/sky/catalog/status`
- `GET /api/sky/object/gaia-dr2/{source_id}`
- `GET /api/sky/search?q=`
- `GET /api/sky/surveys`
- `GET /api/sky/satellites`
- `GET /api/sky/data-health`

Bounded responsibilities:

- `catalog/status`: report which catalog classes are missing, partial, or ready
- `object/gaia-dr2/{source_id}`: source-id lookup against ORAS-owned Gaia proof data
- `search`: backend-owned alias and identifier resolution replacing NoctuaSky dependency over time
- `surveys`: approved survey inventory and active same-origin tile roots
- `satellites`: current ingest freshness and normalized snapshot identity
- `data-health`: source timestamps, import timestamps, and degradation state

## Ordered Rollout

1. Write audit and mirror plan docs.
2. Land manifest-driven downloader tooling and tests.
3. Add backend catalog status endpoint and Gaia source-id proof schema.
4. Produce a bounded Capella proof pack from official source inputs.
5. Add ORAS-owned satellite ingest and generated runtime bundle.
6. Add ORAS-owned survey inventory and selected approved HiPS cache.
7. Promote proven runtime outputs into the same-origin tree only after side-by-side proof passes.

## Exact Next Implementation Prompt

Use this exact prompt for the next execution slice:

```text
Astronomy Hub - Backend Catalog Status + Gaia Source-ID Proof

Context:
- The same-origin ORAS Sky-Engine runtime remains the renderer.
- Do not modify renderer ownership, iframe hosting, or vendored runtime behavior.
- Do not import full Gaia.
- Use the existing architecture doc and mirror-plan docs as authority for this slice.

Goal:
- Implement the first backend-owned proof for ORAS sky catalog readiness.

Required work:
1. Add backend schema and Alembic migration for:
   - catalog_sources
   - gaia_dr2_sources
   - import_jobs
   - data_health_checks
2. Add FastAPI endpoint `GET /api/sky/catalog/status`.
3. Add FastAPI endpoint `GET /api/sky/object/gaia-dr2/{source_id}`.
4. Add a tiny importer path for a verified Gaia proof file containing source id `2252802052894084352`.
5. Return explicit `not indexed yet` when the source is absent.
6. Add focused backend tests for the new contracts.

Constraints:
- No fabricated Gaia coordinates or magnitudes.
- No frontend giant catalog loading.
- No dependency on api.noctuasky.com.
- No changes to the live same-origin runtime bundle in this slice.

Validation:
- Run focused backend tests for the new endpoints and migration path.
- Report exact files changed, exact commands run, and pass/fail status.
```

## Completion Rule For This Mirror Foundation Slice

This slice is complete when:

- the public request classes are documented
- official replacement directions are documented
- local storage and promotion boundaries are defined
- downloader tooling exists with guardrails
- downloader tests prove the guardrails

The live same-origin runtime must remain unchanged at the end of this slice.