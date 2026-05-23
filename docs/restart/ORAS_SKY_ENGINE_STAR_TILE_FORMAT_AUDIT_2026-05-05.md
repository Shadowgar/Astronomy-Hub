# ORAS Sky-Engine Star Tile Format Audit - 2026-05-05

## Scope

This document records a bounded reverse-engineering audit of the current local ORAS Sky-Engine star bundle.

This slice is read-only against the live runtime bundle and is limited to format understanding needed for a non-live Capella proof export.

## Files And Source Paths Used

Live runtime bundle inspected:

- `frontend/public/oras-sky-engine/skydata/stars/properties`
- `frontend/public/oras-sky-engine/skydata/stars/Norder0/Dir0/Npix0.eph`
- `frontend/public/oras-sky-engine/skydata/stars/Norder1/Dir0/Npix0.eph`

Authoritative runtime source paths read:

- `vendor/stellarium-web-engine/src/eph-file.c`
- `vendor/stellarium-web-engine/src/eph-file.h`
- `vendor/stellarium-web-engine/src/hips.c`
- `vendor/stellarium-web-engine/src/modules/stars.c`

New read-only audit helper added:

- `scripts/skydata/inspect_star_tiles.py`

## Properties File Findings

Observed properties content:

- `hips_order_min = 0`
- `max_vmag = 7.0`
- `type = stars`
- `hips_tile_format = eph`

Runtime meaning from source:

- `vendor/stellarium-web-engine/src/hips.c` parses `hips_order_min` into `hips->order_min`
- `vendor/stellarium-web-engine/src/hips.c` parses `hips_tile_format` and selects extension `eph`
- `vendor/stellarium-web-engine/src/modules/stars.c` parses `max_vmag` and `min_vmag` for survey gating
- `vendor/stellarium-web-engine/src/modules/stars.c` skips surveys entirely when `survey->min_vmag > painter.stars_limit_mag`

What this means for the current local pack:

- the live bundled survey starts at order 0
- the live bundled survey is capped at `max_vmag = 7.0`
- the live bundle is discovered as a star survey through the HiPS properties path

## Tile Naming Rule

Observed on disk:

- live tiles are stored as `Norder*/Dir*/Npix*.eph`
- current local bundle contains only `Dir0`

Authoritative runtime path template from `vendor/stellarium-web-engine/src/hips.c`:

```c
get_url_for(hips, url, sizeof(url), "Norder%d/Dir%d/Npix%d.%s",
            order, (pix / 10000) * 10000, pix, hips->ext);
```

Implication:

- runtime-compatible staged files would need to follow `Norder{order}/Dir{(pix / 10000) * 10000}/Npix{pix}.eph`

## Live Bundle Inventory

Observed via `scripts/skydata/inspect_star_tiles.py --sample-limit 1`:

- `norder_count = 2`
- `total_tile_count = 44`
- order 0 tile count = `12`
- order 1 tile count = `32`

This confirms the current local stars pack is shallow.

## EPH Container Findings

Authoritative file format from `vendor/stellarium-web-engine/src/eph-file.c`:

- 4-byte magic = `EPHE`
- 4-byte file version = `2`
- followed by a sequence of chunks
- each chunk is `type[4] + data_len[4] + data + crc[4]`

Observed live tile header bytes matched this structure:

- both sampled files started with `EPHE`
- both sampled files reported `file_version = 2`
- both sampled files contained a `JSON` chunk followed by a `STAR` chunk

## JSON Header Findings

Observed JSON chunk in sampled live tiles:

- order 0 sample: `{"children_mask": 15}`
- order 1 sample: `{"children_mask": 0}`

Runtime meaning from `vendor/stellarium-web-engine/src/modules/stars.c`:

- `children_mask` is read from the JSON header
- missing children are converted into tile transparency bits with `(~children_mask) & 15`

Implication:

- runtime-compatible tile emission would need to set a correct `children_mask`
- inventing this mask would be unsafe because it changes traversal behavior

## STAR Chunk Findings

