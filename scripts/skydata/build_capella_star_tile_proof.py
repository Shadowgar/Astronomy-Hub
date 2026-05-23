#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.db.models import CatalogSource, GaiaDr2Source
from backend.app.db.session import session_scope
from scripts.skydata.common import REPO_ROOT, RuntimeProtectionError, is_runtime_path

DEFAULT_SOURCE_KEY = "gaia-dr2-capella-region-proof"
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "data/processed/gaia_tiles/capella-proof"
NORMALIZED_ROWS_FILENAME = "capella_gaia_stars.normalized.jsonl"
MANIFEST_FILENAME = "manifest.json"
EPH_BLOCKER = (
    "Runtime-compatible EPH output is blocked: the vendored runtime exposes an EPH reader "
    "and STAR chunk layout, but this repo does not contain a star-tile EPH writer to emit "
    "safe live-compatible bytes."
)
WRITER_DISCOVERY_EVIDENCE = [
    {
        "path": "vendor/stellarium-web-engine/src/eph-file.c",
        "finding": "Defines the EPHE container read path and format checks only; no writer entrypoint is present.",
    },
    {
        "path": "vendor/stellarium-web-engine/SConstruct",
        "finding": "Invokes tools/make-assets.py before build, which packages preexisting assets but does not generate star tiles.",
    },
    {
        "path": "vendor/stellarium-web-engine/tools/make-assets.py",
        "finding": "Packages existing .eph files into compiled assets; it does not construct STAR chunks or tile payloads.",
    },
    {
        "path": "vendor/stellarium-web-engine/tools/make-hip-lookup.py",
        "finding": "Generates src/hip.inl lookup data only; it does not emit HiPS Norder*/Dir*/Npix*.eph files.",
    },
    {
        "path": "scripts/sky-engine/build_hipparcos_tiles.py",
        "finding": "Generates JSON tile assets under frontend/public/sky-engine-assets/catalog/hipparcos, not runtime-compatible .eph star tiles.",
    },
]


def build_capella_star_tile_proof(
    *,
    database_url: str | None = None,
    source_key: str = DEFAULT_SOURCE_KEY,
    output_root: str | Path = DEFAULT_OUTPUT_ROOT,
) -> dict[str, Any]:
    output_dir = Path(output_root).resolve()
    _assert_non_runtime_output(output_dir)

    rows, source = _load_source_rows(source_key=source_key, database_url=database_url)
    normalized_rows = _normalize_rows(rows, source_key=source.source_key)

    output_dir.mkdir(parents=True, exist_ok=True)
    normalized_rows_path = output_dir / NORMALIZED_ROWS_FILENAME
    manifest_path = output_dir / MANIFEST_FILENAME

    with normalized_rows_path.open("w", encoding="utf-8") as handle:
        for row in normalized_rows:
            handle.write(json.dumps(row, sort_keys=True))
            handle.write("\n")

    generated_at = _utc_now().isoformat()
    manifest = {
        "proof_type": "capella_gaia_star_tile_proof",
        "status": "partial",
        "generated_at": generated_at,
        "source_key": source.source_key,
        "source_display_name": source.display_name,
        "source_family": source.source_family,
        "row_count": len(normalized_rows),
        "output_root": str(output_dir),
        "runtime_compatible_eph_emitted": False,
        "writer_strategy": "C",
        "writer_discovery": _build_writer_discovery(),
        "blocker": EPH_BLOCKER,
        "artifacts": [
            {
                "kind": "normalized_jsonl",
                "path": str(normalized_rows_path),
                "row_count": len(normalized_rows),
            },
            {
                "kind": "manifest",
                "path": str(manifest_path),
            },
        ],
    }

    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2, sort_keys=True)
        handle.write("\n")

    return {
        "generated_at": generated_at,
        "source_key": source.source_key,
        "row_count": len(normalized_rows),
        "normalized_rows_path": str(normalized_rows_path),
        "manifest_path": str(manifest_path),
        "runtime_compatible_eph_emitted": False,
        "writer_strategy": "C",
        "blocker": EPH_BLOCKER,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export Capella Gaia proof rows into staged non-live artifacts"
    )
    parser.add_argument("--database-url", help="Optional database URL override")
    parser.add_argument(
        "--source-key",
        default=DEFAULT_SOURCE_KEY,
        help="Catalog source key to export",
    )
    parser.add_argument(
        "--output-root",
        default=str(DEFAULT_OUTPUT_ROOT),
        help="Directory for staged proof artifacts. Live runtime skydata paths are refused.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = build_capella_star_tile_proof(
        database_url=args.database_url,
        source_key=args.source_key,
        output_root=args.output_root,
    )
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


def _assert_non_runtime_output(path: Path) -> None:
    if is_runtime_path(path):
        raise RuntimeProtectionError(f"Refusing to write staged proof output into live runtime skydata: {path}")


def _load_source_rows(*, source_key: str, database_url: str | None) -> tuple[list[GaiaDr2Source], CatalogSource]:
    with session_scope(database_url) as session:
        pairs = session.execute(
            select(GaiaDr2Source, CatalogSource)
            .join(CatalogSource, CatalogSource.id == GaiaDr2Source.catalog_source_id)
            .where(CatalogSource.source_key == source_key)
        ).all()

    if not pairs:
        raise ValueError(f"No Gaia DR2 rows found for source_key={source_key}")

    source = pairs[0][1]
    rows = [pair[0] for pair in pairs]
    return rows, source


def _normalize_rows(rows: list[GaiaDr2Source], *, source_key: str) -> list[dict[str, Any]]:
    normalized_rows = [
        {
            "source_id": row.source_id,
            "catalog": "Gaia DR2",
            "source_key": source_key,
            "ra_deg": row.ra,
            "dec_deg": row.dec,
            "phot_g_mean_mag": row.phot_g_mean_mag,
            "bp_rp": row.bp_rp,
            "parallax_mas": row.parallax,
            "pmra_mas_per_year": row.pmra,
            "pmdec_mas_per_year": row.pmdec,
        }
        for row in rows
    ]
    normalized_rows.sort(
        key=lambda row: (
            float("inf") if row["phot_g_mean_mag"] is None else row["phot_g_mean_mag"],
            row["source_id"],
        )
    )
    return normalized_rows


def _build_writer_discovery() -> dict[str, Any]:
    return {
        "writer_found": False,
        "strategy": "C",
        "summary": "No authoritative in-repo or vendored upstream star-tile EPH writer was found; staged proof remains blocked at normalized JSONL plus manifest.",
        "evidence": WRITER_DISCOVERY_EVIDENCE,
    }


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


if __name__ == "__main__":
    raise SystemExit(main())