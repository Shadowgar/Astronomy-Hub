from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from .common import coordinates, finite, read_vizier_tsv, source_attribution, unique_strings


def load_hipparcos(path: str | Path) -> Iterable[dict]:
    source = source_attribution(
        source_key="hipparcos_tier2_local",
        name="ESA Hipparcos / CDS I/239",
        source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239",
        license_note="Hipparcos catalogue source acknowledgement required.",
    )
    for row in json.loads(Path(path).read_text(encoding="utf-8")):
        ra_hours = finite(row.get("right_ascension"))
        dec = finite(row.get("declination"))
        if ra_hours is None or dec is None:
            continue
        source_id = str(row.get("id") or "").strip()
        if not source_id:
            continue
        name = str(row.get("name") or source_id).strip()
        record = {
            "catalog": "Hipparcos Tier 2 (local)",
            "source_id": source_id,
            "model": "star",
            "display_name": name,
            "category": "stars",
            "object_type": "star",
            "ra": ra_hours * 15,
            "dec": dec,
            "names": [name],
            "aliases": unique_strings(source_id, source_id.replace("hip-", "HIP ")),
            "types": ["*"],
            "source_attribution": source,
        }
        if finite(row.get("magnitude")) is not None:
            record["magnitude"] = finite(row["magnitude"])
            record["magnitude_band"] = "V"
        if finite(row.get("color_index")) is not None:
            record["color_index"] = finite(row["color_index"])
        yield record


def load_vizier_stars(path: str | Path, profile: str) -> Iterable[dict]:
    for row in read_vizier_tsv(path):
        position = coordinates(row)
        if position is None:
            continue
        ra, dec = position
        if profile == "gaia_dr3":
            source_id = str(row.get("Source") or "").strip()
            if not source_id:
                continue
            label = f"Gaia DR3 {source_id}"
            record = _star_record(
                catalog="Gaia DR3",
                source_id=source_id,
                display_name=label,
                ra=ra,
                dec=dec,
                aliases=[f"Gaia {source_id}"],
                source_key="gaia_dr3",
                source_name="ESA Gaia DR3 via CDS I/355",
                source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/I/355",
            )
            _copy_number(record, row, "Gmag", "magnitude")
            record["magnitude_band"] = "Gaia G"
            _copy_number(record, row, "BP-RP", "color_index")
            _copy_number(record, row, "Plx", "parallax")
            _copy_number(record, row, "pmRA", "proper_motion_ra")
            _copy_number(record, row, "pmDE", "proper_motion_dec")
            _copy_number(record, row, "RV", "radial_velocity_km_s")
            _copy_number(record, row, "Teff", "temperature_k")
            yield record
        elif profile == "tycho2":
            parts = [str(row.get(field) or "").strip() for field in ("TYC1", "TYC2", "TYC3")]
            if not all(parts):
                continue
            source_id = "-".join(parts)
            label = f"TYC {source_id}"
            aliases = [label]
            hip = str(row.get("HIP") or "").strip()
            if hip:
                aliases.append(f"HIP {hip}")
            record = _star_record(
                catalog="Tycho-2",
                source_id=source_id,
                display_name=label,
                ra=ra,
                dec=dec,
                aliases=aliases,
                source_key="tycho2",
                source_name="Tycho-2 via CDS I/259",
                source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/I/259",
            )
            _copy_number(record, row, "VTmag", "magnitude")
            record["magnitude_band"] = "Tycho V_T"
            _copy_number(record, row, "pmRA", "proper_motion_ra")
            _copy_number(record, row, "pmDE", "proper_motion_dec")
            yield record
        elif profile == "gliese":
            source_id = str(row.get("Name") or "").strip()
            if not source_id or source_id.casefold() == "sun":
                continue
            label = source_id.replace("Gl ", "Gliese ", 1) if source_id.startswith("Gl ") else source_id
            record = _star_record(
                catalog="Gliese CNS3",
                source_id=source_id,
                display_name=label,
                ra=ra,
                dec=dec,
                aliases=unique_strings(source_id, label),
                source_key="gliese_cns3",
                source_name="Catalogue of Nearby Stars CNS3 via CDS V/70A",
                source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/V/70A",
            )
            _copy_number(record, row, "Vmag", "magnitude")
            record["magnitude_band"] = "V"
            _copy_number(record, row, "B-V", "color_index")
            _copy_number(record, row, "plx", "parallax")
            _copy_number(record, row, "RV", "radial_velocity_km_s")
            spectral = str(row.get("Sp") or "").strip()
            if spectral:
                record["spectral_type"] = spectral
            yield record
        else:
            raise ValueError(f"unknown star profile: {profile}")


def _star_record(**values: object) -> dict:
    aliases = list(values.pop("aliases"))
    source_key = str(values.pop("source_key"))
    source_name = str(values.pop("source_name"))
    source_url = str(values.pop("source_url"))
    return {
        **values,
        "model": "star",
        "category": "stars",
        "object_type": "star",
        "names": unique_strings(values["display_name"], aliases),
        "aliases": unique_strings(aliases),
        "types": ["*"],
        "source_attribution": source_attribution(
            source_key=source_key, name=source_name, source_url=source_url
        ),
    }


def _copy_number(target: dict, source: dict[str, str], source_field: str, target_field: str) -> None:
    value = finite(source.get(source_field))
    if value is not None:
        target[target_field] = value