Authoritative parse path from `vendor/stellarium-web-engine/src/modules/stars.c`:

- STAR chunks are parsed through `on_file_tile_loaded`
- tile header is read with `eph_read_tile_header`
- table header is read with `eph_read_table_header`
- compressed table bytes are read with `eph_read_compressed_block`
- byte shuffling is conditionally undone with `eph_shuffle_bytes`

Observed sampled live STAR payloads:

- tile header version = `3`
- sampled order 0 tile resolved to `order = 0`, `pix = 0`, `nuniq = 4`
- sampled order 1 tile resolved to `order = 1`, `pix = 0`, `nuniq = 16`

Observed sampled live table header fields:

- `flags = 1`
- `row_size = 292`
- `column_count = 10`

Observed sampled row counts:

- order 0 sample row count = `1024`
- order 1 sample row count = `87`

The `flags = 1` value matters because `vendor/stellarium-web-engine/src/eph-file.c` defines it as shuffled row bytes before compression.

## Observed Live STAR Columns

Sampled local STAR tiles exposed these columns:

- `hip`
- `hd`
- `vmag`
- `ra`
- `de`
- `plx`
- `pra`
- `pde`
- `bv`
- `ids`

Runtime parser in `vendor/stellarium-web-engine/src/modules/stars.c` supports a wider schema:

- `type`
- `gaia`
- `hip`
- `vmag`
- `gmag`
- `ra`
- `de`
- `plx`
- `pra`
- `pde`
- `epoc`
- `bv`
- `ids`
- `spec`

What this means:

- the live local bright-star tiles are using a STAR schema without Gaia-specific fields in the sampled tiles
- the loader can parse Gaia-oriented fields, but sampled local pack bytes do not prove the exact writer behavior for Gaia STAR or GAIA chunks

## Unit Findings

Observed units from the sampled local tiles and `vendor/stellarium-web-engine/src/eph-file.h`:

- `vmag` uses `EPH_VMAG`
- `ra` and `de` use `EPH_RAD`
- `plx` uses `EPH_ARCSEC`
- `pra` and `pde` use `EPH_RAD_PER_YEAR`
- `ids` is a fixed-size string column

Runtime parse notes from `vendor/stellarium-web-engine/src/modules/stars.c`:

- `ra` and `de` are asserted non-null
- `vmag` falls back to `gmag` when `vmag` is missing
- `epoch` defaults to `2000`
- Gaia survey rows below `survey->min_vmag` are skipped to avoid overlap with brighter surveys

## What Is Proven

This audit proves that the local live stars bundle uses:

- HiPS discovery through the `properties` file
- file extension `eph`
- `EPHE` file version `2`
- `JSON` and `STAR` chunk sequencing
- tile header version `3`
- compressed, byte-shuffled tabular payloads
- a fixed column layout with unit metadata
- HiPS child traversal metadata through `children_mask`

## What Is Not Yet Safe To Claim

This audit does not prove that ORAS can safely emit runtime-compatible `.eph` star tiles yet.

Blocking gaps:

- no EPH writer or star-tile generator was found in the current repo
- no local code path writes chunk CRCs, compressed blocks, or shuffled STAR rows
- no authoritative Gaia STAR writer was found to define exact output behavior for `children_mask`, ordering, compression, and chunk emission

## Current Conclusion

Status for runtime-compatible `.eph` proof emission:

- `BLOCKED`

Reason:

- the read path is sufficiently understood for auditing and normalized export
- the authoritative writer discovery pass found no checked-in local or vendored upstream star-tile writer
- the write path is not present locally, so emitting guessed `.eph` bytes would violate the no-fabrication rule

See also:

- `docs/restart/ORAS_SKY_ENGINE_AUTHORITATIVE_EPH_WRITER_DISCOVERY_2026-05-05.md`

## Exact Next Step

- keep proof output staged under `data/processed/...`
- export Capella Gaia rows as normalized JSONL plus manifest only
- only attempt `.eph` emission after obtaining or implementing an authoritative writer that matches the Stellarium chunk, compression, byte-shuffle, CRC, and traversal semantics