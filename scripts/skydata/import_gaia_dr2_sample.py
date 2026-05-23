#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.db.models import CatalogSource, GaiaDr2Source, ImportJob
from backend.app.db.session import session_scope

REQUIRED_COLUMNS = {"source_id", "ra", "dec"}
OPTIONAL_COLUMNS = {
    "phot_g_mean_mag",
    "bp_rp",
    "parallax",
    "pmra",
    "pmdec",
}


def import_gaia_dr2_sample(
    input_path: str | Path,
    *,
    database_url: str | None = None,
    dry_run: bool = False,
    source_key: str | None = None,
    display_name: str | None = None,
    source_url: str | None = None,
    license_note: str | None = None,
    version: str | None = None,
) -> dict[str, Any]:
    path = Path(input_path)
    rows = _load_rows(path)
    normalized_rows = [_normalize_row(row, index) for index, row in enumerate(rows, start=1)]

    resolved_source_key = source_key or path.stem.replace(" ", "-").lower()
    resolved_display_name = display_name or f"Gaia DR2 sample import ({path.name})"
    result = {
        "source_key": resolved_source_key,
        "display_name": resolved_display_name,
        "dry_run": dry_run,
        "rows_seen": len(normalized_rows),
        "rows_imported": 0 if dry_run else len(normalized_rows),
        "input_path": str(path.resolve()),
    }
    if dry_run:
        return result

    now = _utc_now()
    with session_scope(database_url) as session:
        catalog_source = session.scalar(
            select(CatalogSource).where(CatalogSource.source_key == resolved_source_key)
        )
        if catalog_source is None:
            catalog_source = CatalogSource(
                source_key=resolved_source_key,
                display_name=resolved_display_name,
                source_family="gaia_dr2",
                version=version,
                source_url=source_url,
                license_note=license_note,
                imported_at=now,
            )
            session.add(catalog_source)
            session.flush()
        else:
            catalog_source.display_name = resolved_display_name
            catalog_source.version = version
            catalog_source.source_url = source_url
            catalog_source.license_note = license_note
            catalog_source.imported_at = now

        job = ImportJob(
            job_key=f"gaia-dr2-import:{resolved_source_key}:{int(now.timestamp())}",
            source_key=resolved_source_key,
            status="running",
            rows_seen=len(normalized_rows),
            rows_imported=0,
        )
        session.add(job)
        session.flush()

        for row in normalized_rows:
            session.merge(
                GaiaDr2Source(
                    source_id=row["source_id"],
                    ra=row["ra"],
                    dec=row["dec"],
                    phot_g_mean_mag=row.get("phot_g_mean_mag"),
                    bp_rp=row.get("bp_rp"),
                    parallax=row.get("parallax"),
                    pmra=row.get("pmra"),
                    pmdec=row.get("pmdec"),
                    catalog_source_id=catalog_source.id,
                    imported_at=now,
                )
            )

        job.status = "success"
        job.rows_imported = len(normalized_rows)
        job.finished_at = now

    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import a bounded Gaia DR2 sample into the ORAS catalog proof tables")
    parser.add_argument("input_path", help="Path to a CSV or TSV file containing Gaia DR2 sample rows")
    parser.add_argument("--database-url", help="Optional database URL override")
    parser.add_argument("--dry-run", action="store_true", help="Validate rows without writing to the database")
    parser.add_argument("--source-key", help="Catalog source key override")
    parser.add_argument("--display-name", help="Catalog source display name override")
    parser.add_argument("--source-url", help="Source URL provenance note")
    parser.add_argument("--license-note", help="License or provenance note")
    parser.add_argument("--version", help="Version string for the imported sample")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    result = import_gaia_dr2_sample(
        args.input_path,
        database_url=args.database_url,
        dry_run=args.dry_run,
        source_key=args.source_key,
        display_name=args.display_name,
        source_url=args.source_url,
        license_note=args.license_note,
        version=args.version,
    )
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


def _load_rows(path: Path) -> list[dict[str, str]]:
    raw_text = path.read_text(encoding="utf-8")
    first_line = raw_text.splitlines()[0] if raw_text.splitlines() else ""
    delimiter = "\t" if "\t" in first_line and "," not in first_line else ","
    reader = csv.DictReader(raw_text.splitlines(), delimiter=delimiter)
    fieldnames = set(reader.fieldnames or [])
    missing = REQUIRED_COLUMNS - fieldnames
    if missing:
        raise ValueError(f"missing required columns: {sorted(missing)}")
    return list(reader)


def _normalize_row(row: dict[str, str], row_number: int) -> dict[str, Any]:
    try:
        source_id = int(_required_value(row, "source_id", row_number))
    except ValueError as exc:
        raise ValueError(f"row {row_number}: invalid source_id") from exc

    ra = _parse_required_float(row, "ra", row_number)
    dec = _parse_required_float(row, "dec", row_number)
    normalized = {
        "source_id": source_id,
        "ra": ra,
        "dec": dec,
    }
    for column in OPTIONAL_COLUMNS:
        normalized[column] = _parse_optional_float(row.get(column))
    return normalized


def _required_value(row: dict[str, str], column: str, row_number: int) -> str:
    value = row.get(column)
    if value is None or str(value).strip() == "":
        raise ValueError(f"row {row_number}: missing {column}")
    return str(value).strip()


def _parse_required_float(row: dict[str, str], column: str, row_number: int) -> float:
    raw_value = _required_value(row, column, row_number)
    try:
        return float(raw_value)
    except ValueError as exc:
        raise ValueError(f"row {row_number}: invalid {column}") from exc


def _parse_optional_float(value: str | None) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    return float(str(value).strip())


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


if __name__ == "__main__":
    raise SystemExit(main())