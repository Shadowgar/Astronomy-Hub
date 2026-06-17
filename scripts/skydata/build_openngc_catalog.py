from __future__ import annotations

import argparse
import csv
import gzip
import json
from pathlib import Path
import re
from typing import Any


OPENNGC_SOURCE_URL = "https://github.com/mattiaverga/OpenNGC"
OPENNGC_RAW_CSV_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
OPENNGC_LICENSE_NOTE = "OpenNGC by Mattia Verga, CC-BY-SA-4.0"

SKIPPED_TYPES = {"*", "**", "NonEx", "Dup", "Nova"}

TYPE_MAP = {
    "*Ass": ("group_of_stars", "As*"),
    "OCl": ("open_cluster", "OpC"),
    "GCl": ("globular_cluster", "GlC"),
    "Cl+N": ("nebula", "BNe"),
    "G": ("galaxy", "G"),
    "GPair": ("pair_of_galaxies", "PaG"),
    "GTrpl": ("group_of_galaxies", "GrG"),
    "GGroup": ("group_of_galaxies", "GrG"),
    "PN": ("planetary_nebula", "PN"),
    "HII": ("nebula", "BNe"),
    "DrkN": ("dark_nebula", "BNe"),
    "EmN": ("nebula", "BNe"),
    "Neb": ("nebula", "BNe"),
    "RfN": ("nebula", "BNe"),
    "SNR": ("supernova_remnant", "SNR"),
    "Other": ("dso", "dso"),
}


def build_catalog(input_path: Path, output_path: Path) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    skipped = 0
    with input_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            record = normalize_row(row)
            if record is None:
                skipped += 1
                continue
            records.append(record)

    payload = {
        "source": {
            "name": "OpenNGC",
            "source_url": OPENNGC_SOURCE_URL,
            "raw_csv_url": OPENNGC_RAW_CSV_URL,
            "license_note": OPENNGC_LICENSE_NOTE,
            "schema_version": 1,
        },
        "count": len(records),
        "skipped_count": skipped,
        "records": records,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(payload, separators=(",", ":"), sort_keys=True) + "\n"
    if output_path.suffix == ".gz":
        with gzip.open(output_path, "wt", encoding="utf-8") as handle:
            handle.write(serialized)
    else:
        output_path.write_text(serialized, encoding="utf-8")
    return payload


def normalize_row(row: dict[str, str]) -> dict[str, Any] | None:
    source_id = str(row.get("Name") or "").strip()
    raw_type = str(row.get("Type") or "").strip()
    if not source_id or raw_type in SKIPPED_TYPES or raw_type not in TYPE_MAP:
        return None

    ra = _ra_to_degrees(row.get("RA"))
    dec = _dec_to_degrees(row.get("Dec"))
    if ra is None or dec is None:
        return None

    object_type, stellarium_type = TYPE_MAP[raw_type]
    prefix = "IC" if source_id.startswith("IC") else "NGC"
    catalog = f"{prefix} (OpenNGC)"
    messier_id = _messier_id(row.get("M"))
    common_names = _split_list(row.get("Common names"))
    identifiers = _split_list(row.get("Identifiers"))
    names = _unique(
        [
            _display_catalog_id(source_id),
            source_id,
            *(common_names or []),
            messier_id,
            f"Messier {messier_id[1:]}" if messier_id else None,
            *identifiers,
        ]
    )
    display_name = _display_catalog_id(source_id)
    if common_names:
        display_name = f"{display_name} {common_names[0]}"

    return {
        "catalog": catalog,
        "source_id": source_id,
        "display_name": display_name,
        "model": "dso",
        "names": names,
        "aliases": _unique([*names, row.get("NGC"), row.get("IC")]),
        "types": [stellarium_type],
        "raw_type": raw_type,
        "object_type": object_type,
        "ra": ra,
        "dec": dec,
        "constellation": _empty_to_none(row.get("Const")),
        "magnitude": _first_float(row.get("V-Mag"), row.get("B-Mag")),
        "magnitudes": {
            "b": _optional_float(row.get("B-Mag")),
            "v": _optional_float(row.get("V-Mag")),
            "j": _optional_float(row.get("J-Mag")),
            "h": _optional_float(row.get("H-Mag")),
            "k": _optional_float(row.get("K-Mag")),
        },
        "angular_size": {
            "major_arcmin": _optional_float(row.get("MajAx")),
            "minor_arcmin": _optional_float(row.get("MinAx")),
            "position_angle_deg": _optional_float(row.get("PosAng")),
        },
        "messier_id": messier_id,
        "ngc_cross_id": _catalog_cross_id("NGC", row.get("NGC")),
        "ic_cross_id": _catalog_cross_id("IC", row.get("IC")),
        "identifiers": identifiers,
        "common_names": common_names,
        "hubble_type": _empty_to_none(row.get("Hubble")),
        "provenance": {
            "source_key": "openngc_local",
            "license_note": OPENNGC_LICENSE_NOTE,
        },
    }


def _ra_to_degrees(value: str | None) -> float | None:
    parts = str(value or "").strip().split(":")
    if len(parts) != 3:
        return None
    try:
        hours, minutes, seconds = [float(part) for part in parts]
    except Exception:
        return None
    return round(((hours + (minutes / 60.0) + (seconds / 3600.0)) * 15.0) % 360.0, 10)


def _dec_to_degrees(value: str | None) -> float | None:
    text = str(value or "").strip()
    parts = text.replace("+", "").replace("-", "").split(":")
    if len(parts) != 3:
        return None
    try:
        degrees, minutes, seconds = [float(part) for part in parts]
    except Exception:
        return None
    sign = -1.0 if text.startswith("-") else 1.0
    return round(sign * (degrees + (minutes / 60.0) + (seconds / 3600.0)), 10)


def _messier_id(value: str | None) -> str | None:
    text = str(value or "").strip()
    return f"M{int(text)}" if text.isdigit() else None


def _catalog_cross_id(prefix: str, value: str | None) -> str | None:
    text = str(value or "").strip()
    return f"{prefix}{int(text):04d}" if text.isdigit() else None


def _display_catalog_id(source_id: str) -> str:
    prefix = "IC" if source_id.startswith("IC") else "NGC"
    match = re.match(r"^(NGC|IC)(\d+)(.*)$", source_id)
    if not match:
        return source_id
    suffix = match.group(3).strip()
    display = f"{prefix} {int(match.group(2))}"
    return f"{display} {suffix}" if suffix else display


def _split_list(value: str | None) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def _unique(values: list[str | None]) -> list[str]:
    result: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text and text not in result:
            result.append(text)
    return result


def _optional_float(value: str | None) -> float | None:
    text = str(value or "").strip()
    if not text:
        return None
    try:
        return float(text)
    except Exception:
        return None


def _first_float(*values: str | None) -> float | None:
    for value in values:
        parsed = _optional_float(value)
        if parsed is not None:
            return parsed
    return None


def _empty_to_none(value: str | None) -> str | None:
    text = str(value or "").strip()
    return text or None


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize OpenNGC CSV into the ORAS backend DSO catalog.")
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    payload = build_catalog(args.input, args.output)
    print(f"wrote {payload['count']} OpenNGC DSO records; skipped {payload['skipped_count']}")


if __name__ == "__main__":
    main()
