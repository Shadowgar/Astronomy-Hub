from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .common import coordinates, finite, read_vizier_tsv, sexagesimal_dec, sexagesimal_ra, source_attribution, unique_strings


def load_atnf(path: str | Path) -> Iterable[dict]:
    source = source_attribution(
        source_key="atnf_psrcat",
        name="ATNF Pulsar Catalogue",
        source_url="https://www.atnf.csiro.au/research/pulsar/psrcat/",
        license_note="CSIRO ATNF catalogue notice applies; cite Manchester et al. (2005) and the PSRCAT URL.",
    )
    current: dict[str, str] = {}
    for line in [*Path(path).read_text(encoding="utf-8", errors="replace").splitlines(), "@"]:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("@"):
            name = current.get("PSRJ") or current.get("PSRB")
            ra = sexagesimal_ra(current.get("RAJ", ""))
            dec = sexagesimal_dec(current.get("DECJ", ""))
            if name and ra is not None and dec is not None:
                record = {
                    "catalog": "ATNF Pulsar",
                    "source_id": name,
                    "model": "dso",
                    "display_name": f"PSR {name}",
                    "category": "unusual-objects",
                    "object_type": "pulsar",
                    "ra": ra,
                    "dec": dec,
                    "names": unique_strings(f"PSR {name}", name),
                    "aliases": unique_strings(current.get("PSRB")),
                    "types": ["Psr"],
                    "source_attribution": source,
                }
                period = finite(current.get("P0"))
                flux = finite(current.get("S1400"))
                if period is not None:
                    record["period_seconds"] = period
                if flux is not None:
                    record["flux"] = flux
                yield record
            current = {}
            continue
        key, _, rest = line.partition(" ")
        value = rest.strip().split()[0] if rest.strip() else ""
        if key and value and key not in current:
            current[key] = value


def load_vizier_unusual(path: str | Path, profile: str) -> Iterable[dict]:
    for row in read_vizier_tsv(path):
        position = coordinates(row)
        if position is None:
            continue
        ra, dec = position
        if profile == "milliquas":
            name = str(row.get("Name") or "").strip()
            if not name:
                continue
            record = _unusual_record(
                catalog="Milliquas 7.2",
                source_id=name,
                display_name=name,
                object_type="quasar",
                types=["QSO"],
                ra=ra,
                dec=dec,
                source_key="milliquas_v7_2",
                source_name="Million Quasars v7.2 via CDS VII/290",
                source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/290",
                license_note="Cite Milliquas v7.2, Flesch (2021), and the CDS catalogue.",
            )
            magnitude = finite(row.get("Rmag")) or finite(row.get("Bmag"))
            if magnitude is not None:
                record["magnitude"] = magnitude
            redshift = finite(row.get("z"))
            if redshift is not None:
                record["redshift"] = redshift
            yield record
        elif profile == "blackcat":
            name = str(row.get("Name") or "").strip()
            if not name:
                continue
            record = _unusual_record(
                catalog="BlackCAT",
                source_id=name,
                display_name=name,
                object_type="black_hole_candidate",
                types=["BH"],
                ra=ra,
                dec=dec,
                source_key="blackcat",
                source_name="BlackCAT via CDS J/A+A/587/A61",
                source_url="https://cdsarc.cds.unistra.fr/viz-bin/cat/J/A+A/587/A61",
                license_note="Cite Corral-Santana et al. (2016) and the BlackCAT catalogue.",
            )
            distance_kpc = finite(row.get("Dist"))
            if distance_kpc is not None:
                record["distance_pc"] = distance_kpc * 1000
            candidate = str(row.get("Type") or "").strip()
            if candidate:
                record["candidate_status"] = candidate
            yield record
        else:
            raise ValueError(f"unknown unusual-object profile: {profile}")


def _unusual_record(*, license_note: str, **values: object) -> dict:
    source_key = str(values.pop("source_key"))
    source_name = str(values.pop("source_name"))
    source_url = str(values.pop("source_url"))
    return {
        **values,
        "model": "dso",
        "category": "unusual-objects",
        "names": [str(values["display_name"])],
        "aliases": [],
        "source_attribution": source_attribution(
            source_key=source_key,
            name=source_name,
            source_url=source_url,
            license_note=license_note,
        ),
    }
